import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;

const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', (err) => logger.error('Redis error:', err));
    redis.on('close', () => logger.warn('Redis connection closed'));
  }
  return redis;
};

export const redisClient = getRedisClient();

// OTP helpers
export const setOTP = async (key: string, otp: string, ttlSeconds: number = 300): Promise<void> => {
  await redisClient.setex(`otp:${key}`, ttlSeconds, otp);
};

export const getOTP = async (key: string): Promise<string | null> => {
  return await redisClient.get(`otp:${key}`);
};

export const deleteOTP = async (key: string): Promise<void> => {
  await redisClient.del(`otp:${key}`);
};

// Cache helpers
export const setCache = async (key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> => {
  await redisClient.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redisClient.get(`cache:${key}`);
  return data ? JSON.parse(data) : null;
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(`cache:${key}`);
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const keys = await redisClient.keys(`cache:${pattern}*`);
  if (keys.length > 0) await redisClient.del(...keys);
};

export default redisClient;
