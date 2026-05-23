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
        @analyze="handleFileAnalysis"
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
          @click="handleTextAnalysis"
        >
          <span v-if="loading" class="spinner"></span>
          {{ loading ? '分析中...' : '🤖 开始 AI 分析' }}
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
        @view="viewHistoryDetail"
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
        <p class="loading-hint">这可能需要几秒钟</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CrashUploader from '../components/CrashUploader.vue';
import AnalysisResult from '../components/AnalysisResult.vue';
import HistoryList from '../components/HistoryList.vue';
import { analyzeFile, analyzeText, getHistory, getHistoryDetail, deleteHistory } from '../api/index.js';

const activeTab = ref('upload');
const loading = ref(false);
const pastedText = ref('');
const currentResult = ref(null);
const history = ref([]);
const historyLoading = ref(false);

async function handleFileAnalysis(file) {
  loading.value = true;
  try {
    const { data } = await analyzeFile(file);
    currentResult.value = data;
    await fetchHistory();
  } catch (err) {
    alert('分析失败：' + (err.response?.data?.error || err.message));
  } finally {
    loading.value = false;
  }
}

async function handleTextAnalysis() {
  if (!pastedText.value.trim()) return;
  loading.value = true;
  try {
    const { data } = await analyzeText(pastedText.value);
    currentResult.value = data;
    pastedText.value = '';
    await fetchHistory();
  } catch (err) {
    alert('分析失败：' + (err.response?.data?.error || err.message));
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
    // 静默失败
  } finally {
    historyLoading.value = false;
  }
}

async function viewHistoryDetail(id) {
  try {
    const { data } = await getHistoryDetail(id);
    currentResult.value = data;
  } catch {
    alert('获取详情失败');
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
