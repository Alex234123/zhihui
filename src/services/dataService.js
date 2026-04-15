import * as storage from '../utils/storage';
import * as api from '../api/api';

class DataService {
  constructor() {
    this.useApi = true;
    this.useFileStorage = true;
    this.listeners = new Map();
    this.cache = new Map();
    this.cacheExpiry = 3000; // 缩短缓存时间到3秒（原5秒）
    this.retryCount = 1;
    this.syncStatus = new Map();
    this.consistencyChecks = new Map();
    this.lastUpdateTimes = new Map();
    this.dataVersion = new Map();
    this.syncErrors = [];
    this.syncStatusListeners = new Map();
    
    // WebSocket实时同步相关
    this.wsConnected = false;
    this.pendingUpdates = new Map(); // 待处理的更新
    this.initialized = false;
    
    // 初始化WebSocket连接
    this.initWebSocketSync();
  }

  // 初始化WebSocket实时同步
  async initWebSocketSync() {
    try {
      // 动态导入api模块中的WebSocket函数
      const { initWebSocket, onDataUpdate } = await import('../api/api');
      
      // 初始化WebSocket连接
      const ws = initWebSocket();
      
      if (ws) {
        // 注册全局数据更新监听器
        onDataUpdate('all', (message) => {
          console.log(`[DataService] 📢 收到实时更新: ${message.module} (v${message.version})`);
          this.handleRealtimeUpdate(message);
        });
        
        this.wsConnected = true;
        console.log('[DataService] ✅ WebSocket实时同步已启用');
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('[DataService] ⚠️ WebSocket初始化失败，将使用轮询模式:', error.message);
      this.wsConnected = false;
      this.initialized = true;
      
      // 启用备用轮询机制（每10秒检查一次更新）
      this.startPollingFallback();
    }
  }

  // 处理WebSocket实时更新
  handleRealtimeUpdate(message) {
    const { module, data, version, timestamp } = message;
    
    if (!module) return;

    // 更新本地缓存
    this.setToCache(module, data);
    
    // 更新版本号
    this.dataVersion.set(module, version);
    this.lastUpdateTimes.set(module, timestamp);

    // 通知所有监听器
    if (this.listeners.has(module)) {
      const callbacks = this.listeners.get(module);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[DataService] ❌ 监听器执行错误 (${module}):`, error);
        }
      });
    }

    // 同步到本地存储
    storage.setItem(module, data);
    
    // 更新同步状态
    this.setSyncStatus(module, 'synced');
    
    console.log(`[DataService] ✅ 已同步 ${module} 的实时更新 (v${version})`);
  }

  // 备用的轮询机制（当WebSocket不可用时）
  startPollingFallback() {
    if (this.pollingTimer) return;
    
    console.log('[DataService] 🔄 启用轮询模式（每10秒检查更新）');
    
    this.pollingTimer = setInterval(async () => {
      try {
        // 检查关键模块的版本
        const keyModules = ['personnel', 'equipment', 'progress', 'safety', 'materials'];
        
        for (const module of keyModules) {
          const currentVersion = this.getDataVersion(module);
          
          // 通过API获取最新版本号
          const serverVersion = api.getDataVersion(module);
          
          if (serverVersion > currentVersion) {
            console.log(`[DataService] 📢 检测到 ${module} 有新版本 (本地v${currentVersion} -> 服务端v${serverVersion})`);
            
            // 强制刷新该模块数据
            await this.forceRefresh(module);
          }
        }
      } catch (error) {
        console.error('[DataService] ⚠️ 轮询检查失败:', error.message);
      }
    }, 10000); // 每10秒检查一次
  }

  getSyncStatus(key) {
    return this.syncStatus.get(key) || 'idle';
  }

  setSyncStatus(key, status) {
    this.syncStatus.set(key, status);
    this.notifySyncStatusChange(key, status);
  }

  subscribeSyncStatus(key, callback) {
    if (!this.syncStatusListeners.has(key)) {
      this.syncStatusListeners.set(key, []);
    }
    this.syncStatusListeners.get(key).push(callback);
    return () => {
      const callbacks = this.syncStatusListeners.get(key);
      if (callbacks) {
        this.syncStatusListeners.set(key, callbacks.filter(cb => cb !== callback));
      }
    };
  }

  notifySyncStatusChange(key, status) {
    if (this.syncStatusListeners.has(key)) {
      this.syncStatusListeners.get(key).forEach(callback => callback(status));
    }
  }

  getDataVersion(key) {
    return this.dataVersion.get(key) || 0;
  }

  incrementDataVersion(key) {
    const currentVersion = this.getDataVersion(key);
    this.dataVersion.set(key, currentVersion + 1);
    return currentVersion + 1;
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        this.listeners.set(key, callbacks.filter(cb => cb !== callback));
      }
    };
  }

  async get(key, defaultValue = []) {
    const cachedData = this.getFromCache(key);
    if (cachedData) {
      return cachedData;
    }

    try {
      this.setSyncStatus(key, 'loading');
      
      let data;
      if (this.useApi) {
        data = await this.fetchDataFromApi(key, defaultValue);
      } else {
        data = storage.getItem(key, defaultValue);
      }
      
      storage.setItem(key, data);
      this.setToCache(key, data);
      this.lastUpdateTimes.set(key, Date.now());
      this.setSyncStatus(key, 'synced');
      return data;
    } catch (error) {
      console.error(`Error getting ${key} data:`, error);
      this.setSyncStatus(key, 'error');
      this.recordSyncError(key, error);
      const data = storage.getItem(key, defaultValue);
      this.setToCache(key, data);
      return data;
    }
  }

  async fetchDataFromApi(key, defaultValue) {
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const apiMap = {
          personnel: api.personnelApi.getList,
          equipment: api.equipmentApi.getList,
          safety: api.safetyApi.getList,
          progress: api.progressApi.getList,
          materials: api.materialsApi.getList,
          feedback: api.feedbackApi.getList,
          logs: api.logsApi.getList,
          excellentPhotos: api.excellentPhotosApi.getList,
          problemPhotos: api.problemPhotosApi.getList
        };

        if (apiMap[key]) {
          return await apiMap[key]();
        } else if (this.isDynamicKey(key, 'progressDetail')) {
          const allData = await api.dataApi.getAllData();
          const baseKey = 'progressDetail';
          let detailData = allData[baseKey];
          
          // 确保数据是对象格式
          if (Array.isArray(detailData)) {
            console.log(`[DataService] ⚠️ ${baseKey} 仍是数组格式，正在转换...`);
            // 转换为对象格式
            const newObj = {};
            detailData.forEach((item, index) => {
              if (item && item.areaId) {
                if (!newObj[item.areaId]) {
                  newObj[item.areaId] = {};
                }
                newObj[item.areaId][index + 1 || 1] = item;
              }
            });
            detailData = newObj;
            // 同时保存转换后的格式
            allData[baseKey] = newObj;
            try {
              await api.dataApi.saveAllData(allData);
              console.log(`[DataService] ✅ 已保存 ${baseKey} 转换后的对象格式`);
            } catch (e) {
              console.warn('[DataService] 保存转换格式失败:', e);
            }
          }
          
          if (detailData && typeof detailData === 'object') {
            const dynamicPart = this.extractDynamicKeyValue(key, detailData);
            if (dynamicPart) {
              console.log(`[DataService] ✅ Loaded ${key} from ${baseKey}: found`);
              return dynamicPart;
            } else {
              console.log(`[DataService] ℹ️ No dedicated data for ${key} in ${baseKey}, using default template`);
              return defaultValue;
            }
          }
          
          console.log(`[DataService] ⚠️ ${baseKey} not found or empty, returning default for ${key}`);
          return defaultValue;
        } else if (key === 'users' || key === 'workflow' || key === 'fileManagement' || key === 'blockPhotos'
                   || key === 'quality' || key === 'materialUsage' || key === 'events' || key === 'workflowApplications'
                   || key === 'constructionSchedulePro') {
          // 从全量数据中获取（支持复杂结构）
          const allData = await api.dataApi.getAllData();
          const result = allData[key];
          
          if (key === 'fileManagement') {
            console.log(`[DataService] Loaded ${key} from API:`, result ? 'found' : 'not found');
            return result || defaultValue;
          }
          
          if (key === 'blockPhotos') {
            console.log(`[DataService] Loaded ${key} from API:`, result ? 'found' : 'not found');
            return result || defaultValue;
          }
          
          if (key === 'progressDetail') {
            console.log(`[DataService] Loaded ${key} from API:`, result ? 'found' : 'not found');
            return result || defaultValue;
          }
          
          console.log(`[DataService] Loaded ${key} from fallback API`);
          return result || defaultValue;
        } else {
          console.warn(`[DataService] No API mapping for ${key}, returning default`);
          return defaultValue;
        }
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${key}:`, error);
        if (i === this.retryCount - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
    return defaultValue;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached) {
      const { data, timestamp } = cached;
      if (Date.now() - timestamp < this.cacheExpiry) {
        return data;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async set(key, value) {
    try {
      this.setSyncStatus(key, 'saving');
      
      if (this.useApi) {
        await this.saveDataToApi(key, value);
      }
      
      return this.saveDataLocally(key, value);
    } catch (error) {
      console.error(`Error saving ${key} data:`, error);
      this.setSyncStatus(key, 'error');
      this.recordSyncError(key, error);
      return this.saveDataLocally(key, value);
    }
  }

  async saveDataToApi(key, value) {
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const apiMap = {
          personnel: api.personnelApi.saveList,
          equipment: api.equipmentApi.saveList,
          safety: api.safetyApi.saveList,
          progress: api.progressApi.saveList,
          materials: api.materialsApi.saveList,
          feedback: api.feedbackApi.saveList,
          logs: api.logsApi.saveList,
          excellentPhotos: api.excellentPhotosApi.saveList,
          problemPhotos: api.problemPhotosApi.saveList,
          fileManagement: api.dataApi.saveAllData  // ✅ 新增：文件管理使用全量保存
        };

        if (apiMap[key]) {
          if (key === 'fileManagement') {
            // 文件管理模块特殊处理：包装成完整数据结构
            const allData = await api.dataApi.getAllData();
            allData.fileManagement = value;
            await api.dataApi.saveAllData(allData);
            console.log(`[DataService] ${key} data saved via full data API`);
          } else {
            await apiMap[key](value);
            console.log(`[DataService] ${key} data saved via dedicated API`);
          }
        } else if (this.isDynamicKey(key, 'progressDetail')) {
          const allData = await api.dataApi.getAllData();
          const baseKey = 'progressDetail';
          
          // 确保progressDetail是对象结构（支持按areaId+floor索引）
          if (!allData[baseKey] || Array.isArray(allData[baseKey])) {
            // 如果当前是数组格式，需要转换为对象格式
            const oldArray = allData[baseKey] || [];
            allData[baseKey] = {};
            
            // 尝试从数组中迁移数据（如果有的话）
            oldArray.forEach((item, index) => {
              if (item && item.areaId) {
                // 数组格式没有楼层信息，默认放到1层
                if (!allData[baseKey][item.areaId]) {
                  allData[baseKey][item.areaId] = {};
                }
                allData[baseKey][item.areaId][index + 1 || 1] = item;
              }
            });
            
            console.log(`[DataService] 转换 ${baseKey} 从数组格式到对象格式`);
          }
          
          this.setDynamicKeyValue(key, value, allData[baseKey]);
          await api.dataApi.saveAllData(allData);
          console.log(`[DataService] ✅ ${key} data saved to ${baseKey}`);
        } else if (key === 'users' || key === 'workflow' || key === 'blockPhotos' || key === 'fileManagement' || key === 'progressDetail'
                   || key === 'quality' || key === 'materialUsage' || key === 'events' || key === 'workflowApplications'
                   || key === 'constructionSchedulePro') {
          // 使用全量数据API保存（支持复杂结构）
          const allData = await api.dataApi.getAllData();
          allData[key] = value;
          await api.dataApi.saveAllData(allData);
          console.log(`[DataService] ${key} data saved via fallback API`);
        } else {
          // 对于其他未映射的模块，也使用全量保存
          console.warn(`[DataService] No dedicated API for ${key}, using fallback`);
          const allData = await api.dataApi.getAllData();
          allData[key] = value;
          await api.dataApi.saveAllData(allData);
        }
        break;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for saving ${key}:`, error);
        if (i === this.retryCount - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
  }

  saveDataLocally(key, value) {
    const result = storage.setItem(key, value);
    this.cache.delete(key);
    this.incrementDataVersion(key);
    this.lastUpdateTimes.set(key, Date.now());
    
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key);
      callbacks.forEach(callback => callback(value));
    }
    
    this.setSyncStatus(key, 'synced');
    return result;
  }

  async remove(key) {
    try {
      storage.removeItem(key);
      if (this.listeners.has(key)) {
        const callbacks = this.listeners.get(key);
        callbacks.forEach(callback => callback(null));
      }
      return true;
    } catch (error) {
      console.error(`Error removing ${key} data:`, error);
      return false;
    }
  }

  generateId() {
    return storage.generateId();
  }

  isDynamicKey(key, baseKey) {
    return key && key.startsWith(baseKey + '-');
  }

  parseDynamicKey(key, baseKey) {
    if (!this.isDynamicKey(key, baseKey)) return null;
    
    const parts = key.substring(baseKey.length + 1).split('-');
    
    if (baseKey === 'progressDetail' && parts.length >= 3) {
      const areaId = parts[0] + '-' + parts[1];
      const floor = parseInt(parts[2]);
      return { areaId, floor };
    }
    
    return null;
  }

  extractDynamicKeyValue(key, data) {
    const parsed = this.parseDynamicKey(key, 'progressDetail');
    if (!parsed || !data) return null;
    
    const { areaId, floor } = parsed;
    
    if (data[areaId] && data[areaId][floor]) {
      return data[areaId][floor];
    }
    
    return null;
  }

  setDynamicKeyValue(key, value, data) {
    const parsed = this.parseDynamicKey(key, 'progressDetail');
    if (!parsed || !data) return;
    
    const { areaId, floor } = parsed;
    
    if (!data[areaId]) {
      data[areaId] = {};
    }
    
    data[areaId][floor] = value;
  }

  async batchGet(keys, defaultValues = {}) {
    try {
      const results = {};
      const promises = keys.map(key => {
        return this.get(key, defaultValues[key] || []);
      });
      
      const data = await Promise.all(promises);
      keys.forEach((key, index) => {
        results[key] = data[index];
      });
      
      return results;
    } catch (error) {
      console.error('Error in batchGet:', error);
      return {};
    }
  }

  async addLog(level, message, context = null) {
    try {
      const logs = await this.get('logs', []);
      const newLog = {
        id: this.generateId(),
        time: new Date().toLocaleString(),
        level: level,
        message: message,
        context: context
      };
      logs.unshift(newLog);
      await this.set('logs', logs);
      return newLog;
    } catch (error) {
      console.error('Error adding log:', error);
      return null;
    }
  }

  recordSyncError(key, error) {
    this.syncErrors.push({
      key,
      error: error.message,
      timestamp: Date.now(),
      stack: error.stack
    });
    
    if (this.syncErrors.length > 100) {
      this.syncErrors = this.syncErrors.slice(-100);
    }
  }

  getSyncErrors() {
    return [...this.syncErrors];
  }

  clearSyncErrors() {
    this.syncErrors = [];
  }

  validateData(key, data) {
    if (!data) return true;
    if (Array.isArray(data)) {
      if (data.length === 0) return true;
      switch (key) {
        case 'personnel':
          return data.every(item => item && (item.id || item.name));
        case 'equipment':
          return data.every(item => item && (item.id || item.name));
        case 'safety':
          return data.every(item => item && (item.id || item.location));
        case 'progress':
          return data.every(item => item && (item.areaId || item.areaName || item.id || item.block));
        case 'materials':
          return data.every(item => item && (item.id || item.name));
        default:
          return true;
      }
    }
    if (typeof data === 'object') {
      return Object.keys(data).length > 0;
    }
    return true;
  }

  async checkDataConsistency() {
    const keys = ['personnel', 'equipment', 'safety', 'progress', 'materials'];
    const results = {};
    
    for (const key of keys) {
      try {
        const currentData = await this.get(key, []);
        const cachedData = this.getFromCache(key);
        const localData = storage.getItem(key, []);
        
        const isConsistent = this.compareData(currentData, cachedData, localData);
        
        results[key] = {
          isConsistent,
          currentCount: Array.isArray(currentData) ? currentData.length : 0,
          cachedCount: cachedData ? (Array.isArray(cachedData) ? cachedData.length : 0) : 0,
          localCount: Array.isArray(localData) ? localData.length : 0,
          lastUpdateTime: this.lastUpdateTimes.get(key),
          version: this.getDataVersion(key)
        };
        
        this.consistencyChecks.set(key, results[key]);
      } catch (error) {
        console.error(`Error checking consistency for ${key}:`, error);
        results[key] = {
          isConsistent: false,
          error: error.message
        };
      }
    }
    
    return results;
  }

  compareData(current, cached, local) {
    const stringify = (data) => JSON.stringify(data, (key, value) => {
      if (key === 'timestamp' || key === 'lastUpdateTime') return undefined;
      return value;
    });
    
    const currentStr = stringify(current);
    const cachedStr = cached ? stringify(cached) : '[]';
    const localStr = stringify(local);
    
    return currentStr === cachedStr && currentStr === localStr;
  }

  async forceRefresh(key) {
    this.cache.delete(key);
    this.setSyncStatus(key, 'loading');
    const data = await this.get(key, []);
    return data;
  }

  async forceRefreshAll() {
    const keys = ['personnel', 'equipment', 'safety', 'progress', 'materials', 'workflow', 'logs'];
    const results = {};
    
    for (const key of keys) {
      try {
        results[key] = await this.forceRefresh(key);
      } catch (error) {
        console.error(`Error force refreshing ${key}:`, error);
        results[key] = null;
      }
    }
    
    return results;
  }
}

export default new DataService();
