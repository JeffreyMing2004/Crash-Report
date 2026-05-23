import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // AI 分析可能需要较长时间
  withCredentials: true, // 携带 Cookie
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

/**
 * 用户注册
 */
export function register(username, password) {
  return api.post('/auth/register', { username, password });
}

/**
 * 用户登录
 */
export function login(username, password) {
  return api.post('/auth/login', { username, password });
}

/**
 * 用户登出
 */
export function logout() {
  return api.post('/auth/logout');
}

/**
 * 获取当前用户
 */
export function getMe() {
  return api.get('/auth/me');
}

/**
 * 获取微信扫码登录二维码
 */
export function getWechatQrcode() {
  return api.get('/auth/wechat/qrcode');
}

/**
 * 轮询微信扫码状态
 */
export function pollWechatStatus(state) {
  return api.get('/auth/wechat/status', { params: { state } });
}

/**
 * 创建分享链接
 */
export function createShare(reportId, reportData) {
  return api.post(`/analyze/share/${reportId}`, { reportData });
}

/**
 * 获取分享的报告（公开接口）
 */
export function getSharedReport(shareId) {
  return api.get(`/crash/${shareId}`);
}

export default api;
