// import type { OnModuleDestroy } from '@nestjs/common';

// import type { UUID } from 'crypto';
// import { Redis, type RedisOptions } from 'ioredis';

// export class RedisService implements OnModuleDestroy {
//   client: Redis;

//   constructor() {
//     const options: RedisOptions = {
//       host: process.env.REDIS_HOST ?? 'localhost',
//       port: Number(process.env.REDIS_PORT) || 6379,
//       password: process.env.REDIS_PASSWORD,
//       username: process.env.REDIS_USERNAME,
//       autoResubscribe: true,
//       maxRetriesPerRequest: 13,
//       enableOfflineQueue: true,
//       retryStrategy: (times) => {
//         return Math.min(times * 2000, 5000);
//       },
//       reconnectOnError: (err) => {
//         return err.message.startsWith('READONLY');
//       },
//     };
//   }

//   async set(key: string, value: string, transactionExpireTime?: number) {
//     return await this.client.set(
//       key,
//       value,
//       'EX',
//       Number(transactionExpireTime || process.env.REDIS_TTL || 10800),
//     );
//   }

//   async get(key: string) {
//     return await this.client.get(key);
//   }

//   async getAll(key: string) {
//     return await this.client.hgetall(key);
//   }

//   // Store callback in Redis hash with a timestamp (nanosecond) as field
//   async incomingCallback(data: ICallback): Promise<void> {
//     const key = `callback::${data.transactionId}`;
//     const timeStamp = process.hrtime.bigint().toString();

//     await this.client.hset(key, timeStamp, JSON.stringify(data));
//   }

//   async unsetTransactionCallbackBuffer(
//     transactionId: string,
//     timeStamps?: string[],
//   ) {
//     const key = `callback::${transactionId}`;

//     // If no timestamps provided, delete entire hash
//     if (!timeStamps) {
//       await this.client.del(key);
//       return;
//     }

//     // If timestamps provided, delete specific fields
//     if (timeStamps.length > 0) {
//       await this.client.hdel(key, ...timeStamps);
//     }
//   }

//   async delete(key: string) {
//     return await this.client.del(key);
//   }

//   isRedisClientReady() {
//     return this.client.status === 'ready';
//   }

//   beforeApplicationShutdown(signal?: string) {
//     this.printSystemData(
//       `Application shutdown initiated | signal=${signal ?? 'none'}`,
//     );
//   }

//   onApplicationShutdown(signal?: string) {
//     this.printSystemData(
//       `Application shutdown finalized | signal=${signal ?? 'none'}`,
//     );
//   }

//   async onModuleDestroy() {
//     console.trace('[SIGNAL DETECTED] Trace for onModuleDestroy');
//     if (this.client) {
//       await this.deleteCallbackInProgressKeys();
//       await this.client.quit();
//     }
//   }

//   async deleteCallbackInProgressKeys() {
//     await this.deleteKeysByPattern('*-callbacks-in-progress');
//   }

//   async deleteKeysByPattern(pattern: string) {
//     this.logger.log({ message: `Deleting redis keys by pattern: ${pattern}` });
//     const keys = await this.client.keys(pattern);
//     keys.forEach(async (key) => {
//       await this.client.del(key);
//     });
//     this.logger.log({
//       message: `Finished deleting redis keys by pattern: ${pattern}`,
//     });
//   }

//   async setMerchantLastActivity(merchantId: string): Promise<void> {
//     await this.client.sadd('merchant:lastActivity', merchantId);
//   }

//   async getAllMerchantLastActivities(): Promise<UUID[]> {
//     return (await this.client.smembers('merchant:lastActivity')) as UUID[];
//   }

//   async clearMerchantLastActivities() {
//     await this.client.del('merchant:lastActivity');
//   }

//   async setCallbackTraceId(transactionId: string, traceId: string) {
//     await this.set(transactionId, traceId, Number(process.env.REDIS_TRACE_TTL));
//   }

//   async setUnique(key: string, value: string, transactionExpireTime?: number) {
//     return await this.client.set(
//       key,
//       value,
//       'EX',
//       Number(transactionExpireTime || process.env.REDIS_TTL || 10800),
//       'NX',
//     );
//   }

//   private printSystemData(message: string) {
//     const uptimeSeconds = process.uptime();
//     const uptimeFormatted = this.formatUptime(uptimeSeconds);
//     const memoryUsage = Object.fromEntries(
//       Object.entries(process.memoryUsage()).map(([key, value]) => [
//         key,
//         `${(value / 1024 / 1024).toFixed(2)} MB`,
//       ]),
//     );
//     console.trace();
//     this.logger.log<LogI>({
//       data: { uptimeSeconds, uptimeFormatted, memoryUsage },
//       message,
//     });
//   }

//   private formatUptime(seconds: number) {
//     const days = Math.floor(seconds / 86400);
//     seconds %= 86400;

//     const hours = Math.floor(seconds / 3600);
//     seconds %= 3600;

//     const minutes = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);

//     return `${days}d ${hours}h ${minutes}m ${secs}s`;
//   }
// }
