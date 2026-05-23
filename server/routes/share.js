/**
 * 崩溃报告分享路由（公开访问）
 * GET /api/crash/:shareId - 获取分享的报告数据
 */

const express = require('express');
const { getRedis } = require('../services/redis');

const router = express.Router();

/**
 * GET /api/crash/:shareId
 * 获取分享的报告数据（公开访问，无需登录）
 */
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const redis = getRedis();

    const data = await redis.get(`share:${shareId}`);
    if (!data) {
      return res.status(404).json({ error: '分享链接不存在或已过期' });
    }

    const parsed = JSON.parse(data);
    res.json({
      shareId,
      ...parsed,
      ttl: await redis.ttl(`share:${shareId}`),
    });
  } catch (err) {
    console.error('获取分享失败:', err);
    res.status(500).json({ error: '获取分享失败' });
  }
});

module.exports = router;
