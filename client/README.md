<div align="center">

# MC Crash Analyzer

**AI 驱动的 Minecraft 崩溃报告智能分析 — Web 前端**

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=fff)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=nodedotjs&logoColor=fff)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

## 项目概述

**MC Crash Analyzer** 是一个单页 Web 应用，为 Minecraft 崩溃报告提供即时 AI 诊断。用户可上传崩溃日志文件或直接粘贴文本，数秒内即可获得结构化分析结果——包含错误类型、严重程度、根本原因及可操作的修复方案，全部以开发者友好的界面呈现。

前端基于 Vue 3 Composition API + Vite 构建，通过 RESTful API 与 Node.js 后端通信，支持文件上传、文本输入、用户认证、会话持久化及报告公开分享。

---

## 技术栈

| 层级             | 技术                                    |
| :--------------- | :-------------------------------------- |
| **框架**         | [Vue 3.5](https://vuejs.org/)（Composition API，`<script setup>`） |
| **构建工具**     | [Vite 5](https://vitejs.dev/)（ESM 原生，HMR 热更新） |
| **路由**         | [Vue Router 4](https://router.vuejs.org/)（History 模式） |
| **HTTP 客户端**  | [Axios](https://axios-http.com/)（拦截器，自动携带 Cookie） |
| **字体**         | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) + [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) |
| **图标**         | Lucide 风格 SVG，基于 Vue `h()` 渲染函数实现 |
| **样式**         | 原生 CSS + CSS 自定义属性（设计令牌） |

---

## 目录结构

```
client/
├── index.html                    # SPA 入口，字体预加载
├── vite.config.js                # Vite 配置（含 /api 代理）
├── package.json
└── src/
    ├── main.js                   # 应用入口，注册 Vue + Router
    ├── App.vue                   # 外壳组件：顶栏 / 路由视图 / 底栏 / 登录弹窗
    ├── api/
    │   └── index.js              # 后端 API 封装（共 12 个接口）
    ├── assets/
    │   ├── style.css             # 全局设计令牌与主题样式
    │   └── icons.js              # 20+ SVG 图标组件（渲染函数实现）
    ├── components/
    │   ├── AuthModal.vue         # 登录/注册弹窗（含表单校验）
    │   ├── CrashUploader.vue     # 文件拖拽上传区域
    │   ├── AnalysisResult.vue    # Bento 网格分析结果卡片
    │   └── HistoryList.vue       # 历史记录列表（相对时间戳）
    ├── router/
    │   └── index.js              # 路由定义（2 条路由）
    └── views/
        ├── Home.vue              # 主页：上传/粘贴切换 + 结果 + 历史
        └── SharedReport.vue      # 公开分享报告页（含有效期倒计时）
```

---

## 路由

| 路径               | 组件              | 需登录 | 说明                     |
| :----------------- | :---------------- | :----: | :----------------------- |
| `/`                | `Home`            |   否   | 上传、粘贴、分析、历史   |
| `/crash/:shareId`  | `SharedReport`    |   否   | 公开分享报告（含过期机制） |

---

## API 接口

开发环境下，所有 `/api/*` 请求由 Vite 代理转发至 `http://localhost:3000`。Axios 实例配置了 `withCredentials: true` 及 120 秒超时（适配 AI 分析长耗时）。

### 分析类接口

| 方法     | 路径                      | 说明                     |
| :------- | :------------------------ | :----------------------- |
| `POST`   | `/api/analyze/file`       | 上传崩溃报告文件（multipart） |
| `POST`   | `/api/analyze/text`       | 提交崩溃报告文本         |
| `GET`    | `/api/analyze/history`    | 获取当前用户分析历史     |
| `GET`    | `/api/analyze/history/:id` | 获取单条分析详情         |
| `DELETE` | `/api/analyze/history/:id` | 删除历史记录             |
| `GET`    | `/api/analyze/health`     | 健康检查                 |

### 认证类接口

| 方法   | 路径                     | 说明                  |
| :----- | :----------------------- | :-------------------- |
| `POST` | `/api/auth/register`     | 注册账号              |
| `POST` | `/api/auth/login`        | 会话登录              |
| `POST` | `/api/auth/logout`       | 退出登录              |
| `GET`  | `/api/auth/me`           | 获取当前登录用户      |
| `GET`  | `/api/auth/wechat/qrcode` | 获取微信扫码登录二维码 |
| `GET`  | `/api/auth/wechat/status` | 轮询微信扫码状态      |

### 分享类接口

| 方法   | 路径                    | 说明                 |
| :----- | :---------------------- | :------------------- |
| `GET`  | `/api/crash/:shareId`   | 获取公开分享的报告   |

---

## 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- 后端服务已启动在 `http://localhost:3000`

### 安装

```bash
git clone https://github.com/JeffreyMing2004/Crash-Report-Web.git
cd Crash-Report-Web/client
npm install
```

### 开发

```bash
npm run dev
```

开发服务器启动于 `http://localhost:5173`，支持热模块替换（HMR）。所有 `/api/*` 请求自动代理至 `http://localhost:3000`。

### 生产构建

```bash
# 生产环境构建
npm run build

# 本地预览构建产物
npm run preview
```

构建产物输出至 `dist/` 目录，为纯静态文件，可部署至任意 HTTP 服务器或 CDN。

---

## 组件文档

### `<CrashUploader>`

文件上传区域，支持拖拽和点击选择。

| Prop      | 类型      | 默认值  | 说明                   |
| :-------- | :-------- | :------ | :--------------------- |
| `loading` | `Boolean` | `false` | 分析进行中时禁用交互   |

| 事件      | 载荷    | 说明                 |
| :-------- | :------ | :------------------- |
| `analyze` | `File`  | 用户触发分析时发出   |

### `<AnalysisResult>`

AI 分析结果的结构化展示。

| Prop     | 类型     | 说明                     |
| :------- | :------- | :----------------------- |
| `result` | `Object` | 后端返回的完整分析响应   |

| 事件    | 说明             |
| :------ | :--------------- |
| `close` | 关闭结果展示     |

**`result` 对象结构：**

```typescript
interface AnalysisResult {
  fileName: string;
  analyzedAt: string;           // ISO 8601
  parsed?: {
    errorType?: string;
    errorMessage?: string;
    time?: string;
    javaVersion?: string;
    memory?: { heap?: string; allocated?: string };
    modCount?: number;
    stackTracePreview?: string[];
  };
  analysis?: {
    severity?: 'critical' | 'high' | 'medium' | 'low';
    summary?: string;
    rootCause?: string;
    solutions?: string[];
    relatedMods?: string[];
    technicalDetails?: string;
    estimatedFixTime?: string;
  };
}
```

### `<HistoryList>`

分析历史列表，支持相对时间戳与严重程度标记。

| Prop      | 类型      | 说明             |
| :-------- | :-------- | :--------------- |
| `items`   | `Array`   | 后端返回的历史记录 |
| `loading` | `Boolean` | 加载状态          |

| 事件      | 载荷          | 说明               |
| :-------- | :------------ | :----------------- |
| `view`    | `id: string`  | 点击查看某条记录   |
| `delete`  | `id: string`  | 请求删除某条记录   |
| `refresh` | —             | 手动触发刷新       |

### `<AuthModal>`

登录/注册弹窗，含客户端表单校验。

| Prop      | 类型      | 说明             |
| :-------- | :-------- | :--------------- |
| `visible` | `Boolean` | 控制弹窗显隐     |

| 事件            | 载荷            | 说明               |
| :-------------- | :-------------- | :----------------- |
| `close`         | —               | 关闭弹窗           |
| `login-success` | `User: Object`  | 登录/注册成功      |

---

## 设计系统

UI 采用 **OLED 暗色 + 块状布局** 设计语言，专为开发者工具优化。

| 令牌               | 色值       | 用途               |
| :----------------- | :--------- | :----------------- |
| `--bg-deep`        | `#020617`  | 页面底层背景       |
| `--bg`             | `#0F172A`  | 区块背景           |
| `--bg-card`        | `#1E293B`  | 卡片、弹窗背景     |
| `--primary`        | `#22C55E`  | 按钮、强调色、辉光 |
| `--text`           | `#F8FAFC`  | 主文字             |
| `--text-secondary` | `#94A3B8`  | 辅助文字           |
| `--text-muted`     | `#64748B`  | 占位符、提示文字   |
| `--font-mono`      | JetBrains Mono | 标题、代码、标签 |
| `--font-sans`      | IBM Plex Sans  | 正文、表单、UI  |

### 可访问性

- 所有可交互元素均有 `:focus-visible` 轮廓
- 全局遵循 `prefers-reduced-motion` 偏好
- 颜色对比度满足 WCAG AA 标准（最低 4.5:1）
- 图标均为内联 SVG，通过 `h()` 渲染，无外部图标字体依赖

### 响应式断点

| 断点     | 目标设备         |
| :------- | :--------------- |
| 375px    | 小屏手机         |
| 640px    | 大屏手机         |
| 768px    | 平板             |
| 1024px   | 小型桌面显示器   |
| 1440px   | 大型桌面显示器   |

---

## 图标系统

全部图标采用 Lucide 风格 SVG，基于 Vue `h()` 渲染函数实现为函数式组件，无需运行时模板编译器，保持打包体积精简且无外部图标依赖。

```js
// 使用示例
import { IconUpload, IconSparkles } from './assets/icons.js';
```

可用图标：`IconAlertCircle`、`IconAlertTriangle`、`IconBarChart3`、`IconBookOpen`、`IconBot`、`IconClipboard`、`IconClock`、`IconFileText`、`IconFolderOpen`、`IconLightbulb`、`IconLogIn`、`IconLogOut`、`IconPuzzle`、`IconRefreshCw`、`IconScrollText`、`IconSearch`、`IconSettings`、`IconShare`、`IconSparkles`、`IconTarget`、`IconTrash2`、`IconUpload`、`IconUser`、`IconX`。

---

## 部署

### 静态托管

本项目为纯 SPA，使用客户端路由。将 `dist/` 部署至任意静态服务即可：

```bash
npm run build
# 将 dist/ 上传至 CDN 或 Web 服务器
```

**注意：** 需配置 Web 服务器将所有路由回退至 `index.html`（SPA fallback），以支持 Vue Router 的 History 模式。

**Nginx 配置示例：**

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 许可证

MIT © 2026
