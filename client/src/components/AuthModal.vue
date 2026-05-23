<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-card">
      <button class="modal-close" @click="close"><IconX /></button>

      <h2 class="modal-title">{{ isLogin ? '登录' : '注册' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            maxlength="20"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            minlength="6"
            required
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="modal-submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <template v-else>
            <IconLogIn v-if="isLogin" />
            {{ loading ? '请稍候...' : (isLogin ? '登录' : '注册') }}
          </template>
        </button>
      </form>

      <p class="modal-switch">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <a href="#" @click.prevent="toggleMode">{{ isLogin ? '立即注册' : '立即登录' }}</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { login, register } from '../api/index.js';
import { IconX, IconLogIn } from '../assets/icons.js';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close', 'login-success']);

const isLogin = ref(true);
const loading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  password: '',
});

function toggleMode() {
  isLogin.value = !isLogin.value;
  error.value = '';
  form.username = '';
  form.password = '';
}

function close() {
  error.value = '';
  form.username = '';
  form.password = '';
  emit('close');
}

async function handleSubmit() {
  error.value = '';

  if (!form.username.trim() || !form.password.trim()) {
    error.value = '请填写用户名和密码';
    return;
  }

  if (form.password.length < 6) {
    error.value = '密码至少需要6个字符';
    return;
  }

  loading.value = true;

  try {
    const apiFn = isLogin.value ? login : register;
    const { data } = await apiFn(form.username.trim(), form.password);
    if (data.success) {
      form.username = '';
      form.password = '';
      emit('login-success', data.user);
      close();
    }
  } catch (err) {
    error.value = err.response?.data?.error || '操作失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>
