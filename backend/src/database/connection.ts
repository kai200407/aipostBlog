// ============================================
// 数据库连接
// ============================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import { config } from '../config/index.js';

// 创建 PostgreSQL 连接
const connectionString = config.DATABASE_URL;

const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(queryClient, { schema });

// Redis 连接
import Redis from 'ioredis';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

// 数据库健康检查
export async function healthCheck() {
  try {
    await db.execute('SELECT 1');
    await redis.ping();
    return { status: 'ok', database: 'connected', redis: 'connected' };
  } catch (error) {
    return {
      status: 'error',
      database: error instanceof Error ? error.message : 'unknown error'
    };
  }
}

// 优雅关闭
export async function closeConnections() {
  await queryClient.end();
  await redis.quit();
}
