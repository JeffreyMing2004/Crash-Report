const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parseCrashReport } = require('../services/crashParser');
const { analyzeReport } = require('../services/aiService');
const { getRedis } = require('../services/redis');

const router = express.Router();

// 存储历史记录（生产环境建议使用数据库）
const history = [];
const MAX_HISTORY = 50;

// 配置文件上传
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../uploads'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    // 接受 txt、log 以及无扩展名的崩溃报告文件
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      ext === '.txt' ||
      ext === '.log' ||
      ext === '.md' ||
      ext === '' ||
      file.originalname.startsWith('crash-') ||
      file.originalname.includes('crash')
    ) {
      cb(null, true);
    } else if (!ext || ext === '') {
      // Minecraft 崩溃报告通常没有扩展名
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，请上传 .txt 或 .log 文件'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * 构建统一的解析摘要（用于前端展示和存储）
 */
function buildParsedSummary(parsed) {
  return {
    reportType: parsed.reportType || 'generic_log',
    serverType: parsed.serverType || null,
    description: parsed.description,
    errorType: parsed.errorType,
    errorMessage: parsed.errorMessage,
    time: parsed.time,
    javaVersion: parsed.javaVersion,
    memory: parsed.memory,
    modCount: parsed.mods.length,
    pluginCount: parsed.plugins ? parsed.plugins.length : 0,
    errorCount: parsed.errors ? parsed.errors.length : 0,
    warningCount: parsed.warnings ? parsed.warnings.length : 0,
    stackTracePreview: (parsed.stackTrace || []).slice(0, 10),
  };
}

/**
 * POST /api/analyze/file
 * 上传文件进行分析
 */
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传崩溃报告文件' });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');

    // 清理上传的文件（异步，不阻塞响应）
    fs.unlink(req.file.path, () => {});

    // 解析崩溃报告/服务器日志
    const parsed = parseCrashReport(content);

    // 验证至少有一些有效内容（非常宽松）
    if (!isContentValid(parsed, content)) {
      return res.status(400).json({
        error: '无法识别为有效的 Minecraft 崩溃报告或服务器日志，请确认文件内容',
      });
    }

    // AI 分析
    const analysis = await analyzeReport(parsed);

    // 构建完整结果
    const result = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analyzedAt: new Date().toISOString(),
      parsed: buildParsedSummary(parsed),
      analysis,
    };

    // 存入历史
    history.unshift(result);
    if (history.length > MAX_HISTORY) history.pop();

    res.json(result);
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({
      error: '分析失败: ' + (error.message || '未知错误'),
    });
  }
});

/**
 * 宽松验证：只要有足够长度且包含相关关键词就放行
 */
function isContentValid(parsed, content) {
  // 解析出结构化数据 → 有效
  if (parsed.errorType || parsed.description) return true;
  if (parsed.errors && parsed.errors.length > 0) return true;
  if (parsed.warnings && parsed.warnings.length > 0) return true;
  if (parsed.stackTrace && parsed.stackTrace.length > 0) return true;
  if (parsed.mods && parsed.mods.length > 0) return true;
  if (parsed.plugins && parsed.plugins.length > 0) return true;

  // 兜底：内容够长且包含相关关键词，让 AI 自行判断
  const text = content || '';
  const keywords = /minecraft|crash|crashreport|server|plugin|bukkit|spigot|paper|forge|fabric|exception|error|warn|java\.lang|net\.minecraft|mod\s|\.jar|stack\s?trace|at\s+\w+\.\w+\.\w+\(/i;
  if (text.length > 80 && keywords.test(text.slice(0, 5000))) {
    // 填充兜底描述
    if (!parsed.description) parsed.description = text.slice(0, 300).trim();
    return true;
  }

  return false;
}

/**
 * POST /api/analyze/text
 * 文本内容分析
 */
router.post('/text', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: '请提供崩溃报告文本内容' });
    }

    // 解析崩溃报告/服务器日志
    const parsed = parseCrashReport(content);

    if (!isContentValid(parsed, content)) {
      return res.status(400).json({
        error: '无法识别为有效的 Minecraft 崩溃报告或服务器日志，请确认内容',
      });
    }

    // AI 分析
    const analysis = await analyzeReport(parsed);

    const result = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      fileName: '粘贴文本',
      analyzedAt: new Date().toISOString(),
      parsed: buildParsedSummary(parsed),
      analysis,
    };

    // 存入历史
    history.unshift(result);
    if (history.length > MAX_HISTORY) history.pop();

    res.json(result);
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({
      error: '分析失败: ' + (error.message || '未知错误'),
    });
  }
});

/**
 * GET /api/analyze/history
 * 获取历史记录
 */
router.get('/history', (req, res) => {
  const summaries = history.map((item) => ({
    id: item.id,
    fileName: item.fileName,
    analyzedAt: item.analyzedAt,
    errorType: item.parsed?.errorType,
    description: item.parsed?.description,
    severity: item.analysis?.severity,
    summary: item.analysis?.summary,
  }));
  res.json(summaries);
});

/**
 * GET /api/analyze/history/:id
 * 获取单条历史详情
 */
router.get('/history/:id', (req, res) => {
  const item = history.find((h) => h.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(item);
});

/**
 * DELETE /api/analyze/history/:id
 * 删除单条历史
 */
router.delete('/history/:id', (req, res) => {
  const index = history.findIndex((h) => h.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '记录不存在' });
  }
  history.splice(index, 1);
  res.json({ success: true });
});

/**
 * POST /api/analyze/share/:id
 * 创建分享链接（12小时过期）
 */
router.post('/share/:id', async (req, res) => {
  try {
    const { reportData } = req.body;
    if (!reportData) {
      return res.status(400).json({ error: '缺少报告数据' });
    }

    const shareId = uuidv4();
    const redis = getRedis();
    const SHARE_TTL = 12 * 60 * 60;

    await redis.set(
      `share:${shareId}`,
      JSON.stringify({
        report: reportData,
        createdBy: req.user?.username || 'anonymous',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SHARE_TTL * 1000).toISOString(),
      }),
      'EX',
      SHARE_TTL
    );

    const baseUrl = process.env.NODE_ENV === 'production'
      ? (process.env.SITE_URL || '')
      : 'http://localhost:5173';
    const shareUrl = `${baseUrl}/crash/${shareId}`;

    res.json({
      shareId,
      shareUrl,
      expiresIn: '12小时',
      expiresAt: new Date(Date.now() + SHARE_TTL * 1000).toISOString(),
    });
  } catch (err) {
    console.error('创建分享失败:', err);
    res.status(500).json({ error: '创建分享失败' });
  }
});

/**
 * GET /api/analyze/health
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aiProvider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  });
});

module.exports = router;
