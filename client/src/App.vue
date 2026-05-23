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
            <button class="auth-btn logout-btn" @click="handleLogout">
              <IconLogOut /> 退出
            </button>
          </template>
          <template v-else>
            <button class="auth-btn" @click="showRegister = false; showAuth = true">登录</button>
            <button class="auth-btn primary" @click="showRegister = true; showAuth = true">注册</button>
          </template>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">
      <p>MC Crash Analyzer — 基于 AI 的智能崩溃诊断 &middot; 支持 Java 版所有版本</p>
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
import { IconAlertTriangle, IconUser, IconLogOut } from './assets/icons.js';

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
