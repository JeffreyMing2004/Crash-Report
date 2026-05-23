<template>
  <div class="history-list">
    <div class="history-header">
      <h3><IconBookOpen /> 历史分析记录</h3>
      <button class="refresh-btn" @click="emit('refresh')" :disabled="loading">
        <IconRefreshCw /> 刷新
      </button>
    </div>

    <div v-if="loading" class="history-loading">
      <div class="spinner-small"></div>
    </div>

    <div v-else-if="items.length === 0" class="history-empty">
      <p>暂无分析记录</p>
      <p class="empty-hint">上传或粘贴一份崩溃报告开始分析吧</p>
    </div>

    <div v-else class="history-items">
      <div
        v-for="item in items"
        :key="item.id"
        class="history-item"
        @click="emit('view', item.id)"
      >
        <div class="item-left">
          <span :class="['severity-dot', item.severity || 'medium']"></span>
          <div class="item-info">
            <p class="item-name">{{ item.fileName }}</p>
            <p class="item-error">{{ item.errorType || item.description || '未知错误' }}</p>
          </div>
        </div>
        <div class="item-right">
          <span class="item-time">{{ formatTime(item.analyzedAt) }}</span>
          <button class="delete-btn" @click.stop="emit('delete', item.id)" title="删除">
            <IconTrash2 />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconBookOpen, IconRefreshCw, IconTrash2 } from '../assets/icons.js';

const props = defineProps({
  items: Array,
  loading: Boolean,
});

const emit = defineEmits(['view', 'delete', 'refresh']);

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
