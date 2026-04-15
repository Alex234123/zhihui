// API 服务层，用于处理与后端的通信

// 动态获取API地址，支持不同访问方式
const getApiBaseUrl = () => {
  const host = window.location.hostname;
  const port = window.location.port || '3001';
  const protocol = window.location.protocol;
  return `${protocol}//${host}:${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT = 5000; // 普通请求 5 秒超时
const UPLOAD_TIMEOUT = 60000; // 文件上传 60 秒超时

// 数据版本追踪 - 用于检测数据变更
const dataVersions = new Map();

// WebSocket连接管理
let wsConnection = null;
let wsReconnectTimer = null;
let wsMessageHandlers = new Map();
let wsSubscribedModules = ['all']; // 默认订阅所有模块

// 请求队列管理
class RequestManager {
  constructor() {
    this.activeRequests = 0;
    this.maxConcurrentRequests = 3;
    this.queue = [];
  }

  async executeRequest(requestFn) {
    if (this.activeRequests >= this.maxConcurrentRequests) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.activeRequests++;
    try {
      return await requestFn();
    } finally {
      this.activeRequests--;
      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve();
      }
    }
  }
}

const requestManager = new RequestManager();

// 通用请求方法（已导出供其他模块直接使用）
export async function request(endpoint, options = {}) {
  return requestManager.executeRequest(async () => {
    const controller = new AbortController();
    const timeout = options.timeout || REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const token = localStorage.getItem('zhihui_site_token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 处理401未授权错误
        if (response.status === 401 && options.method && options.method.toUpperCase() !== 'GET') {
          console.warn('[API] ⚠️ 401 Unauthorized - Token may be invalid');
          // 对于写入操作，抛出错误让调用者处理
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 对于读取操作的401，或其它错误，尝试继续处理
        if (response.status === 401) {
          console.warn('[API] ℹ️ 401 on GET request, server may allow anonymous access');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      console.error('API request failed:', error);
      throw error;
    }
  });
}

// 缓存管理
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1分钟过期
  }

  get(key) {
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

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    // 检查缓存是否存在且未过期
    const cached = this.cache.get(key);
    if (cached) {
      const { timestamp } = cached;
      if (Date.now() - timestamp < this.cacheExpiry) {
        return true;
      } else {
        this.cache.delete(key);
        return false;
      }
    }
    return false;
  }
}

const apiCache = new ApiCache();

// 数据API
export const dataApi = {
  // 获取所有数据
  async getAllData() {
    const cachedData = apiCache.get('allData');
    if (cachedData) {
      return cachedData;
    }
    
    const data = await request('/data');
    apiCache.set('allData', data);
    return data;
  },

  // 保存所有数据
  async saveAllData(data) {
    const result = await request('/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // 清除缓存，确保下次获取最新数据
    apiCache.clear();
    return result;
  },
};

// 日志API
export const logsApi = {
  // 获取日志列表
  async getList() {
    try {
      return await request('/logs');
    } catch (error) {
      console.warn('Failed to get logs from API, falling back to all data:', error);
      const data = await dataApi.getAllData();
      return data.logs || [];
    }
  },

  // 保存日志列表
  async saveList(list) {
    try {
      return await request('/logs', {
        method: 'POST',
        body: JSON.stringify(list),
      });
    } catch (error) {
      console.warn('Failed to save logs to API, falling back to all data:', error);
      const data = await dataApi.getAllData();
      data.logs = list;
      return await dataApi.saveAllData(data);
    }
  },

  // 添加单条日志
  async addLog(log) {
    try {
      return await request('/logs/add', {
        method: 'POST',
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.warn('Failed to add log to API, falling back to save all:', error);
      const data = await dataApi.getAllData();
      if (!data.logs) {
        data.logs = [];
      }
      data.logs.unshift(log);
      return await dataApi.saveAllData(data);
    }
  },
};

// 创建通用API工厂函数
function createApi(entity) {
  return {
    async getList() {
      const data = await dataApi.getAllData();
      return data[entity] || [];
    },

    async saveList(list) {
      const data = await dataApi.getAllData();
      data[entity] = list;
      return await dataApi.saveAllData(data);
    },
  };
}

// 人员API
export const personnelApi = createApi('personnel');

// 设备API
export const equipmentApi = createApi('equipment');

// 安全巡检API
export const safetyApi = createApi('safety');

// 进度管理API
export const progressApi = createApi('progress');

// 材料管理API
export const materialsApi = createApi('materials');

// Bug反馈API
export const feedbackApi = createApi('feedback');

// 优秀案例照片API
export const excellentPhotosApi = createApi('excellentPhotos');

// 问题优化照片API
export const problemPhotosApi = createApi('problemPhotos');

// 文件上传API
export const uploadApi = {
  async uploadImage(imageData, filename) {
    try {
      return await request('/upload', {
        method: 'POST',
        body: JSON.stringify({ image: imageData, filename }),
        timeout: UPLOAD_TIMEOUT // 上传操作使用60秒超时
      });
    } catch (error) {
      console.warn('Failed to upload image:', error);
      throw error;
    }
  },

  async deleteImage(filename) {
    try {
      return await request(`/upload/${filename}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to delete image:', error);
      throw error;
    }
  }
};

// ========== WebSocket 实时同步管理 ==========

// 初始化WebSocket连接
export function initWebSocket() {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    console.log('[API] WebSocket已连接');
    return wsConnection;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '3001';
    const wsUrl = `${protocol}//${host}:${port}/ws`;

    console.log(`[API] 🔄 正在连接WebSocket: ${wsUrl}`);

    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = () => {
      console.log('[API] ✅ WebSocket连接成功');
      
      // 清除重连定时器
      if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }

      // 发送订阅消息
      if (wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({
          type: 'subscribe',
          modules: wsSubscribedModules
        }));
      }
    };

    wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('[API] ❌ 解析WebSocket消息失败:', error);
      }
    };

    wsConnection.onerror = (error) => {
      console.error('[API] ⚠️ WebSocket错误:', error);
    };

    wsConnection.onclose = (event) => {
      console.log(`[API] ❌ WebSocket连接关闭 (code: ${event.code})`);
      wsConnection = null;
      
      // 自动重连（5秒后）
      if (!wsReconnectTimer) {
        wsReconnectTimer = setTimeout(() => {
          console.log('[API] 🔄 尝试重新连接WebSocket...');
          initWebSocket();
        }, 5000);
      }
    };

    // 心跳检测 - 每30秒发送ping
    setInterval(() => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return wsConnection;
  } catch (error) {
    console.error('[API] ❌ WebSocket连接失败:', error);
    
    // 10秒后重试
    setTimeout(initWebSocket, 10000);
    return null;
  }
}

// 处理WebSocket消息
function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'welcome':
      console.log('[API] 👋 收到欢迎消息，当前数据版本:', message.currentVersions);
      // 更新本地版本信息
      Object.entries(message.currentVersions).forEach(([module, version]) => {
        dataVersions.set(module, version);
      });
      break;

    case 'data_update':
      console.log(`[API] 📢 收到数据更新: ${message.module} (v${message.version})`);
      
      // 更新版本号
      dataVersions.set(message.module, message.version);
      
      // 清除该模块的缓存（强制下次获取最新数据）
      apiCache.delete(message.module);
      apiCache.delete('allData');
      
      // 调用注册的消息处理器
      const handlers = wsMessageHandlers.get(message.module) || [];
      handlers.forEach(handler => handler(message));
      
      // 也调用通用的更新处理器
      const allHandlers = wsMessageHandlers.get('all') || [];
      allHandlers.forEach(handler => handler(message));
      break;

    case 'pong':
      // 心跳响应
      break;

    case 'subscribed':
      console.log('[API] ✅ 订阅确认:', message.modules);
      break;

    default:
      console.log('[API] 📨 收到消息:', message.type);
  }
}

// 注册数据变更监听器
export function onDataUpdate(module, callback) {
  if (!wsMessageHandlers.has(module)) {
    wsMessageHandlers.set(module, []);
  }
  wsMessageHandlers.get(module).push(callback);
  
  // 返回取消订阅函数
  return () => {
    const handlers = wsMessageHandlers.get(module);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

// 订阅特定模块的更新
export function subscribeModules(modules) {
  wsSubscribedModules = modules;
  
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'subscribe',
      modules: modules
    }));
  }
}

// 获取指定模块的数据版本
export function getDataVersion(module) {
  return dataVersions.get(module) || 0;
}

// 检查是否有更新的数据版本
export function hasNewerVersion(module, currentVersion) {
  const serverVersion = dataVersions.get(module) || 0;
  return serverVersion > currentVersion;
}

// 关闭WebSocket连接
export function closeWebSocket() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}
