<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">💥</span>
          <span class="logo-text">MC Crash Analyzer</span>
        </div>
        <p class="header-subtitle">AI 驱动的 Minecraft 崩溃报告分析工具</p>
      </div>
    </header>
    <main class="app-main">
      <Home />
    </main>
    <footer class="app-footer">
      <p>MC Crash Analyzer — 基于 AI 的智能崩溃诊断 | 支持 Java 版所有版本</p>
    </footer>
  </div>
</template>

<script setup>
import Home from './views/Home.vue';
</script>
