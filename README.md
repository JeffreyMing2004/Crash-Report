# MC Crash Analyzer 💥

**AI 驱动的 Minecraft 崩溃报告分析工具**

自动解析 Minecraft Java 版崩溃报告，使用 AI 大语言模型进行智能分析，给出根本原因、解决方案和相关建议。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite |
| 后端 | Node.js + Express |
| AI | OpenAI API（兼容 DeepSeek / Ollama 等） |
| 文件上传 | Multer |

## 项目结构

```
crash-reports/
├── server/                 # 后端
│   ├── index.js            # Express 入口
│   ├── routes/analyze.js   # API 路由（文件上传/文本分析/历史管理）
│   ├── services/
│   │   ├── crashParser.js  # 崩溃报告解析器
│   │   └── aiService.js    # AI 分析服务
│   └── .env.example        # 环境变量模板
├── client/                 # 前端
│   ├── src/
│   │   ├── App.vue
│   │   ├── views/Home.vue
│   │   ├── components/
│   │   │   ├── CrashUploader.vue     # 文件上传组件
│   │   │   ├── AnalysisResult.vue    # 分析结果展示
│   │   │   └── HistoryList.vue       # 历史记录列表
│   │   ├── api/index.js    # API 封装
│   │   └── assets/style.css
│   └── vite.config.js
├── scripts/
│   └── dev-runner.js       # 开发模式统一启动器
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- AI API Key（OpenAI / DeepSeek 等）

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. 配置环境变量

在 `server` 目录中复制环境变量模板：

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
PORT=3000
```

<details>
<summary>使用其他 AI 提供商</summary>

**DeepSeek（国内推荐）：**
```env
OPENAI_API_KEY=sk-your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

**本地 Ollama：**
```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
AI_MODEL=qwen2.5:7b
```
</details>

### 3. 启动

**开发模式：**

在项目根目录执行：

```bash
npm run dev
```

该命令会同时启动：

- 前端：http://localhost:5173
- 后端：http://localhost:3000

日志会自动标记来源：

- `[FRONTEND]` 表示前端日志
- `[BACKEND]` 表示后端日志

**生产模式：**

```bash
cd client && npm run build
cd ../server && NODE_ENV=production npm start
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/analyze/file` | 上传文件进行分析 |
| POST | `/api/analyze/text` | 粘贴文本进行分析 |
| GET | `/api/analyze/history` | 获取分析历史 |
| GET | `/api/analyze/history/:id` | 获取单条历史详情 |
| DELETE | `/api/analyze/history/:id` | 删除历史记录 |
| GET | `/api/analyze/health` | 健康检查 |

## 功能特性

- 📁 **文件上传分析** — 直接上传 `crash-reports/*.txt` 文件
- 📋 **文本粘贴分析** — 支持粘贴报告内容
- 🤖 **AI 智能诊断** — 自动识别错误类型、定位根本原因
- 💡 **可行解决方案** — 给出具体操作步骤
- 🧩 **Mod 关联分析** — 识别可能相关的 Mod 及兼容性问题
- 📊 **严重程度评估** — Critical / High / Medium / Low 分级
- 📚 **历史记录** — 保存分析历史，随时回看
- 🌐 **多 AI 提供商** — 支持 OpenAI / DeepSeek / Ollama

## 支持的崩溃报告格式

- Minecraft Java 版标准崩溃报告格式
- Forge / Fabric / NeoForge 崩溃报告
- `crash-reports/` 目录下的 `.txt` 文件
- `.minecraft/logs/` 中的相关日志
