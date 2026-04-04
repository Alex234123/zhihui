const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT = 5000;
const UPLOAD_TIMEOUT = 60000;

function getApiBaseUrl() {
  const isDev = import.meta.env.DEV;
  if (isDev) return '';
  return `${window.location.protocol}//${window.location.host}`;
}

class RequestManager {
  constructor(maxConcurrent = 5) { this.queue = []; this.active = 0; this.max = maxConcurrent; }
  async executeRequest(requestFn) {
    if (this.active >= this.max) await new Promise(resolve => this.queue.push(resolve));
    this.active++;
    try { return await requestFn(); } finally { this.active--; if (this.queue.length > 0) this.queue.shift()(); } }
}
const requestManager = new RequestManager();

async function request(endpoint, options = {}) {
  return requestManager.executeRequest(async () => {
    const controller = new AbortController();
    const timeout = options.timeout || REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const token = localStorage.getItem('zhihui_site_token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return response.json();
    } catch(e) { clearTimeout(timeoutId); if (e.name === 'AbortError') throw new Error('请求超时，请检查网络连接'); throw e; }
  });
}

export const api = {
  dataApi: {
    getAllData: () => request('/api/data'),
    saveAllData: (data) => request('/api/data', { method: 'POST', body: JSON.stringify(data) })
  },
  personnelApi: { getList: () => request('/api/personnel'), saveList: (list) => request('/api/personnel', { method: 'POST', body: JSON.stringify(list) }) },
  equipmentApi: { getList: () => request('/api/equipment'), saveList: (list) => request('/api/equipment', { method: 'POST', body: JSON.stringify(list) }) },
  safetyApi: { getList: () => request('/api/safety'), saveList: (list) => request('/api/safety', { method: 'POST', body: JSON.stringify(list) }) },
  materialsApi: { getList: () => request('/api/materials'), saveList: (list) => request('/api/materials', { method: 'POST', body: JSON.stringify(list) }) },
  feedbackApi: { getList: () => request('/api/feedback'), saveList: (list) => request('/api/feedback', { method: 'POST', body: JSON.stringify(list) }) },
  logsApi: { getList: () => request('/api/logs'), addLog: (log) => request('/api/logs/add', { method: 'POST', body: JSON.stringify(log) }) },
  excellentPhotosApi: { getList: () => request('/api/excellentPhotos'), saveList: (list) => request('/api/excellentPhotos', { method: 'POST', body: JSON.stringify(list) }) },
  problemPhotosApi: { getList: () => request('/api/problemPhotos'), saveList: (list) => request('/api/problemPhotos', { method: 'POST', body: JSON.stringify(list) }) }
};

export const uploadApi = {
  async uploadImage(imageData, filename) {
    try { return await request('/upload', { method: 'POST', body: JSON.stringify({ image: imageData, filename }), timeout: UPLOAD_TIMEOUT }); } catch(error) { console.warn('Failed to upload image:', error); throw error; }
  },
  async deleteImage(filename) {
    try { return await request(`/upload/${filename}`, { method: 'DELETE' }); } catch(error) { console.warn('Failed to delete image:', error); throw error; }
  }
};