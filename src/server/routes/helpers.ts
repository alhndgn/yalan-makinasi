import type { FastifyReply, FastifyRequest } from 'fastify';

export type ApiError = { error: { code: string; message: string } };

export function fail(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } } satisfies ApiError);
}

export function deviceIdOf(req: FastifyRequest): string {
  return String(req.headers['x-device-id'] ?? '');
}
