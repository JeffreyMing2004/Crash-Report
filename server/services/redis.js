/**
 * Redis 连接服务
 * 用于存储用户 session 和认证信息
 */

const Redis = require('ioredis');

let redis = null;
let redisAvailable = false;

function getRedis() {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  redis = new Redis(redisUrl, {
    password: redisPassword,
    maxRetriesPerRequest: 2,
    retryStrategy(times) {
      if (times > 3) {
        redisAvailable = false;
        return null; // 停止重试
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    redisAvailable = true;
    console.log('📦 Redis 已连接');
  });

  redis.on('error', (err) => {
    redisAvailable = false;
    console.warn('⚠️  Redis 连接失败:', err.message);
  });

  return redis;
}

function isRedisAvailable() {
  return redisAvailable;
}

module.exports = { getRedis, isRedisAvailable };
