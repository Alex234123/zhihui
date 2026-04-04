import api from './api';
import { getItem, setItem } from '../utils/storage';

const CACHE_PREFIX = 'zhihui_';
const CACHE_EXPIRY = 30 * 60 * 1000;

class DataService {
  constructor() { this.cache = new Map(); this.retryCount = 3; this.listeners = new Map(); this.pendingRequests = new Map(); }

  generateKey(key) { return `${CACHE_PREFIX}${key}`; }

  getCache(key) { const item = this.cache.get(key); if (!item) return null; if (Date.now() - item.timestamp > CACHE_EXPIRY) { this.cache.delete(key); return null; } return item.data; }
  setCache(key, data) { this.cache.set(key, { data, timestamp: Date.now() }); this.notifyListeners(key, data); }

  subscribe(key, callback) { if (!this.listeners.has(key)) this.listeners.set(key, []); this.listeners.get(key).push(callback); }
  unsubscribe(key, callback) { const list = this.listeners.get(key); if (list) { const idx = list.indexOf(callback); if (idx > -1) list.splice(idx, 1); } }
  notifyListeners(key, data) { const list = this.listeners.get(key); if (list) list.forEach(cb => cb(data)); }

  async get(key, defaultValue = []) {
    let result = this.getCache(key);
    if (result !== null) { console.log(`[DataService] Cache hit for ${key}`); return result; }
    const cachedLocal = getItem(this.generateKey(key), null);
    if (cachedLocal !== null && cachedLocal !== undefined && cachedLocal !== '') { result = cachedLocal; this.setCache(key, result); console.log(`[DataService] Loaded ${key} from localStorage`); return result; }
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const apiMap = { personnel: api.personnelApi.getList, equipment: api.equipmentApi.getList, safety: api.safetyApi.getList, progress: api.progressApi.getList, materials: api.materialsApi.getList, feedback: api.feedbackApi.getList, logs: api.logsApi.getList, excellentPhotos: api.excellentPhotosApi.getList, problemPhotos: api.problemPhotosApi.getList };
        if (apiMap[key]) { result = await apiMap[key](); }
        else if (key === 'users' || key === 'workflow' || key === 'fileManagement' || key === 'blockPhotos' || key === 'progressDetail' || key === 'quality' || key === 'materialUsage' || key === 'events' || key === 'workflowApplications' || key === 'constructionSchedulePro') {
          const allData = await api.dataApi.getAllData(); result = allData[key]; console.log(`[DataService] Loaded ${key} from fallback API`);
        } else { console.warn(`[DataService] No API mapping for ${key}, returning default`); return defaultValue; }
        this.setCache(key, result !== undefined ? result : defaultValue); setItem(this.generateKey(key), result !== undefined ? result : defaultValue); return result;
      } catch(error) { console.warn(`Attempt ${i+1} failed for ${key}:`, error); if (i === this.retryCount - 1) throw error; await new Promise(r => setTimeout(r, 1000 * (i+1))); }
    }
    return defaultValue;
  }

  async set(key, value) {
    this.setCache(key, value); setItem(this.generateKey(key), value);
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const apiMap = { personnel: api.personalApi.saveList, equipment: api.equipmentApi.saveList, safety: api.safetyApi.saveList, progress: api.progressApi.saveList, materials: api.materialsApi.saveList, feedback: api.feedbackApi.saveList, logs: api.logsApi.addLog, excellentPhotos: api.excellentPhotosApi.saveList, problemPhotos: api.problemPhotosApi.saveList };
        if (apiMap[key]) { await apiMap[key](value); console.log(`[DataService] ${key} saved via dedicated API`); return; }
        else if (key === 'users' || key === 'workflow' || key === 'blockPhotos' || key === 'fileManagement' || key === 'progressDetail' || key === 'quality' || key === 'materialUsage' || key === 'events' || key === 'workflowApplications' || key === 'constructionSchedulePro') {
          const allData = await api.dataApi.getAllData(); allData[key] = value; await api.dataApi.saveAllData(allData); console.log(`[DataService] ${key} saved via fallback API`); return;
        }
        console.warn(`[DataService] No dedicated API for ${key}, using fallback`);
        const allData = await api.dataApi.getAllData(); allData[key] = value; await api.dataApi.saveAllData(allData); return;
      } catch(error) { console.warn(`Save attempt ${i+1} failed for ${key}:`, error); if (i < this.retryCount - 1) await new Promise(r => setTimeout(r, 1000*(i+1))); }
    }
  }
}

export default new DataService();