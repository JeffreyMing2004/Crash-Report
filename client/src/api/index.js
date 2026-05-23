import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // AI 分析可能需要较长时间
});

/**
 * 上传文件进行分析
 */
export function analyzeFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * 粘贴文本进行分析
 */
export function analyzeText(content) {
  return api.post('/analyze/text', { content });
}

/**
 * 获取分析历史
 */
export function getHistory() {
  return api.get('/analyze/history');
}

/**
 * 获取单条历史详情
 */
export function getHistoryDetail(id) {
  return api.get(`/analyze/history/${id}`);
}

/**
 * 删除历史记录
 */
export function deleteHistory(id) {
  return api.delete(`/analyze/history/${id}`);
}

/**
 * 健康检查
 */
export function healthCheck() {
  return api.get('/analyze/health');
}

export default api;
