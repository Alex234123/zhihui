// 日志服务

class LoggerService {
  constructor() {
    this.logs = [];
    this.levels = {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug',
      TRACE: 'trace',
    };
    this.currentLevel = this.levels.INFO;
    this.enableConsole = true;
    this.enableStorage = true;
  }

  // 设置日志级别
  setLevel(level) {
    if (this.levels[level]) {
      this.currentLevel = this.levels[level];
    }
  }

  // 启用/禁用控制台输出
  setConsole(enabled) {
    this.enableConsole = enabled;
  }

  // 启用/禁用本地存储
  setStorage(enabled) {
    this.enableStorage = enabled;
  }

  // 记录错误
  error(message, error = null, context = null) {
    this.log(this.levels.ERROR, message, error, context);
  }

  // 记录警告
  warn(message, context = null) {
    this.log(this.levels.WARN, message, null, context);
  }

  // 记录信息
  info(message, context = null) {
    this.log(this.levels.INFO, message, null, context);
  }

  // 记录调试信息
  debug(message, context = null) {
    this.log(this.levels.DEBUG, message, null, context);
  }

  // 记录跟踪信息
  trace(message, context = null) {
    this.log(this.levels.TRACE, message, null, context);
  }

  // 核心日志方法
  log(level, message, error = null, context = null) {
    // 检查日志级别
    const levelOrder = [this.levels.TRACE, this.levels.DEBUG, this.levels.INFO, this.levels.WARN, this.levels.ERROR];
    if (levelOrder.indexOf(level) < levelOrder.indexOf(this.currentLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 添加到日志数组
    this.logs.push(logEntry);

    // 输出到控制台
    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }

    // 存储到本地存储
    if (this.enableStorage) {
      this.logToStorage(logEntry);
    }
  }

  // 输出到控制台
  logToConsole(logEntry) {
    const { level, message, error, context, timestamp } = logEntry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case this.levels.ERROR:
        console.error(prefix, message, error, context);
        break;
      case this.levels.WARN:
        console.warn(prefix, message, context);
        break;
      case this.levels.INFO:
        console.info(prefix, message, context);
        break;
      case this.levels.DEBUG:
        console.debug(prefix, message, context);
        break;
      case this.levels.TRACE:
        console.trace(prefix, message, context);
        break;
    }
  }

  // 存储到本地存储
  logToStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('zhihui_site_logs') || '[]');
      logs.push(logEntry);
      // 限制日志数量，最多存储1000条
      if (logs.length > 1000) {
        logs.shift();
      }
      localStorage.setItem('zhihui_site_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  // 获取所有日志
  getLogs() {
    return this.logs;
  }

  // 从本地存储加载日志
  loadLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem('zhihui_site_logs') || '[]');
      this.logs = logs;
      return logs;
    } catch (error) {
      console.error('Failed to load logs:', error);
      return [];
    }
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('zhihui_site_logs');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  // 导出日志
  exportLogs() {
    const logs = this.loadLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 错误处理函数
  handleError(error, context = null) {
    this.error('Unhandled error', error, context);
    // 可以在这里添加其他错误处理逻辑，如上报到错误监控系统
  }

  // 异步错误处理
  async handleAsyncError(promise, context = null) {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }
}

// 导出单例
const loggerService = new LoggerService();
export default loggerService;