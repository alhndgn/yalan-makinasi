import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { previewQuerySchema, saveLieRequestSchema, updateStatusSchema } from '../../shared/schema.ts';
import { detailCountFor } from '../../engine/compose.ts';
import { buildQueries } from '../../engine/queries.ts';
import { mulberry32 } from '../../engine/random.ts';
import { scoreRisk } from '../../engine/risk.ts';
import { countConflicts } from '../../engine/types.ts';
import { banks, type Detail } from '../../engine/templates/tr.ts';
import {
  deleteAllLies,
  deleteLie,
  findConflictPairs,
  insertLie,
  listLies,
  listRecentForTarget,
  updateLieStatus,
} from '../db.ts';
import { deviceIdOf, fail } from './helpers.ts';

const limitSchema = z.coerce.number().int().min(1).max(100).catch(50);
const DOCUMENT_WORDS = /(rapor|belge|imza|fatura|ehliyet)/i;

/** Metinde geçen detay cümlelerini (soru/cevap dahil) bulur. */
function matchedDetails(situation: string, text: string): Detail[] {
  const bank = banks[situation as keyof typeof banks];
  if (!bank) return [];
  return bank.details.filter((detail) => text.includes(detail.text));
}

export function registerLieRoutes(app: FastifyInstance, db: DatabaseSync) {
  app.get('/api/lies', async (req) => {
    const limit = limitSchema.parse((req.query as { limit?: unknown }).limit ?? 50);
    return { items: listLies(db, deviceIdOf(req), limit) };
  });

  app.post('/api/lies', async (req, reply) => {
    const parsed = saveLieRequestSchema.safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Kayıt gövdesi geçersiz.');

    const { variant, form } = parsed.data;
    const deviceId = deviceIdOf(req);

    // Sunucu otoritesi: risk ve sorgular istemciden değil, metinden yeniden üretilir.
    const details = matchedDetails(form.situation, variant.text);
    const detailTags = [...new Set(details.map((d) => d.tag))];
    const recent = listRecentForTarget(db, deviceId, form.target);
    const risk = scoreRisk({
      intensity: form.intensity,
      target: form.target,
      channel: form.channel,
      detailCount: details.length,
      hasSecondPerson: detailTags.includes('ikinci_kisi'),
      hasLocation: detailTags.includes('konum'),
      mentionsDocument: DOCUMENT_WORDS.test(variant.text),
      conflictCount: countConflicts(recent, form.situation, detailTags),
    });

    const id = randomUUID();
    insertLie(db, {
      id,
      deviceId,
      target: form.target,
      situation: form.situation,
      situationCustom: form.situationCustom ?? null,
      channel: form.channel,
      style: form.style,
      intensity: form.intensity,
      text: variant.text,
      strategy: variant.strategy,
      riskScore: risk.score,
      riskReasons: risk.reasons,
      queries: details.length > 0 ? buildQueries(details, mulberry32(id.length)) : variant.queries,
      detailTags,
      provider: parsed.data.provider ?? 'template',
      status: 'beklemede',
    });

    return { id, createdAt: Date.now() };
  });

  app.get('/api/lies/conflicts', async (req) => ({
    conflicts: findConflictPairs(db, deviceIdOf(req)),
  }));

  app.get('/api/lies/conflicts/preview', async (req, reply) => {
    const parsed = previewQuerySchema.safeParse(req.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Önizleme parametreleri geçersiz.');
    const { target, situation, channel, intensity } = parsed.data;
    const recent = listRecentForTarget(db, deviceIdOf(req), target);
    const risk = scoreRisk({
      intensity,
      target,
      channel,
      detailCount: detailCountFor(intensity),
      hasSecondPerson: false,
      hasLocation: false,
      mentionsDocument: false,
      conflictCount: countConflicts(recent, situation, []),
    });
    return { score: risk.score, level: risk.level, reasons: risk.reasons };
  });

  app.patch('/api/lies/:id', async (req, reply) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Durum "beklemede", "tuttu" veya "tutmadı" olmalı.');
    const { id } = req.params as { id: string };
    const ok = updateLieStatus(db, id, deviceIdOf(req), parsed.data.status);
    if (!ok) return fail(reply, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');
    return { ok: true };
  });

  app.delete('/api/lies/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = deleteLie(db, id, deviceIdOf(req));
    if (!ok) return fail(reply, 404, 'NOT_FOUND', 'Kayıt bulunamadı.');
    return { ok: true };
  });

  app.delete('/api/lies', async (req) => ({ deleted: deleteAllLies(db, deviceIdOf(req)) }));
}
