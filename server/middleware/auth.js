/**
 * 认证中间件
 * 验证 JWT Cookie 中的登录状态
 */

const jwt = require('jsonwebtoken');
const { getRedis, isRedisAvailable } = require('../services/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'crash-analyzer-secret-key-change-me';

async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // 检查 Redis 中 session 是否存在
    if (isRedisAvailable()) {
      const redis = getRedis();
      const sessionData = await redis.get(`session:${payload.sessionId}`);
      if (!sessionData) {
        return res.status(401).json({ error: '登录已过期，请重新登录' });
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ error: '认证失败' });
  }
}

// 可选认证（不强制登录）
async function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch {
    // 忽略验证错误
  }
  next();
}

module.exports = { authMiddleware, optionalAuth, JWT_SECRET };
