import { classesToSkip } from '@/config/log.config';
import { screenSensitiveData } from '@/utils/screening.util';

import type { FastifyRequest } from 'fastify';

export function safeStringify(value: unknown): string {
  try {
    const cache = new WeakSet<object>();

    const replacer = (_: string, v: unknown): unknown => {
      if (Array.isArray(v)) {
        return handleArray(v);
      }

      if (typeof v === 'object' && v !== null) {
        if (cache.has(v)) return '[Circular]';
        cache.add(v);

        return handleObject(v);
      }

      if (typeof v === 'bigint') return v.toString();

      return v;
    };

    const str = JSON.stringify(value, replacer);
    return screenSensitiveData(str);
  } catch {
    return '[Unserializable]';
  }
}

function handleObject(v: object): unknown {
  const ctorName = (v as { constructor?: { name?: string } }).constructor?.name;

  if (isExpressRequest(v, ctorName))
    return simplifyRequest(v as FastifyRequest);
  if (ctorName != undefined && isSkipClass(ctorName)) return `[${ctorName}]`;

  return v;
}

function handleArray(v: unknown[]): unknown {
  if (v.length === 0) return v;

  const previewStrings = v.slice(0, 3).map((x) => {
    if (x == undefined) return 'undefined';
    if (typeof x === 'function') return `[Function${x.name}]`;
    return JSON.stringify(x);
  });

  return `[Array(${v.length.toString()}) sample: ${previewStrings.join(', ')}]`;
}

function isExpressRequest(v: object, ctorName?: string): boolean {
  return ctorName === 'IncomingMessage' && 'method' in v && 'url' in v;
}

function simplifyRequest(req: FastifyRequest): Record<string, unknown> {
  const { headers = {} } = req;
  return {
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    body: req.body,
    baseUrl: req.url,
    originalUrl: req.originalUrl,
    headers: {
      host: headers.host ?? 'unknown host',
      authorization:
        typeof headers.authorization === 'string' &&
        headers.authorization.length > 0
          ? '[REDACTED TOKEN]'
          : 'unknown authorization',
      'user-agent': headers['user-agent'] ?? 'unknown user-agent',
      referer: headers.referer ?? 'unknown referer',
      'x-forwarded-for': headers['x-forwarded-for'],
    },
  };
}

function isSkipClass(ctorName?: string): boolean {
  return Boolean(ctorName != undefined && classesToSkip.includes(ctorName));
}
