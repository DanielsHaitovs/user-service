import { classesToSkip } from '@/config/log.config';
import { safeStringify } from '@/utils/safeStringify';
import { getTraceId } from '@/utils/trace.util';
import { Logger, type OnModuleInit } from '@nestjs/common';

import { EntityManager, Repository } from 'typeorm';

import 'reflect-metadata';

type GenericObject = Record<string, unknown>;

function wrapMethods(proto: GenericObject, logger: Logger): void {
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue;

    const original = proto[key];
    if (typeof original !== 'function') continue;

    const fn = original as (...args: unknown[]) => unknown;
    if ((fn as { __isTraced?: boolean }).__isTraced === true) continue;

    const wrapped = function (this: object, ...args: unknown[]): unknown {
      const traceId: string = getTraceId() ?? 'no-trace';
      const ctor = (this as { constructor: { name?: string } }).constructor;
      const className: string = ctor.name ?? 'Unknown';

      logger.log(
        `[Trace: ${traceId}] -> ${className} -> ${String(key)} args: ${safeStringify(args)}`,
      );

      const result = fn.apply(this, args);

      if (result instanceof Promise) {
        return result.then((res: unknown) => {
          logger.verbose(
            `[Trace: ${traceId}] <- ${className} <- ${String(key)} returned: ${safeStringify(res)}`,
          );
          return res;
        });
      }

      logger.verbose(
        `[Trace: ${traceId}] <- ${className} <- ${String(key)} returned: ${safeStringify(result)}`,
      );
      return result;
    };

    // Copy metadata and name for Swagger
    for (const metaKey of Reflect.getMetadataKeys(original as object)) {
      // ✅ Explicitly type as unknown to avoid unsafe assignment
      const meta: unknown = Reflect.getMetadata(metaKey, original as object);
      Reflect.defineMetadata(metaKey, meta, wrapped);
    }

    Object.defineProperty(wrapped, 'name', { value: fn.name, writable: false });
    (wrapped as { __isTraced?: boolean }).__isTraced = true;

    proto[key] = wrapped;
  }
}

function isSkippable(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object') return true;

  const ctor = (obj as { constructor?: { name?: string } }).constructor;
  if (!ctor) return true;

  const builtin = [Object, Array, Map, Set, Date, RegExp, WeakMap, WeakSet];
  if (builtin.includes(ctor as never)) return true;

  if (obj instanceof Repository || obj instanceof EntityManager) return true;

  const name = ctor.name ?? '';
  return classesToSkip.includes(name);
}

const activeDepth = new WeakMap<object, Map<string, number>>();

function wrapInjectedServices(
  instance: object,
  seen = new WeakSet<object>(),
): void {
  if (seen.has(instance)) return;
  seen.add(instance);

  const dict = instance as GenericObject;
  for (const prop of Object.keys(dict)) {
    const value = dict[prop];
    if (value === null || typeof value !== 'object') continue;

    // ✅ Explicitly type prototype as object | null
    const proto: object | null = Object.getPrototypeOf(value) as object | null;
    if (proto === null) continue;

    const className: string =
      (proto as { constructor?: { name?: string } }).constructor?.name ??
      'UnknownService';
    const logger = new Logger(className);

    if (isSkippable(value)) {
      dict[prop] = new Proxy(value, {
        get(target: object, key: string | symbol, receiver: unknown): unknown {
          const original: unknown = Reflect.get(target, key, receiver);
          if (typeof original !== 'function') return original;

          return function (...args: unknown[]): unknown {
            const traceId: string = getTraceId() ?? 'no-trace';
            let depthMap = activeDepth.get(target);
            if (!depthMap) {
              depthMap = new Map<string, number>();
              activeDepth.set(target, depthMap);
            }
            const depth = depthMap.get(traceId) ?? 0;
            depthMap.set(traceId, depth + 1);

            try {
              if (depth === 0) {
                logger.log(
                  `[Trace: ${traceId}] !! Skipped tracing ${className} -> ${String(key)}`,
                );
              }
              // Safe call
              return (original as (...a: unknown[]) => unknown).apply(
                target,
                args,
              );
            } finally {
              const current = depthMap.get(traceId) ?? 1;
              if (current <= 1) depthMap.delete(traceId);
              else depthMap.set(traceId, current - 1);
            }
          };
        },
      });
      continue;
    }

    wrapMethods(proto as GenericObject, logger);
    wrapInjectedServices(value, seen);
  }
}

export function TraceController(): ClassDecorator {
  return (target: object): void => {
    const logger = new Logger(
      (target as { name?: string }).name ?? 'Controller',
    );

    wrapMethods((target as { prototype: GenericObject }).prototype, logger);

    const proto = (target as { prototype: Partial<OnModuleInit> }).prototype;
    const originalInit: (() => void) | undefined =
      proto.onModuleInit?.bind(proto);

    proto.onModuleInit = function (this: object): void {
      wrapInjectedServices(this);
      if (originalInit) {
        originalInit();
      }
    };
  };
}
