<template>
  <div class="analysis-result">
    <!-- 标题栏 -->
    <div class="result-header">
      <h2 class="result-header-title"><IconBarChart3 /> 分析结果</h2>
      <div class="result-meta">
        <span class="badge badge-file">{{ result.fileName }}</span>
        <span class="badge badge-time">{{ formatTime(result.analyzedAt) }}</span>
        <button class="close-btn" @click="emit('close')"><IconX /></button>
      </div>
    </div>

    <!-- 严重程度 -->
    <div class="severity-row">
      <span class="severity-label">严重程度</span>
      <span :class="['severity-badge', result.analysis?.severity || 'medium']">
        {{ severityLabel(result.analysis?.severity) }}
      </span>
      <span v-if="result.parsed?.errorType" class="error-type-badge">
        {{ result.parsed.errorType }}
      </span>
    </div>

    <!-- 问题概要 -->
    <div class="card card-accent-green summary-card result-card-full">
      <h3 class="card-heading"><IconSearch /> 问题概要</h3>
      <p class="card-body">{{ result.analysis?.summary || '无' }}</p>
    </div>

    <!-- 崩溃信息 -->
    <div class="card result-card-full">
      <h3 class="card-heading"><IconScrollText /> 崩溃信息</h3>
      <div class="info-grid">
        <div v-if="result.parsed?.errorType" class="info-item">
          <span class="info-key">错误类型</span>
          <span class="info-value error">{{ result.parsed.errorType }}</span>
        </div>
        <div v-if="result.parsed?.errorMessage" class="info-item">
          <span class="info-key">错误信息</span>
          <span class="info-value">{{ result.parsed.errorMessage }}</span>
        </div>
        <div v-if="result.parsed?.time" class="info-item">
          <span class="info-key">发生时间</span>
          <span class="info-value">{{ result.parsed.time }}</span>
        </div>
        <div v-if="result.parsed?.javaVersion" class="info-item">
          <span class="info-key">Java 版本</span>
          <span class="info-value">{{ result.parsed.javaVersion }}</span>
        </div>
        <div v-if="result.parsed?.memory?.heap" class="info-item">
          <span class="info-key">堆内存</span>
          <span class="info-value">{{ result.parsed.memory.heap }}</span>
        </div>
        <div v-if="result.parsed?.memory?.allocated" class="info-item">
          <span class="info-key">已分配</span>
          <span class="info-value">{{ result.parsed.memory.allocated }}</span>
        </div>
        <div v-if="result.parsed?.modCount" class="info-item">
          <span class="info-key">Mod 数量</span>
          <span class="info-value">{{ result.parsed.modCount }} 个</span>
        </div>
      </div>
    </div>

    <!-- 根本原因 -->
    <div class="card card-accent-yellow result-card-full">
      <h3 class="card-heading"><IconTarget /> 根本原因</h3>
      <p class="card-body">{{ result.analysis?.rootCause || '无' }}</p>
    </div>

    <!-- 解决方案 -->
    <div class="card card-accent-green result-card-full solutions-card">
      <h3 class="card-heading"><IconLightbulb /> 解决方案</h3>
      <ol v-if="result.analysis?.solutions?.length">
        <li v-for="(solution, i) in result.analysis.solutions" :key="i">
          {{ solution }}
        </li>
      </ol>
      <p v-else>暂无建议方案</p>
    </div>

    <!-- 相关 Mod -->
    <div v-if="result.analysis?.relatedMods?.length" class="card result-card-full">
      <h3 class="card-heading"><IconPuzzle /> 可能相关的 Mod</h3>
      <div class="mod-tags">
        <span v-for="mod in result.analysis.relatedMods" :key="mod" class="mod-tag">{{ mod }}</span>
      </div>
    </div>

    <!-- 技术细节 -->
    <div v-if="result.analysis?.technicalDetails" class="card result-card-full">
      <h3 class="card-heading"><IconSettings /> 技术细节</h3>
      <p class="card-body">{{ result.analysis.technicalDetails }}</p>
    </div>

    <!-- 修复预估 -->
    <div v-if="result.analysis?.estimatedFixTime" class="card">
      <h3 class="card-heading"><IconClock /> 预估修复时间</h3>
      <p class="fix-time">{{ result.analysis.estimatedFixTime }}</p>
    </div>

    <!-- 堆栈预览 -->
    <div v-if="result.parsed?.stackTracePreview?.length" class="card result-card-full stack-card">
      <h3 class="card-heading"><IconScrollText /> 堆栈跟踪（前10行）</h3>
      <pre><code>{{ result.parsed.stackTracePreview.join('\n') }}</code></pre>
    </div>
  </div>
</template>

<script setup>
import {
  IconBarChart3, IconSearch, IconScrollText, IconTarget,
  IconLightbulb, IconPuzzle, IconSettings, IconClock, IconX,
} from '../assets/icons.js';

defineProps({ result: Object });
const emit = defineEmits(['close']);

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-CN');
}

function severityLabel(severity) {
  const map = { critical: '严重', high: '高', medium: '中', low: '低' };
  return map[severity] || '未知';
}
</script>
