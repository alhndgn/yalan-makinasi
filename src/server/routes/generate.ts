import type { FastifyInstance } from 'fastify';
import type { DatabaseSync } from 'node:sqlite';
import { generateRequestSchema } from '../../shared/schema.ts';
import type { LlmProvider } from '../../engine/types.ts';
import { getPersonProfile, listHistoryForPerson, listRecentForTarget } from '../db.ts';
import { isAbusive } from '../abuse.ts';
import { deviceIdOf, fail } from './helpers.ts';

export function registerGenerateRoutes(app: FastifyInstance, db: DatabaseSync, provider: LlmProvider) {
  app.post('/api/generate', async (req, reply) => {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join('.') ?? 'girdi';
      return fail(reply, 400, 'VALIDATION', `Geçersiz alan: ${field}.`);
    }

    const body = parsed.data;
    if (isAbusive(body.situationCustom)) {
      return fail(reply, 400, 'ABUSE_BLOCKED', 'Bu tür bir metin üretemem (belge, rapor, resmî kayıt).');
    }

    const deviceId = deviceIdOf(req);
    const recent = listRecentForTarget(db, deviceId, body.target);
    const saltQuery = (req.query as { salt?: unknown }).salt;
    const salt = saltQuery === undefined ? String(Date.now()) : String(saltQuery);

    const person = (body.person ?? '').trim();
    const history = person ? listHistoryForPerson(db, deviceId, person) : [];
    const profile = person ? getPersonProfile(db, deviceId, person) : null;
    const result = await provider.generate(body, { deviceId, salt, recent, person, history, profile, hint: body.hint });
    return { variants: result.variants, provider: result.provider };
  });
}
