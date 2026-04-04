import api from './api';

const PROGRESS_API_BASE = '/api/progressDetail';

export const progressApi = {
  async getBlockData(blockId) {
    try { const res = await request(`${PROGRESS_API_BASE}`); const allData = res; return allData[blockId] || null; } catch(e) { console.error('Get block data error:', e); throw e; }
  },
  async saveBlockData(blockId, data) {
    try { const allData = await api.dataApi.getAllData(); allData[blockId] = data; await api.dataApi.saveAllData(allData); return true; } catch(e) { console.error('Save block data error:', e); throw e; }
  },
  async uploadFile(fileData) {
    try { const res = await fetch(`${window.location.origin}/api/upload`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(fileData) }); if(!res.ok) throw new Error('Upload failed'); return await res.json(); } catch(e) { console.error('Upload error:', e); throw e; }
  },
  async batchUpdateNodes(updates) {
    try { const res = await fetch(`${window.location.origin}/api/progress`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updates) }); if(!res.ok) throw new Error('Batch update failed'); return await res.json(); } catch(e) { console.error('Batch update error:', e); throw e; }
  }
};