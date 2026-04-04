export class LoggerService {
  constructor() { this.logs = []; this.maxLogs = 1000; }
  log(level, message, extra = {}) { const entry = { timestamp: new Date().toISOString(), level, message, ...extra }; this.logs.unshift(entry); if (this.logs.length > this.maxLogs) this.logs.pop(); console.log(`[${level.toUpperCase()}] ${message}`, extra); return entry; }
  info(msg, extra) { return this.log('info', msg, extra); }
  warn(msg, extra) { return this.log('warn', msg, extra); }
  error(msg, extra) { return this.log('error', msg, extra); }
  debug(msg, extra) { return this.log('debug', msg, extra); }
  getLogs() { return [...this.logs]; }
  clear() { this.logs = []; }
}

const logger = new LoggerService();
export default logger;