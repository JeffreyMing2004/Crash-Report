/**
 * Redis 连接服务
 * 用于存储用户 session 和认证信息
 * 开发模式下如果 Redis 不可用，自动降级到内存存储
 */

const Redis = require('ioredis');

let redis = null;
let redisAvailable = false;
let useMemoryStore = false;
const memoryStore = new Map();

class MemoryRedis {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && item.expireAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ...args) {
    let expireAt = null;
    if (args.length >= 2 && args[0] === 'EX') {
      expireAt = Date.now() + args[1] * 1000;
    }
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async exists(...keys) {
    let count = 0;
    for (const key of keys) {
      const item = this.store.get(key);
      if (item && (!item.expireAt || item.expireAt >= Date.now())) {
        count++;
      }
    }
    return count;
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expireAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key) {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expireAt) return -1;
    const remaining = Math.ceil((item.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushdb() {
    this.store.clear();
    return 'OK';
  }

  async quit() {
    return 'OK';
  }
}

function getRedis() {
  if (redis) return redis;

  const isDev = process.env.NODE_ENV !== 'production';
  let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let redisPassword = process.env.REDIS_PASSWORD || undefined;

  if (!/^rediss?:\/\//.test(redisUrl)) {
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
        if (isDev && !useMemoryStore) {
          console.warn('⚠️  Redis 连接失败，切换到内存存储模式（仅用于开发）');
          useMemoryStore = true;
          redis = new MemoryRedis();
          redisAvailable = true;
        } else {
          redisAvailable = false;
        }
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    redisAvailable = true;
    useMemoryStore = false;
    console.log('📦 Redis 已连接');
  });

  redis.on('error', (err) => {
    if (isDev && !useMemoryStore) {
      console.warn('⚠️  Redis 连接失败，切换到内存存储模式（仅用于开发）');
      useMemoryStore = true;
      redis = new MemoryRedis();
      redisAvailable = true;
    } else {
      redisAvailable = false;
      console.warn('⚠️  Redis 连接失败:', err.message);
    }
  });

  return redis;
}

function isRedisAvailable() {
  return redisAvailable;
}

function isUsingMemoryStore() {
  return useMemoryStore;
}

module.exports = { getRedis, isRedisAvailable, isUsingMemoryStore };
