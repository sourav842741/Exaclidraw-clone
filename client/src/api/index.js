import api from './client.js';

const unwrap = (res) => res.data.data;

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then(unwrap),
  logoutAll: () => api.post('/auth/logout-all').then(unwrap),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(unwrap),
  verifyEmail: (token) => api.get('/auth/verify-email', { params: { token } }).then(unwrap),
  resendVerification: () => api.post('/auth/resend-verification').then(unwrap),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(unwrap),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }).then(unwrap),
  googleUrl: () => api.get('/auth/google').then(unwrap),
};

export const userApi = {
  me: () => api.get('/users/me').then(unwrap),
  updateProfile: (payload) => api.put('/users/me', payload).then(unwrap),
  updatePassword: (payload) => api.put('/users/password', payload).then(unwrap),
  changeEmail: (email) => api.put('/users/email', { email }).then(unwrap),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(unwrap),
  myBoards: () => api.get('/users/boards').then(unwrap),
  myTeams: () => api.get('/users/teams').then(unwrap),
  dashboard: () => api.get('/users/dashboard').then(unwrap),
};

export const boardApi = {
  create: (payload) => api.post('/boards', payload).then(unwrap),
  list: (params) => api.get('/boards', { params }).then(unwrap),
  get: (id) => api.get(`/boards/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/boards/${id}`, payload).then(unwrap),
  saveElements: (id, payload) => api.post(`/boards/${id}/elements`, payload).then(unwrap),
  duplicate: (id) => api.post(`/boards/${id}/duplicate`).then(unwrap),
  trash: (id) => api.delete(`/boards/${id}`).then(unwrap),
  restore: (id) => api.post(`/boards/${id}/restore`).then(unwrap),
  hardDelete: (id) => api.delete(`/boards/${id}/permanent`).then(unwrap),
  versions: (id) => api.get(`/boards/${id}/versions`).then(unwrap),
  createVersion: (id, payload) => api.post(`/boards/${id}/versions`, payload).then(unwrap),
  restoreVersion: (id, versionId) => api.post(`/boards/${id}/versions/${versionId}/restore`).then(unwrap),
  comments: (id) => api.get(`/boards/${id}/comments`).then(unwrap),
  addComment: (id, payload) => api.post(`/boards/${id}/comments`, payload).then(unwrap),
  replyComment: (id, commentId, body) => api.post(`/boards/${id}/comments/${commentId}/reply`, { body }).then(unwrap),
  resolveComment: (id, commentId, resolved) => api.put(`/boards/${id}/comments/${commentId}/resolve`, { resolved }).then(unwrap),
  deleteComment: (id, commentId) => api.delete(`/boards/${id}/comments/${commentId}`).then(unwrap),
  exportUrl: (id, format) => `/boards/${id}/export/${format}`,
};

export const teamApi = {
  create: (payload) => api.post('/teams', payload).then(unwrap),
  list: () => api.get('/teams').then(unwrap),
  get: (id) => api.get(`/teams/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/teams/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/teams/${id}`).then(unwrap),
  invite: (id, emails, role) => api.post(`/teams/${id}/invite`, { emails, role }).then(unwrap),
  updateMember: (id, memberId, role) => api.put(`/teams/${id}/members/${memberId}`, { role }).then(unwrap),
  removeMember: (id, memberId) => api.delete(`/teams/${id}/members/${memberId}`).then(unwrap),
};

export const aiApi = {
  diagram: (payload) => api.post('/ai/diagram', payload).then(unwrap),
  flowchart: (payload) => api.post('/ai/flowchart', payload).then(unwrap),
  mermaid: (payload) => api.post('/ai/mermaid', payload).then(unwrap),
  mindmap: (payload) => api.post('/ai/mindmap', payload).then(unwrap),
  codeToArch: (payload) => api.post('/ai/code', payload).then(unwrap),
  meeting: (payload) => api.post('/ai/meeting', payload).then(unwrap),
  brainstorm: (payload) => api.post('/ai/brainstorm', payload).then(unwrap),
  voice: (payload) => api.post('/ai/voice', payload).then(unwrap),
  image: (formData) => api.post('/ai/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(unwrap),
  createBoard: (payload) => api.post('/ai/board', payload).then(unwrap),
};

export const projectApi = {
  create: (payload) => api.post('/projects', payload).then(unwrap),
  list: (params) => api.get('/projects', { params }).then(unwrap),
  get: (id) => api.get(`/projects/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/projects/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/projects/${id}`).then(unwrap),
  timeline: (params) => api.get('/projects/timeline', { params }).then(unwrap),
  calendar: (params) => api.get('/projects/calendar', { params }).then(unwrap),
  kanban: (id) => api.get(`/projects/${id}/kanban`).then(unwrap),
  addColumn: (id, payload) => api.post(`/projects/${id}/columns`, payload).then(unwrap),
  renameColumn: (id, columnId, payload) => api.put(`/projects/${id}/columns/${columnId}`, payload).then(unwrap),
  deleteColumn: (id, columnId) => api.delete(`/projects/${id}/columns/${columnId}`).then(unwrap),
  addTask: (id, payload) => api.post(`/projects/${id}/tasks`, payload).then(unwrap),
  updateTask: (id, taskId, payload) => api.put(`/projects/${id}/tasks/${taskId}`, payload).then(unwrap),
  moveTask: (id, taskId, payload) => api.put(`/projects/${id}/tasks/${taskId}/move`, payload).then(unwrap),
  deleteTask: (id, taskId) => api.delete(`/projects/${id}/tasks/${taskId}`).then(unwrap),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrap),
  unread: () => api.get('/notifications/unread').then(unwrap),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.put('/notifications/read-all').then(unwrap),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then(unwrap),
  users: (params) => api.get('/admin/users', { params }).then(unwrap),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload).then(unwrap),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(unwrap),
  boards: (params) => api.get('/admin/boards', { params }).then(unwrap),
  analytics: (days) => api.get('/admin/analytics', { params: { days } }).then(unwrap),
  subscriptions: () => api.get('/admin/subscriptions').then(unwrap),
};
