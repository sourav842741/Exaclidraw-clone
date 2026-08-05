import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const createClient = (name) => {
  const client = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password || undefined,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: false,
    commandTimeout: 3000,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });
  client.on('error', (err) => logger.warn(`Redis[${name}] error: ${err.message}`));
  client.on('ready', () => logger.info(`Redis[${name}] ready`));
  return client;
};

export const redis = createClient('cache');
export const pubSub = createClient('pubsub');

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), pubSub.quit()]);
}
