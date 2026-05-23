/**
 * Redis 连接服务
 * 用于存储用户 session 和认证信息
 */

const Redis = require('ioredis');

let redis = null;
let redisAvailable = false;

function getRedis() {
  if (redis) return redis;

  let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let redisPassword = process.env.REDIS_PASSWORD || undefined;

  // 兼容 1Panel 等面板的非标准 Redis 连接地址
  // 1Panel 常见格式: //redis:password:port  或  redis:password:port
  if (!/^rediss?:\/\//.test(redisUrl)) {
    // 去掉可能的 // 前缀
    let raw = redisUrl.replace(/^\/\//, '');
    const parts = raw.split(':');
    if (parts.length >= 2) {
      const host = parts[0];
      const port = /^\d+$/.test(parts[parts.length - 1]) ? parts.pop() : '6379';
      const pwd = parts.slice(1).join(':');
      redisUrl = `redis://${host}:${port}`;
      if (!redisPassword && pwd) {
        redisPassword = pwd;
        console.log('📦 从 REDIS_URL 自动提取密码');
      }
    }
  }

  console.log(`📦 Redis 连接: ${redisUrl}${redisPassword ? ' (有密码)' : ''}`);

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
