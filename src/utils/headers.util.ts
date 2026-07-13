import type { FastifyRequest } from 'fastify';

export const extractBearerFromHeader = (
  request: FastifyRequest,
): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
};
