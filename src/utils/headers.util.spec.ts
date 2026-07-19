import { extractBearerFromHeader } from '@/utils/headers.util';

import type { FastifyRequest } from 'fastify';

function createMockRequest(authorizationValue?: string): FastifyRequest {
  return {
    headers: {
      authorization: authorizationValue,
    },
  } as unknown as FastifyRequest;
}

describe('extractBearerFromHeader - Successful Extraction Paths', () => {
  it('should successfully extract and return the token string from a valid Bearer schema configuration', () => {
    const mockReq = createMockRequest('Bearer secure-jwt-token-string-2026');
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBe('secure-jwt-token-string-2026');
  });

  it('should return an empty string if the schema prefix is present but the token string itself is blank', () => {
    const mockReq = createMockRequest('Bearer ');
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBe('');
  });
});

describe('extractBearerFromHeader - Missing and Malformed Header Guards', () => {
  it('should return undefined if the authorization header is completely missing from request context headers', () => {
    const mockReq = createMockRequest();
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBeUndefined();
  });

  it('should return undefined if the header value uses an alternate auth scheme like Basic or Digest', () => {
    const mockReq = createMockRequest('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBeUndefined();
  });

  it('should return undefined if the prefix token schema identifier violates case sensitivity constraints', () => {
    const mockReq = createMockRequest('bearer token-value-here');
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBeUndefined();
  });

  it('should return undefined if the authorization string is completely broken or lacks clear spacing separators', () => {
    const mockReq = createMockRequest('BearerTokenWithoutSpacesXYZ');
    const token = extractBearerFromHeader(mockReq);

    expect(token).toBeUndefined();
  });
});
