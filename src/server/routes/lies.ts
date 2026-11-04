import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { previewQuerySchema, saveLieRequestSchema, updateStatusSchema } from '../../shared/schema.ts';
import { detailCountFor } from '../../engine/compose.ts';
import { scoreRisk } from '../../engine/risk.ts';
import { extractDetailTags } from '../../engine/tags.ts';
import {
  deleteAllLies,
  deleteLie,
  findConflicts,
  insertLie,
  listLies,
  listRecentByTarget,
  updateLieStatus,
} from '../db.ts';
import { deviceIdOf, fail } from './helpers.ts';

export function registerLieRoutes(app: FastifyInstance, db: DatabaseSync) {
  app.get('/api/lies', async (req) => {
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    return { items: listLies(db, deviceIdOf(req), Number.isFinite(limit) ? limit : 50) };
  });

  app.post('/api/lies', async (req, reply) => {
    const parsed = saveLieRequestSchema.safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Kayıt gövdesi geçersiz.');

    const { variant, form } = parsed.data;
    const id = randomUUID();
    insertLie(db, {
      id,
      deviceId: deviceIdOf(req),
      target: form.target,
      situation: form.situation,
      situationCustom: form.situationCustom ?? null,
      channel: form.channel,
      style: form.style,
      intensity: form.intensity,
      text: variant.text,
      strategy: variant.strategy,
      riskScore: variant.riskScore,
      riskReasons: variant.riskReasons,
      queries: variant.queries,
      detailTags: extractDetailTags(form.situation, variant.text),
      provider: 'template',
      status: 'beklemede',
    });
    return { id, createdAt: Date.now() };
  });

  app.get('/api/lies/conflicts', async (req, reply) => {
    const target = (req.query as { target?: string }).target;
    if (!target) return fail(reply, 400, 'VALIDATION', 'target parametresi gerekli.');
    return { conflicts: listRecentByTarget(db, deviceIdOf(req), target as never) };
  });

  app.get('/api/lies/conflicts/preview', async (req, reply) => {
    const parsed = previewQuerySchema.safeParse(req.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Önizleme parametreleri geçersiz.');
    const { target, situation, channel, intensity } = parsed.data;
    const conflicts = findConflicts(db, deviceIdOf(req), target, situation, []);
    const risk = scoreRisk({
      intensity,
      target,
      channel,
      detailCount: detailCountFor(intensity),
      hasSecondPerson: false,
      hasLocation: false,
      mentionsDocument: false,
      conflictCount: conflicts.length,
    });
    return { score: risk.score, level: risk.level, reasons: risk.reasons };
  });

  app.patch('/api/lies/:id', async (req, reply) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Durum "tuttu" veya "tutmadı" olmalı.');
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
