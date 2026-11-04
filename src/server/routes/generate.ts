import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { generateRequestSchema } from '../../shared/schema.ts';
import type { LlmProvider } from '../../engine/types.ts';
import { findConflicts } from '../db.ts';
import { isAbusive } from '../abuse.ts';
import { fail, deviceIdOf } from './helpers.ts';

export function registerGenerateRoutes(app: FastifyInstance, db: DatabaseSync, provider: LlmProvider) {
  app.post('/api/generate', async (req, reply) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Girdi geçersiz. Şiddet 1-10 arasında olmalı.');
    }
    const body = parsed.data;
    if (isAbusive(body.situationCustom)) {
      return fail(reply, 400, 'ABUSE_BLOCKED', 'Bu tür bir metin üretemem (belge, rapor, resmî kayıt).');
    }

    const deviceId = deviceIdOf(req);
    const conflicts = findConflicts(db, deviceId, body.target, body.situation, []);
    const salt = typeof req.query === 'object' && req.query !== null && 'salt' in req.query
      ? String((req.query as { salt?: unknown }).salt ?? Date.now())
      : String(Date.now());

    const variants = await provider.generate(body, { deviceId, salt, conflictCount: conflicts.length });
    return { variants, provider: provider.id };
  });
}
