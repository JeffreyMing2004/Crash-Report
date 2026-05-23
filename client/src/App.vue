<template>
  <div class="app">
    <header class="app-header">
      <div class="header-top">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">
              <IconAlertTriangle />
            </div>
            <span class="logo-text">MC Crash Analyzer</span>
          </div>
          <p class="header-subtitle">AI 驱动的 Minecraft 崩溃报告分析工具</p>
        </div>
        <div class="header-actions">
          <template v-if="user">
            <span class="user-badge"><IconUser /> {{ user.username }}</span>
            <button class="btn btn-ghost" @click="handleLogout">
              <IconLogOut /> 退出
            </button>
          </template>
          <template v-else>
            <button class="btn" @click="showRegister = false; showAuth = true">登录</button>
            <button class="btn btn-primary" @click="showRegister = true; showAuth = true">注册</button>
          </template>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <div class="footer-row">
        <span>MC Crash Analyzer — 基于 AI 的智能崩溃诊断 &middot; 支持 Java 版所有版本</span>
      </div>
      <div class="footer-row footer-meta">
        <span>作者：明明Uncle</span>
        <span class="footer-divider">|</span>
        <span>托管于：抚州明像素网络科技有限公司</span>
        <span class="footer-divider">|</span>
        <span>version:1.0.0</span>
        <span class="footer-divider">|</span>
        <a :href="ISSUES_URL" target="_blank" rel="noopener" class="footer-issues-link">
          <IconBug /> 问题反馈
        </a>
        <a :href="ISSUES_URL" target="_blank" rel="noopener" class="footer-issues-link footer-issues-btn">
          <IconExternalLink /> GitHub Issues
        </a>
      </div>
      <div class="footer-row footer-beian">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener" class="footer-beian-link">赣ICP备2025075011号-1</a>
        <span class="footer-divider">|</span>
        <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=36100202000667" target="_blank" rel="noopener" class="footer-beian-link">
          赣公网安备36100202000667号
        </a>
      </div>
    </footer>

    <AuthModal
      :visible="showAuth"
      :key="showRegister"
      @close="showAuth = false"
      @login-success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AuthModal from './components/AuthModal.vue';
import { getMe, logout } from './api/index.js';
import { IconAlertTriangle, IconUser, IconLogOut, IconBug, IconExternalLink } from './assets/icons.js';

const ISSUES_URL = 'https://github.com/JeffreyMing2004/Crash-Report-Web/issues';

const showAuth = ref(false);
const showRegister = ref(false);
const user = ref(null);

onMounted(async () => {
  try {
    const { data } = await getMe();
    if (data.user) {
      user.value = data.user;
    }
  } catch {
    // 未登录
  }
});

function onLoginSuccess(userData) {
  user.value = userData;
  showAuth.value = false;
}

async function handleLogout() {
  try {
    await logout();
  } catch {
    // ignore
  }
  user.value = null;
}
</script>
