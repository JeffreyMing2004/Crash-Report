<template>
  <div class="crash-uploader">
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging, 'has-file': fileName }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".txt,.log,.md,.crash"
        hidden
        @change="handleFileSelect"
      />
      <template v-if="!fileName">
        <div class="drop-icon">
          <IconFolderOpen />
        </div>
        <p class="drop-text">拖拽崩溃报告文件到此处</p>
        <p class="drop-hint">或点击选择文件（支持 .txt, .log 及无扩展名文件）</p>
      </template>
      <template v-else>
        <div class="file-preview">
          <div class="file-icon-box">
            <IconFileText />
          </div>
          <div class="file-info">
            <p class="file-name">{{ fileName }}</p>
            <p class="file-size">{{ formatSize(fileSize) }}</p>
          </div>
          <button class="remove-btn" @click.stop="clearFile">
            <IconX />
          </button>
        </div>
      </template>
    </div>

    <button
      class="analyze-btn"
      :disabled="loading || !selectedFile"
      @click="startAnalysis"
    >
      <span v-if="loading" class="spinner"></span>
      <IconSparkles v-else />
      {{ loading ? '分析中...' : '开始 AI 分析' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconFolderOpen, IconFileText, IconX, IconSparkles } from '../assets/icons.js';

const props = defineProps({
  loading: Boolean,
});

const emit = defineEmits(['analyze']);

const isDragging = ref(false);
const fileName = ref('');
const fileSize = ref(0);
const selectedFile = ref(null);
const fileInput = ref(null);

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function triggerFileInput() {
  if (!props.loading) fileInput.value?.click();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) setFile(file);
}

function handleDrop(e) {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
}

function setFile(file) {
  selectedFile.value = file;
  fileName.value = file.name;
  fileSize.value = file.size;
}

function clearFile() {
  selectedFile.value = null;
  fileName.value = '';
  fileSize.value = 0;
  if (fileInput.value) fileInput.value.value = '';
}

function startAnalysis() {
  if (selectedFile.value && !props.loading) {
    emit('analyze', selectedFile.value);
  }
}
</script>
