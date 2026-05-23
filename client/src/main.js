import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import './assets/style.css';

const ISSUES_URL = 'https://github.com/JeffreyMing2004/Crash-Report-Web/issues';

const app = createApp(App);

// 全局未捕获错误处理 — 引导用户前往 Issues
app.config.errorHandler = (err, instance, info) => {
  console.error('[Crash Analyzer Error]', err, info);
  showErrorDialog(err.message || '应用发生了未知错误');
};

// 全局未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Crash Analyzer Unhandled Rejection]', event.reason);
  showErrorDialog(event.reason?.message || '网络请求发生异常');
  event.preventDefault();
});

/**
 * 弹出错误对话框，引导用户提交 Issue
 */
function showErrorDialog(message) {
  const msg = [
    '⚠️ 应用遇到了一个不可恢复的错误',
    '',
    `错误信息：${message}`,
    '',
    '请将此问题反馈至 GitHub Issues，我们会尽快修复：',
    ISSUES_URL,
  ].join('\n');

  const go = confirm(`${msg}\n\n是否立即前往 GitHub Issues 页面？`);
  if (go) {
    window.open(ISSUES_URL, '_blank');
  }
}

app.use(router).mount('#app');
