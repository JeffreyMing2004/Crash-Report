<template>
  <div class="home">
    <!-- 输入区域 -->
    <section class="input-section">
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'upload' }]"
          @click="activeTab = 'upload'"
        >
          📁 上传文件
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'paste' }]"
          @click="activeTab = 'paste'"
        >
          📋 粘贴文本
        </button>
      </div>

      <CrashUploader
        v-if="activeTab === 'upload'"
        :loading="loading"
        @analyze="handleAnalysis"
      />
      <div v-else class="paste-area">
        <textarea
          v-model="pastedText"
          class="paste-textarea"
          placeholder="在此粘贴 Minecraft 崩溃报告内容...
支持从 crash-reports 文件夹中复制的内容"
          rows="12"
        ></textarea>
        <button
          class="analyze-btn"
          :disabled="loading || !pastedText.trim()"
          @click="handleTextSubmit"
        >
          <span v-if="loading" class="spinner"></span>
          🤖 {{ loading ? '分析中...' : '开始 AI 分析' }}
        </button>
      </div>
    </section>

    <!-- 结果展示 -->
    <section v-if="currentResult" class="result-section">
      <AnalysisResult :result="currentResult" @close="currentResult = null" />
    </section>

    <!-- 历史记录 -->
    <section class="history-section">
      <HistoryList
        :items="history"
        :loading="historyLoading"
        @view="openInNewWindow"
        @delete="handleDelete"
        @refresh="fetchHistory"
      />
    </section>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-animation">
          <div class="block"></div>
          <div class="block"></div>
          <div class="block"></div>
        </div>
        <p>AI 正在分析崩溃报告中...</p>
        <p class="loading-hint">完成后将自动打开结果窗口</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CrashUploader from '../components/CrashUploader.vue';
import AnalysisResult from '../components/AnalysisResult.vue';
import HistoryList from '../components/HistoryList.vue';
import { analyzeFile, analyzeText, getHistory, getHistoryDetail, deleteHistory, createShare } from '../api/index.js';

const activeTab = ref('upload');
const loading = ref(false);
const pastedText = ref('');
const currentResult = ref(null);
const history = ref([]);
const historyLoading = ref(false);
const newWindow = ref(null); // 新窗口引用

/**
 * 分析完成后：生成分享链接 → 填入已打开的新窗口
 */
async function finishAnalysis(result) {
  currentResult.value = result;
  await fetchHistory();

  try {
    const { data: shareData } = await createShare(result.id, result);
    if (newWindow.value && !newWindow.value.closed) {
      newWindow.value.location.href = shareData.shareUrl;
    } else {
      // 如果窗口被拦截或已关闭，在当前页显示链接
      currentResult.value._shareUrl = shareData.shareUrl;
    }
  } catch {
    // 分享失败静默处理
  }
  newWindow.value = null;
}

async function handleAnalysis(file) {
  // 立即开空白窗口（必须在用户点击上下文中）
  newWindow.value = window.open('', '_blank');
  if (newWindow.value) {
    newWindow.value.document.write(`
      <html><head><meta charset="utf-8"><title>分析中...</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
      .box{text-align:center}.spinner{width:40px;height:40px;border:3px solid #334155;border-top-color:#6366f1;border-radius:50%;margin:0 auto 16px;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}</style></head>
      <body><div class="box"><div class="spinner"></div><p>正在分析崩溃报告...</p></div></body></html>
    `);
  }

  loading.value = true;
  try {
    const { data } = await analyzeFile(file);
    await finishAnalysis(data);
  } catch (err) {
    alert('分析失败：' + (err.response?.data?.error || err.message));
    if (newWindow.value) { newWindow.value.close(); newWindow.value = null; }
  } finally {
    loading.value = false;
  }
}

async function handleTextSubmit() {
  if (!pastedText.value.trim()) return;

  newWindow.value = window.open('', '_blank');
  if (newWindow.value) {
    newWindow.value.document.write(`
      <html><head><meta charset="utf-8"><title>分析中...</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}
      .box{text-align:center}.spinner{width:40px;height:40px;border:3px solid #334155;border-top-color:#6366f1;border-radius:50%;margin:0 auto 16px;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}</style></head>
      <body><div class="box"><div class="spinner"></div><p>正在分析崩溃报告...</p></div></body></html>
    `);
  }

  loading.value = true;
  try {
    const { data } = await analyzeText(pastedText.value);
    pastedText.value = '';
    await finishAnalysis(data);
  } catch (err) {
    alert('分析失败：' + (err.response?.data?.error || err.message));
    if (newWindow.value) { newWindow.value.close(); newWindow.value = null; }
  } finally {
    loading.value = false;
  }
}

async function fetchHistory() {
  historyLoading.value = true;
  try {
    const { data } = await getHistory();
    history.value = data;
  } catch {
    // 静默
  } finally {
    historyLoading.value = false;
  }
}

async function openInNewWindow(id) {
  const win = window.open('', '_blank');
  try {
    const { data } = await getHistoryDetail(id);
    const { data: shareData } = await createShare(data.id, data);
    if (win) {
      win.location.href = shareData.shareUrl;
    } else {
      window.location.href = shareData.shareUrl;
    }
  } catch {
    if (win) win.close();
    alert('打开失败');
  }
}

async function handleDelete(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  try {
    await deleteHistory(id);
    history.value = history.value.filter((h) => h.id !== id);
  } catch {
    alert('删除失败');
  }
}

onMounted(() => {
  fetchHistory();
});
</script>
