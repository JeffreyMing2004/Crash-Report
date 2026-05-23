const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getRedis, isRedisAvailable } = require('../services/redis');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const COOKIE_MAX_AGE = 30 * 60 * 1000; // 30 分钟（毫秒）
const SESSION_TTL = 30 * 60; // 30 分钟（秒）

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度需在 2-20 个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于 6 个字符' });
    }

    // 只允许字母、数字、下划线、中文
    if (!/^[\w\u4e00-\u9fa5]+$/.test(username)) {
      return res.status(400).json({ error: '用户名只能包含字母、数字、下划线和中文' });
    }

    const redis = getRedis();

    // 检查用户名是否已存在
    const existingUser = await redis.get(`user:${username}`);
    if (existingUser) {
      return res.status(409).json({ error: '用户名已被注册' });
    }

    // 密码哈希
    const passwordHash = await bcrypt.hash(password, 10);

    // 存储到 Redis
    await redis.set(`user:${username}`, JSON.stringify({
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    }));

    // 生成 session
    const sessionId = uuidv4();
    const token = jwt.sign(
      { username, sessionId },
      JWT_SECRET,
      { expiresIn: SESSION_TTL }
    );

    // 存储 session
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({ username, createdAt: new Date().toISOString() }),
      'EX',
      SESSION_TTL
    );

    // 设置 Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    res.json({
      success: true,
      user: { username },
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const redis = getRedis();

    // 查找用户
    const userData = await redis.get(`user:${username}`);
    if (!userData) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = JSON.parse(userData);

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 session
    const sessionId = uuidv4();
    const token = jwt.sign(
      { username, sessionId },
      JWT_SECRET,
      { expiresIn: SESSION_TTL }
    );

    // 存储 session（30分钟过期）
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({ username, createdAt: new Date().toISOString() }),
      'EX',
      SESSION_TTL
    );

    // 设置 Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    res.json({
      success: true,
      user: { username },
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const redis = getRedis();
        await redis.del(`session:${payload.sessionId}`);
      } catch {
        // token 可能已过期，忽略
      }
    }

    res.clearCookie('token', { path: '/' });
    res.json({ success: true });
  } catch (err) {
    console.error('登出失败:', err);
    res.status(500).json({ error: '登出失败' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ user: null });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ user: null });
    }

    // 验证 Redis 中 session 有效性
    if (isRedisAvailable()) {
      try {
        const redis = getRedis();
        const sessionData = await redis.get(`session:${payload.sessionId}`);
        if (!sessionData) {
          return res.json({ user: null });
        }
      } catch {
        // Redis 不可用时，仅依赖 JWT
      }
    }

    res.json({
      user: {
        username: payload.username,
      },
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.json({ user: null });
  }
});

module.exports = router;
