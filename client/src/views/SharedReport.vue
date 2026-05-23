<template>
  <div class="shared-report-page">
    <div v-if="loading" class="share-loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="share-error">
      <div class="error-icon-circle">
        <IconAlertCircle />
      </div>
      <h2>{{ error }}</h2>
      <p>该分享链接可能已过期（有效期12小时）</p>
      <a href="/" class="back-link">← 返回首页</a>
    </div>

    <div v-else-if="report" class="share-content">
      <div class="share-banner">
        <span><IconShare /> 有人分享了这份崩溃报告分析</span>
        <span class="share-expiry">剩余有效时间：{{ countdown }}</span>
      </div>

      <div class="analysis-result">
        <div class="result-header">
          <h2><IconBarChart3 /> 分析结果</h2>
          <div class="result-meta">
            <span class="file-badge">{{ report.fileName }}</span>
            <span class="time-badge">{{ formatTime(report.analyzedAt) }}</span>
          </div>
        </div>

        <div class="severity-row">
          <span class="severity-label">严重程度</span>
          <span :class="['severity-badge', report.analysis?.severity || 'medium']">
            {{ severityLabel(report.analysis?.severity) }}
          </span>
          <span v-if="report.parsed?.errorType" class="error-type-badge">
            {{ report.parsed.errorType }}
          </span>
        </div>

        <div class="result-card summary-card">
          <h3><IconSearch /> 问题概要</h3>
          <p>{{ report.analysis?.summary || '无' }}</p>
        </div>

        <div class="result-card info-card">
          <h3><IconScrollText /> 崩溃信息</h3>
          <div class="info-grid">
            <div v-if="report.parsed?.errorType" class="info-item">
              <span class="info-key">错误类型</span>
              <span class="info-value error">{{ report.parsed.errorType }}</span>
            </div>
            <div v-if="report.parsed?.errorMessage" class="info-item">
              <span class="info-key">错误信息</span>
              <span class="info-value">{{ report.parsed.errorMessage }}</span>
            </div>
            <div v-if="report.parsed?.time" class="info-item">
              <span class="info-key">发生时间</span>
              <span class="info-value">{{ report.parsed.time }}</span>
            </div>
            <div v-if="report.parsed?.javaVersion" class="info-item">
              <span class="info-key">Java 版本</span>
              <span class="info-value">{{ report.parsed.javaVersion }}</span>
            </div>
            <div v-if="report.parsed?.memory?.heap" class="info-item">
              <span class="info-key">堆内存</span>
              <span class="info-value">{{ report.parsed.memory.heap }}</span>
            </div>
            <div v-if="report.parsed?.modCount" class="info-item">
              <span class="info-key">Mod 数量</span>
              <span class="info-value">{{ report.parsed.modCount }} 个</span>
            </div>
          </div>
        </div>

        <div class="result-card root-cause-card">
          <h3><IconTarget /> 根本原因</h3>
          <p>{{ report.analysis?.rootCause || '无' }}</p>
        </div>

        <div class="result-card solutions-card">
          <h3><IconLightbulb /> 解决方案</h3>
          <ol v-if="report.analysis?.solutions?.length">
            <li v-for="(solution, i) in report.analysis.solutions" :key="i">
              {{ solution }}
            </li>
          </ol>
          <p v-else>暂无建议方案</p>
        </div>

        <div v-if="report.analysis?.relatedMods?.length" class="result-card mods-card">
          <h3><IconPuzzle /> 可能相关的 Mod</h3>
          <div class="mod-tags">
            <span v-for="mod in report.analysis.relatedMods" :key="mod" class="mod-tag">{{ mod }}</span>
          </div>
        </div>

        <div v-if="report.analysis?.technicalDetails" class="result-card tech-card">
          <h3><IconSettings /> 技术细节</h3>
          <p>{{ report.analysis.technicalDetails }}</p>
        </div>

        <div v-if="report.parsed?.stackTracePreview?.length" class="result-card stack-card">
          <h3><IconScrollText /> 堆栈跟踪</h3>
          <pre class="stack-trace"><code>{{ report.parsed.stackTracePreview.join('\n') }}</code></pre>
        </div>
      </div>

      <div class="share-footer">
        <a href="/" class="cta-link"><IconBot /> 上传自己的崩溃报告进行分析 →</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedReport } from '../api/index.js';
import {
  IconAlertCircle, IconShare, IconBarChart3, IconSearch,
  IconScrollText, IconTarget, IconLightbulb, IconPuzzle,
  IconSettings, IconBot,
} from '../assets/icons.js';

const route = useRoute();
const loading = ref(true);
const error = ref('');
const report = ref(null);
const countdown = ref('');
let timer = null;
let ttlSeconds = 0;

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-CN');
}

function severityLabel(s) {
  const map = { critical: '严重', high: '高', medium: '中', low: '低' };
  return map[s] || '未知';
}

function updateCountdown() {
  if (ttlSeconds <= 0) {
    countdown.value = '已过期';
    return;
  }
  const h = Math.floor(ttlSeconds / 3600);
  const m = Math.floor((ttlSeconds % 3600) / 60);
  const s = ttlSeconds % 60;
  countdown.value = `${h}时${m}分${s}秒`;
  ttlSeconds--;
}

onMounted(async () => {
  const shareId = route.params.shareId;
  console.log('[SharedReport] 开始加载分享:', shareId);
  try {
    const res = await getSharedReport(shareId);
    const data = res.data;
    console.log('[SharedReport] API 返回:', { hasError: !!data.error, hasReport: !!data.report, ttl: data.ttl });
    if (data.error) {
      error.value = data.error;
    } else if (data.report) {
      report.value = data.report;
      ttlSeconds = data.ttl > 0 ? data.ttl : 0;
      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
      console.log('[SharedReport] 报告加载成功, report:', report.value);
    } else {
      console.warn('[SharedReport] data.report 为空, data:', data);
      error.value = '报告数据不存在';
    }
  } catch (err) {
    console.error('[SharedReport] 请求失败:', err);
    error.value = '分享链接不存在或已过期';
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
