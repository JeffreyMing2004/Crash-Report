/**
 * 微信扫码登录路由
 * 使用微信开放平台 OAuth2.0 网页授权
 *
 * 流程：
 * 1. 前端请求 GET /api/auth/wechat/qrcode → 返回 state + qrcode URL
 * 2. 用户扫码后在微信中确认
 * 3. 微信回调 GET /api/auth/wechat/callback?code=xxx&state=xxx
 * 4. 前端轮询 GET /api/auth/wechat/status?state=xxx → 检测登录结果
 */

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getRedis } = require('../services/redis');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3003';
const SESSION_TTL = 30 * 60; // 30分钟
const COOKIE_MAX_AGE = 30 * 60 * 1000;
const POLL_TIMEOUT = 5 * 60; // 二维码有效期 5 分钟

/**
 * GET /api/auth/wechat/qrcode
 * 获取微信扫码登录二维码
 */
router.get('/qrcode', async (req, res) => {
  try {
    const state = uuidv4();
    const redis = getRedis();

    // 存储 state，等待扫码
    await redis.set(
      `wxlogin:${state}`,
      JSON.stringify({ status: 'pending', createdAt: Date.now() }),
      'EX',
      POLL_TIMEOUT
    );

    // 微信开放平台 OAuth URL
    let qrcodeUrl;
    let isDev = false;

    if (WECHAT_APP_ID) {
      const redirectUri = encodeURIComponent(`${SITE_URL}/api/auth/wechat/callback`);
      qrcodeUrl = `https://open.weixin.qq.com/connect/qrconnect`
        + `?appid=${WECHAT_APP_ID}`
        + `&redirect_uri=${redirectUri}`
        + `&response_type=code`
        + `&scope=snsapi_login`
        + `&state=${state}#wechat_redirect`;
    } else {
      // 开发模式：无真实微信配置时的模拟回调
      isDev = true;
      qrcodeUrl = `${SITE_URL}/api/auth/wechat/dev-scan?state=${state}`;
    }

    // 生成二维码图片（Base64）
    const QRCode = require('qrcode');
    const qrcodeDataUrl = await QRCode.toDataURL(qrcodeUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });

    res.json({
      state,
      qrcodeUrl,
      qrcodeImage: qrcodeDataUrl,
      isDev,
      expiresIn: POLL_TIMEOUT,
    });
  } catch (err) {
    console.error('生成微信二维码失败:', err);
    res.status(500).json({ error: '生成二维码失败' });
  }
});

/**
 * GET /api/auth/wechat/status
 * 轮询扫码状态
 */
router.get('/status', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: '缺少 state 参数' });

    const redis = getRedis();
    const data = await redis.get(`wxlogin:${state}`);

    if (!data) {
      return res.json({ status: 'expired' });
    }

    const parsed = JSON.parse(data);

    if (parsed.status === 'success') {
      // 扫码成功，设置 Cookie
      const token = jwt.sign(
        { username: parsed.username, sessionId: parsed.sessionId },
        JWT_SECRET,
        { expiresIn: SESSION_TTL }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });

      // 清理临时数据
      await redis.del(`wxlogin:${state}`);

      return res.json({
        status: 'success',
        user: { username: parsed.username, avatar: parsed.avatar },
      });
    }

    res.json({ status: parsed.status });
  } catch (err) {
    console.error('查询扫码状态失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * GET /api/auth/wechat/callback
 * 微信开放平台 OAuth 回调
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('参数错误');
    }

    // 用 code 换取 access_token
    const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        code,
        grant_type: 'authorization_code',
      },
    });

    const { access_token, openid, unionid } = tokenRes.data;

    if (!access_token || !openid) {
      console.error('微信 token 换取失败:', tokenRes.data);
      return res.status(500).send('登录失败');
    }

    // 获取用户信息
    const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: { access_token, openid },
    });

    const wechatUser = userRes.data;
    const username = `wx_${openid.slice(-8)}`;
    const avatar = wechatUser.headimgurl || '';
    const nickname = wechatUser.nickname || username;

    const redis = getRedis();

    // 确保用户已注册
    const existingUser = await redis.get(`user:${username}`);
    if (!existingUser) {
      await redis.set(`user:${username}`, JSON.stringify({
        username,
        nickname,
        avatar,
        openid,
        unionid: unionid || '',
        createdAt: new Date().toISOString(),
      }));
    }

    // 生成 session
    const sessionId = uuidv4();
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({ username, createdAt: new Date().toISOString() }),
      'EX',
      SESSION_TTL
    );

    // 更新 state 状态
    await redis.set(
      `wxlogin:${state}`,
      JSON.stringify({
        status: 'success',
        username,
        avatar,
        sessionId,
      }),
      'EX',
      POLL_TIMEOUT
    );

    // 回调页面提示登录成功
    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>登录成功</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
      .box{text-align:center}.icon{font-size:48px}h2{color:#10b981}</style></head>
      <body><div class="box"><div class="icon">✅</div><h2>微信登录成功</h2><p>请返回原页面继续操作</p></div></body></html>
    `);
  } catch (err) {
    console.error('微信回调处理失败:', err);
    res.status(500).send('登录失败，请重试');
  }
});

/**
 * GET /api/auth/wechat/dev-scan
 * 开发环境模拟扫码（无需真实微信配置）
 */
router.get('/dev-scan', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).send('缺少 state');

    const redis = getRedis();
    const sessionId = uuidv4();
    const username = 'wx_dev_' + Date.now().toString(36);

    // 创建开发用户
    await redis.set(`user:${username}`, JSON.stringify({
      username,
      nickname: '开发测试用户',
      avatar: '',
      createdAt: new Date().toISOString(),
    }));

    // 生成 session
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({ username, createdAt: new Date().toISOString() }),
      'EX',
      SESSION_TTL
    );

    // 更新 login state
    await redis.set(
      `wxlogin:${state}`,
      JSON.stringify({ status: 'success', username, avatar: '', sessionId }),
      'EX',
      POLL_TIMEOUT
    );

    res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>模拟扫码</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
      .box{text-align:center}.icon{font-size:48px}h2{color:#f59e0b}</style></head>
      <body><div class="box"><div class="icon">🧪</div><h2>开发模式模拟扫码成功</h2><p>(${username})</p><p>请返回原页面</p></div></body></html>
    `);
  } catch (err) {
    console.error('开发扫码失败:', err);
    res.status(500).send('模拟失败');
  }
});

module.exports = router;
