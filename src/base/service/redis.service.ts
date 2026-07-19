import { EnvConfigService } from '@/config/env/env.config.service';
import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

import { Redis, type RedisOptions } from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;

  constructor(private readonly config: EnvConfigService) {
    const options: RedisOptions = {
      host: this.config.redisHost,
      port: this.config.redisPort,
      password: this.config.redisPassword,
      autoResubscribe: true,
      maxRetriesPerRequest: 13,
      enableOfflineQueue: true,
      tls: { rejectUnauthorized: false },
      retryStrategy: (times) => Math.min(times * 2000, 5000),
      reconnectOnError: (err) => err.message.startsWith('READONLY'),
    };

    this.client = new Redis(options);

    this.client.on('connect', () => {
      this.logger.log('Redis client connecting...');
    });
    this.client.on('ready', () => {
      this.logger.log('Redis client successfully connected and ready.');
    });
    this.client.on('error', (err) => {
      this.logger.error(`Redis client connection error: ${err.message}`);
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    const expiry = ttlSeconds ?? process.env.REDIS_TTL ?? 10800;
    return await this.client.set(key, value, 'EX', expiry);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  isRedisClientReady(): boolean {
    return this.client.status === 'ready';
  }

  async deleteKeysByPattern(pattern: string): Promise<void> {
    this.logger.log(
      `Initiating deletion for keys matching pattern: [${pattern}]`,
    );

    return new Promise<void>((resolve, reject) => {
      const stream = this.client.scanStream({ match: pattern, count: 100 });

      stream.on('data', (keys: string[]) => {
        if (keys.length === 0) return;

        stream.pause();

        void (async (): Promise<void> => {
          try {
            await this.client.unlink(keys);
          } catch (error) {
            this.logger.error(error);
          } finally {
            stream.resume();
          }
        })();
      });

      stream.on('end', () => {
        this.logger.log(
          `Finished deleting keys matching pattern: [${pattern}]`,
        );
        resolve();
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  async deleteCallbackInProgressKeys(): Promise<void> {
    await this.deleteKeysByPattern('*-callbacks-in-progress');
  }

  /**
   * Atomically sets a key only if it does not already exist (NX mode).
   * Returns "OK" if the lock was acquired successfully, or null if it already exists.
   */
  async setUnique(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<string | null> {
    try {
      return await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  beforeApplicationShutdown(signal?: string): void {
    this.printSystemData(
      `Application shutdown initiated | signal=${signal ?? 'none'}`,
    );
  }

  onApplicationShutdown(signal?: string): void {
    this.printSystemData(
      `Application shutdown finalized | signal=${signal ?? 'none'}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.warn(
      '[SIGNAL DETECTED] Executing RedisService cleanup onModuleDestroy...',
    );
    try {
      await this.deleteCallbackInProgressKeys();
    } catch (err) {
      this.logger.error(err);
    } finally {
      await this.client.quit();
    }
  }

  private printSystemData(message: string): void {
    const uptimeSeconds = process.uptime();
    const memoryUsage = Object.fromEntries(
      Object.entries(process.memoryUsage()).map(([key, value]) => [
        key,
        `${(value / 1024 / 1024).toFixed(2)} MB`,
      ]),
    );
    this.logger.log({ message, uptimeSeconds, memoryUsage });
  }
}
