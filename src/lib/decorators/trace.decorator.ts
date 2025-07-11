/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { safeStringify } from '@/utils/safeStringify';
import { getTraceId } from '@/utils/trace.util';
import { Logger } from '@nestjs/common';

export function TraceController(): ClassDecorator {
  return function (target: any) {
    const logger = new Logger(target.name);
    const originalOnModuleInit = target.prototype.onModuleInit;

    target.prototype.onModuleInit = function () {
      const instance = this;

      // Wrap controller methods
      for (const key of Object.getOwnPropertyNames(target.prototype)) {
        if (key === 'constructor' || typeof instance[key] !== 'function')
          continue;

        const originalMethod = instance[key];
        instance[key] = function (...args: any[]) {
          const traceId = getTraceId() ?? 'N/A';
          logger.log(
            `[Trace: ${traceId}] → ${target.name} -> ${key}(${safeStringify(args)})`,
          );

          const result = originalMethod.apply(this, args);

          if (result instanceof Promise) {
            return result.then((res) => {
              logger.log(
                `[Trace: ${traceId}] ✅ ${target.name} -> ${key} resolved`,
              );
              return res;
            });
          }

          logger.log(
            `[Trace: ${traceId}] ✅ ${target.name} -> ${key} returned`,
          );
          return result;
        };
      }

      // Recursively wrap injected services
      for (const prop of Object.getOwnPropertyNames(instance)) {
        const value = instance[prop];
        if (isInjectableObject(value)) {
          instance[prop] = wrapServiceRecursively(
            value,
            `${target.name} -> ${prop}`,
          );
        }
      }

      if (originalOnModuleInit) originalOnModuleInit.apply(this);
    };
  };
}

function wrapServiceRecursively(
  service: any,
  contextName: string,
  visited = new WeakSet(),
): any {
  if (!isInjectableObject(service) || visited.has(service)) return service;
  visited.add(service);

  const logger = new Logger(contextName);

  for (const prop of Object.getOwnPropertyNames(service)) {
    const subValue = service[prop];

    if (
      isInjectableObject(subValue) &&
      !visited.has(subValue) &&
      !isFrameworkObject(subValue)
    ) {
      const nestedContext = `${contextName}.${String(prop)}`;
      service[prop] = wrapServiceRecursively(subValue, nestedContext, visited);
    }
  }

  return new Proxy(service, {
    get(target, prop: string, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value !== 'function') return value;

      return (...args: any[]) => {
        const traceId = getTraceId() ?? 'N/A';
        logger.log(
          `[Trace: ${traceId}] → ${contextName}.${String(prop)}(${safeStringify(args)})`,
        );

        const result = value.apply(target, args);

        if (result instanceof Promise) {
          return result.then((res) => {
            logger.log(
              `[Trace: ${traceId}] ✅ ${contextName}.${String(prop)} resolved`,
            );
            return res;
          });
        }

        logger.log(
          `[Trace: ${traceId}] ✅ ${contextName}.${String(prop)} returned`,
        );
        return result;
      };
    },
  });
}

function isInjectableObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isFrameworkObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;

  const name = obj.constructor?.name ?? '';
  return [
    'DataSource',
    'QueryBuilder',
    'QueryRunner',
    'EntityManager',
    'Connection',
    'Driver',
    'PoolClient',
  ].some((cls) => name.includes(cls));
}
