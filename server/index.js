require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const analyzeRouter = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件（生产环境下托管前端构建产物）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API 路由
app.use('/api/analyze', analyzeRouter);

// 生产环境 SPA fallback
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message && err.message.includes('不支持的文件类型')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`\n🔧 Minecraft 崩溃分析服务已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🤖 AI 模型: ${process.env.AI_MODEL || 'gpt-4o-mini'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/analyze\n`);
});
