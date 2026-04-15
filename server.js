const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const http = require('http');
const WebSocket = require('ws');
const SALT_ROUNDS = 10;

// 数据模块配置
const DATA_MODULES = [
  'personnel',
  'equipment', 
  'safety',
  'progress',
  'progressDetail',
  'materials',
  'feedback',
  'quality',
  'materialUsage',
  'excellentPhotos',
  'problemPhotos',
  'blockPhotos',
  'events',
  'workflowApplications',
  'logs',
  'users',
  'workflow',
  'fileManagement',
  'constructionSchedulePro'
];

const app = express();
const server = http.createServer(app);

// WebSocket服务器 - 用于实时数据同步
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 6
    }
  }
});

// 存储所有已连接的客户端
const clients = new Map();

// 数据版本追踪 - 每个模块维护一个版本号
const dataVersions = new Map();
DATA_MODULES.forEach(module => dataVersions.set(module, 0));

// 广播数据变更给所有连接的客户端（除了发送者）
function broadcastDataUpdate(module, data, excludeClient = null) {
  const version = (dataVersions.get(module) || 0) + 1;
  dataVersions.set(module, version);
  
  const message = JSON.stringify({
    type: 'data_update',
    module: module,
    version: version,
    timestamp: Date.now(),
    data: data
  });
  
  let broadcastCount = 0;
  clients.forEach((clientInfo, ws) => {
    if (ws !== excludeClient && ws.readyState === WebSocket.OPEN) {
      // 只向订阅了该模块或订阅了all的客户端发送
      if (clientInfo.subscribedModules.includes(module) || clientInfo.subscribedModules.includes('all')) {
        ws.send(message);
        broadcastCount++;
      }
    }
  });
  
  console.log(`[WebSocket] 📢 广播 ${module} 更新 (v${version}) 给 ${broadcastCount} 个客户端`);
}

// 处理WebSocket连接
wss.on('connection', (ws, req) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  clients.set(ws, {
    id: clientId,
    ip: req.socket.remoteAddress,
    connectedAt: Date.now(),
    subscribedModules: ['all'], // 默认订阅所有模块
    lastPing: Date.now()
  });
  
  console.log(`[WebSocket] ✅ 新客户端连接: ${clientId} (${req.socket.remoteAddress})`);
  console.log(`[WebSocket] 当前在线客户端数: ${clients.size}`);
  
  // 发送欢迎消息和当前版本信息
  const welcomeMsg = JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    currentVersions: Object.fromEntries(dataVersions),
    modules: DATA_MODULES,
    timestamp: Date.now()
  });
  ws.send(welcomeMsg);
  
  // 处理收到的消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(ws, message);
    } catch (error) {
      console.error('[WebSocket] ❌ 解析消息失败:', error.message);
    }
  });
  
  // 心跳检测 - 客户端定期发送ping
  ws.on('pong', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      clientInfo.lastPing = Date.now();
    }
  });
  
  // 连接关闭
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] ❌ 客户端断开: ${clientId}`);
    console.log(`[WebSocket] 剩余在线客户端数: ${clients.size}`);
  });
  
  // 错误处理
  ws.on('error', (error) => {
    console.error(`[WebSocket] ⚠️ 客户端错误 ${clientId}:`, error.message);
    clients.delete(ws);
  });
});

// 处理WebSocket消息
function handleWebSocketMessage(ws, message) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;
  
  switch (message.type) {
    case 'subscribe':
      // 订阅特定模块的数据更新
      if (Array.isArray(message.modules)) {
        clientInfo.subscribedModules = message.modules;
        console.log(`[WebSocket] 📝 ${clientInfo.id} 订阅模块:`, message.modules);
        
        // 发送确认消息
        ws.send(JSON.stringify({
          type: 'subscribed',
          modules: message.modules,
          timestamp: Date.now()
        }));
      }
      break;
      
    case 'ping':
      // 心跳响应
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    case 'get_version':
      // 获取指定模块的当前版本
      const module = message.module;
      if (module && DATA_MODULES.includes(module)) {
        ws.send(JSON.stringify({
          type: 'version_info',
          module: module,
          version: dataVersions.get(module) || 0,
          timestamp: Date.now()
        }));
      }
      break;
      
    case 'sync_request':
      // 同步请求 - 发送指定模块的最新数据
      if (message.module && DATA_MODULES.includes(message.module)) {
        const moduleData = readModuleData(message.module);
        ws.send(JSON.stringify({
          type: 'sync_data',
          module: message.module,
          version: dataVersions.get(message.module) || 0,
          data: moduleData,
          timestamp: Date.now()
        }));
      }
      break;
      
    default:
      console.warn(`[WebSocket] ⚠️ 未知消息类型: ${message.type}`);
  }
}

// 定期清理断开的连接并检查心跳（每30秒）
setInterval(() => {
  const now = Date.now();
  clients.forEach((clientInfo, ws) => {
    // 如果超过60秒没有心跳，关闭连接
    if (now - clientInfo.lastPing > 60000) {
      console.log(`[WebSocket] ⏰ 心跳超时，关闭连接: ${clientInfo.id}`);
      ws.terminate();
      clients.delete(ws);
    } else {
      // 发送ping检查连接状态
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }
  });
}, 30000);

// 输入验证和清洗中间件（排除文件上传接口，避免破坏base64数据）
function validateInput(req, res, next) {
  // 文件上传接口跳过HTML转义处理
  if (req.path === '/api/upload' || req.path.startsWith('/api/upload/')) {
    return next()
  }

  // 基础输入清洗
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // 防止XSS：转义HTML特殊字符
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
    }
  }
  next();
}

// 密码哈希函数
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// 密码验证函数
async function verifyPassword(password, hashedPassword) {
  try {
    // 先尝试 bcrypt 验证
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    // 如果不是bcrypt格式，回退到明文比较（用于迁移期）
    console.warn('Password verification fallback to plaintext:', error.message);
    return password === hashedPassword;
  }
}

// 检查并迁移明文密码为哈希密码
async function migratePasswordIfPlaintext(user) {
  if (user.password && !user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
    console.log(`Migrating plaintext password for user: ${user.phone}`);
    const hashedPassword = await hashPassword(user.password);
    user.password = hashedPassword;
    
    // 更新用户数据
    const users = readModuleData('users');
    const index = users.findIndex(u => u.phone === user.phone);
    if (index !== -1) {
      users[index] = user;
      saveModuleData('users', users);
    }
  }
  return user;
}

// Token 管理
const activeTokens = new Map();
const TOKEN_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

// 生成 Token
function generateToken(userId, username) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + TOKEN_EXPIRE_TIME;
  activeTokens.set(token, { userId, username, expires });
  return token;
}

// 验证 Token
function verifyToken(token) {
  const tokenData = activeTokens.get(token);
  if (!tokenData) return null;
  if (Date.now() > tokenData.expires) {
    activeTokens.delete(token);
    return null;
  }
  return tokenData;
}

// Token 验中间件 - 可选认证（读取操作可选，写入操作必须）
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 无token时允许访问，但标记为匿名用户
    req.user = null;
    return next();
  }
  
  const token = authHeader.substring(7);
  const tokenData = verifyToken(token);
  if (!tokenData) {
    // token无效时允许访问，但标记为匿名用户
    req.user = null;
    return next();
  }
  
  req.user = tokenData;
  next();
}

// Token 验证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }
  
  const token = authHeader.substring(7);
  const tokenData = verifyToken(token);
  if (!tokenData) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }
  
  req.user = tokenData;
  next();
}

// 配置路径 - 使用当前目录
const PROJECT_DIR = __dirname;
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const UPLOADS_DIR = path.join(PROJECT_DIR, 'uploads');
const STATIC_DIR = path.join(PROJECT_DIR, 'dist');
const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || '0.0.0.0';

// 文件分类配置
const FILE_CATEGORIES = [
  'design',        // 工程设计全流程核心管控文件
  'cost',          // 建设单位现场成本
  'supervisor',    // 监理单位文件
  'highlight',     // 工程亮点板块
  'images',        // 图片文件
  'documents',     // 文档文件
  'others'         // 其他文件
];

// 确保必要的目录存在
function ensureDirectories() {
  // 创建数据目录
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // 创建各模块数据文件
  DATA_MODULES.forEach(module => {
    const moduleFile = path.join(DATA_DIR, `${module}.json`);
    if (!fs.existsSync(moduleFile)) {
      fs.writeFileSync(moduleFile, JSON.stringify([], null, 2));
    }
  });
  
  // 创建上传目录及子目录
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  
  FILE_CATEGORIES.forEach(category => {
    const categoryDir = path.join(UPLOADS_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  });
}

ensureDirectories();

// 中间件
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// API路由 - 必须在静态文件之前！
// Token验证增强端点（供前端路由守卫使用）- 使用可选认证
app.get('/api/verify-token', optionalAuthMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ 
      success: false, 
      valid: false,
      message: '未提供Token' 
    });
  }

  const token = authHeader.substring(7);
  const tokenData = verifyToken(token);

  if (!tokenData) {
    return res.status(200).json({ 
      success: false, 
      valid: false,
      message: 'Token无效或已过期' 
    });
  }

  res.json({
    success: true,
    valid: true,
    user: tokenData,
    expiresIn: Math.max(0, tokenData.expires - Date.now())
  });
});

// 系统信息API（可选认证）
app.get('/api/system/info', optionalAuthMiddleware, (req, res) => {
  const uptime = process.uptime();
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  
  res.json({
    success: true,
    startTime: new Date(Date.now() - uptime * 1000).toISOString(),
    uptime: `${days}天 ${hours}小时 ${minutes}分钟`,
    version: '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: checkMemoryUsage(),
    pid: process.pid
  });
});

// 静态文件服务 (放在API路由之后)
app.use(express.static(STATIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// 读取单个模块数据
function readModuleData(module) {
  try {
    const moduleFile = path.join(DATA_DIR, `${module}.json`);
    if (fs.existsSync(moduleFile)) {
      const data = fs.readFileSync(moduleFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${module} data:`, error);
    return [];
  }
}

// 保存单个模块数据
function saveModuleData(module, data) {
  try {
    const moduleFile = path.join(DATA_DIR, `${module}.json`);
    fs.writeFileSync(moduleFile, JSON.stringify(data, null, 2));

    // 通过WebSocket广播数据变更（实现实时同步）
    broadcastDataUpdate(module, data);

    // 自动备份（每10次保存触发一次，或对重要模块每次保存）
    if (['users', 'progress', 'personnel'].includes(module) || Math.random() < 0.1) {
      scheduleBackup(module);
    }

    return true;
  } catch (error) {
    console.error(`Error saving ${module} data:`, error);
    return false;
  }
}

// 自动备份调度器
let backupTimeout = null;
function scheduleBackup(module) {
  if (backupTimeout) return; // 避免频繁备份
  
  backupTimeout = setTimeout(() => {
    createAutoBackup(module);
    backupTimeout = null;
  }, 5000); // 5秒延迟，合并多次保存操作
}

// 创建自动备份
function createAutoBackup(triggerModule) {
  try {
    const BACKUP_DIR = path.join(__dirname, 'backups');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `auto-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // 只备份变更的模块和相关模块
    const modulesToBackup = [triggerModule];
    if (triggerModule !== 'progress') modulesToBackup.push('progress');
    
    fs.mkdirSync(backupPath, { recursive: true });
    
    modulesToBackup.forEach(mod => {
      const srcFile = path.join(DATA_DIR, `${mod}.json`);
      const destFile = path.join(backupPath, `${mod}.json`);
      
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    });
    
    // 记录元信息
    fs.writeFileSync(
      path.join(backupPath, 'meta.json'),
      JSON.stringify({
        type: 'auto',
        trigger: triggerModule,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    console.log(`[AutoBackup] ✅ 自动备份完成: ${backupName} (触发模块: ${triggerModule})`);
    
    // 清理旧自动备份（保留最近20个）
    cleanAutoBackups(20);
  } catch (error) {
    console.warn('[AutoBackup] 备份失败:', error.message);
  }
}

// 清理旧备份
function cleanAutoBackups(maxKeep = 20) {
  try {
    const BACKUP_DIR = path.join(__dirname, 'backups');
    if (!fs.existsSync(BACKUP_DIR)) return;
    
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(name => name.startsWith('auto-'))
      .map(name => ({
        name,
        path: path.join(BACKUP_DIR, name),
        time: fs.statSync(path.join(BACKUP_DIR, name)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (backups.length > maxKeep) {
      backups.slice(maxKeep).forEach(backup => {
        try {
          fs.rmSync(backup.path, { recursive: true, force: true });
        } catch (e) {}
      });
    }
  } catch (e) {}
}

// 读取所有数据（兼容旧接口）
function readAllData() {
  const data = {};
  DATA_MODULES.forEach(module => {
    data[module] = readModuleData(module);
  });
  return data;
}

// 保存所有数据（兼容旧接口）
function saveAllData(data) {
  let success = true;
  DATA_MODULES.forEach(module => {
    if (data[module] !== undefined) {
      if (!saveModuleData(module, data[module])) {
        success = false;
      }
    }
  });
  return success;
}

// 获取文件类型分类
function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.dwg', '.dxf'];
  
  if (imageExts.includes(ext)) return 'images';
  if (docExts.includes(ext)) return 'documents';
  return 'others';
}

// API路由

// 用户登录接口
app.post('/api/login', validateInput, async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '请提供用户名和密码' });
  }

  // 手机号格式验证
  if (phone !== 'admin' && !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }

  try {
    let user = null;

    // 管理员账号（保持明文，但应尽快迁移）
    if (phone === 'admin' && password === 'admin') {
      user = { id: 'admin', name: '管理员', phone: 'admin', password: 'admin' };
    } else {
      // 普通用户验证
      const users = readModuleData('users');
      const foundUser = users.find(u => u.phone === phone);
      
      if (foundUser) {
        // 迁移明文密码（如果需要）
        await migratePasswordIfPlaintext(foundUser);
        
        // 验证密码
        const isValid = await verifyPassword(password, foundUser.password);
        if (isValid) {
          user = foundUser;
          // 确保用户有 id 字段
          if (!user.id) {
            user.id = user.phone || `user_${Date.now()}`;
          }
        }
      }
    }

    if (user) {
      const token = generateToken(user.id, user.name);
      // 记录登录日志
      console.log(`[${new Date().toISOString()}] User login: ${phone} from IP: ${req.ip}`);
      res.json({
        success: true,
        message: '登录成功',
        token: token,
        user: {
          id: user.id,
          name: user.name
        }
      });
    } else {
      // 记录失败日志（不含敏感信息）
      console.warn(`[${new Date().toISOString()}] Failed login attempt for: ${phone} from IP: ${req.ip}`);
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
});

// 用户登出接口
app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  res.json({ success: true, message: '登出成功' });
});

// 重置密码接口
app.post('/api/reset-password', validateInput, async (req, res) => {
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword) {
    return res.status(400).json({ success: false, message: '请提供手机号和新密码' });
  }

  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }

  // 验证新密码长度和复杂度
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少6个字符' });
  }

  // 密码强度检查（建议包含字母和数字）
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: '密码需同时包含字母和数字' 
    });
  }

  try {
    const users = readModuleData('users');
    const userIndex = users.findIndex(u => u.phone === phone);

    if (userIndex === -1) {
      console.warn(`[${new Date().toISOString()}] Password reset attempt for non-existent user: ${phone}`);
      return res.status(404).json({ success: false, message: '该手机号未注册' });
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword);
    
    // 更新用户密码（存储哈希值）
    users[userIndex].password = hashedPassword;
    users[userIndex].passwordChangedAt = new Date().toISOString();
    
    const success = saveModuleData('users', users);

    if (success) {
      console.log(`[${new Date().toISOString()}] Password reset successful for: ${phone}`);
      res.json({
        success: true,
        message: '密码重置成功'
      });
    } else {
      console.error(`[${new Date().toISOString()}] Failed to save password for: ${phone}`);
      res.status(500).json({ success: false, message: '密码重置失败，请重试' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，请稍后重试' });
  }
});

// 获取当前用户信息
app.get('/api/current-user', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// 获取所有数据 (可选认证) - 兼容旧接口
app.get('/api/data', optionalAuthMiddleware, (req, res) => {
  const data = readAllData();
  res.json(data);
});

// 保存所有数据 (可选认证) - 局域网环境下允许匿名保存
app.post('/api/data', optionalAuthMiddleware, (req, res) => {
  const success = saveAllData(req.body);
  if (success) {
    console.log(`[${new Date().toISOString()}] 数据已保存 by: ${req.user?.name || 'anonymous'}`);

    // 广播所有模块的数据更新
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(module => {
        if (DATA_MODULES.includes(module)) {
          broadcastDataUpdate(module, req.body[module]);
        }
      });
    }

    res.json({ success: true, message: '数据保存成功' });
  } else {
    res.status(500).json({ success: false, message: '数据保存失败' });
  }
});

// 通用模块API生成函数
function createModuleAPI(module) {
  // 获取列表 (可选认证)
  app.get(`/api/${module}`, optionalAuthMiddleware, (req, res) => {
    const data = readModuleData(module);
    res.json(data);
  });

  // 保存列表 (需要认证) - 保存后广播给所有客户端
  app.post(`/api/${module}`, authMiddleware, (req, res) => {
    const success = saveModuleData(module, req.body);
    if (success) {
      // 广播数据更新给所有连接的客户端
      broadcastDataUpdate(module, req.body);

      res.json({ success: true, message: `${module}数据保存成功` });
    } else {
      res.status(500).json({ success: false, message: `${module}数据保存失败` });
    }
  });

  // 支持通过 key 保存特定数据（用于 progressDetail-A-1 这样的键）
  app.put(`/api/${module}`, authMiddleware, (req, res) => {
    const { key, data } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: '缺少 key 参数' });
    }

    // 保存到对应的文件（使用 key 作为文件名或存储位置）
    const success = saveModuleData(module, { [key]: data }, true);
    if (success) {
      // 广播更新
      broadcastDataUpdate(module, { [key]: data });

      res.json({ success: true, message: `${module}[${key}] 数据保存成功` });
    } else {
      res.status(500).json({ success: false, message: `${module}[${key}] 数据保存失败` });
    }
  });
}

// 为所有模块创建API
DATA_MODULES.forEach(module => {
  createModuleAPI(module);
});

// 日志添加接口
// 添加单条日志 (可选认证)
app.post('/api/logs/add', optionalAuthMiddleware, (req, res) => {
  const logs = readModuleData('logs');
  logs.unshift(req.body);
  const success = saveModuleData('logs', logs);
  if (success) {
    res.json({ success: true, message: '日志添加成功' });
  } else {
    res.status(500).json({ success: false, message: '日志添加失败' });
  }
});

// 文件上传 (可选认证 - 局域网环境)
app.post('/api/upload', optionalAuthMiddleware, (req, res) => {
  try {
    const { image, filename, category } = req.body;
    
    if (!image || !filename) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 文件大小检查（base64字符串长度估算，约1/4为原始字节大小）
    const base64Length = image.includes(';base64,') 
      ? image.split(';base64,')[1].length 
      : image.length;
    const estimatedSizeBytes = Math.round(base64Length * 0.75);
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 限制最大50MB
    
    if (estimatedSizeBytes > MAX_FILE_SIZE) {
      return res.status(413).json({ 
        success: false, 
        message: `文件过大（约${Math.round(estimatedSizeBytes / 1024 / 1024)}MB），最大允许50MB` 
      });
    }

    // 确定保存目录
    let targetDir;
    if (category && FILE_CATEGORIES.includes(category)) {
      targetDir = path.join(UPLOADS_DIR, category);
    } else {
      targetDir = path.join(UPLOADS_DIR, getFileCategory(filename));
    }
    
    // 确保目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 处理base64数据
    let buffer;
    if (image.includes(';base64,')) {
      // 带 MIME 类型的 base64 数据
      const base64Data = image.split(';base64,')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // 纯 base64 数据
      buffer = Buffer.from(image, 'base64');
    }
    
    // 生成唯一文件名
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const uniqueFilename = `${baseName}_${timestamp}_${randomStr}${ext}`;
    
    const filePath = path.join(targetDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);
    
    // 返回相对URL路径
    const relativeDir = path.relative(UPLOADS_DIR, targetDir);
    const url = `/uploads/${relativeDir}/${uniqueFilename}`.replace(/\\/g, '/');
    
    res.json({ 
      success: true, 
      message: '文件上传成功',
      filename: uniqueFilename,
      originalFilename: filename,
      url: url,
      size: buffer.length
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: '文件上传失败: ' + error.message });
  }
});

// 删除文件API
app.delete('/api/upload/:category/:filename', authMiddleware, (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, category, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: '文件删除成功' });
    } else {
      res.status(404).json({ success: false, message: '文件不存在' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: '文件删除失败' });
  }
});

// 兼容旧的删除接口
app.delete('/api/upload/:filename', authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    
    // 在所有分类目录中查找文件
    let found = false;
    for (const category of FILE_CATEGORIES) {
      const filePath = path.join(UPLOADS_DIR, category, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        found = true;
        break;
      }
    }
    
    // 也检查根上传目录
    if (!found) {
      const rootFilePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(rootFilePath)) {
        fs.unlinkSync(rootFilePath);
        found = true;
      }
    }
    
    if (found) {
      res.json({ success: true, message: '文件删除成功' });
    } else {
      res.status(404).json({ success: false, message: '文件不存在' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: '文件删除失败' });
  }
});

// 获取上传文件列表 (需要认证)
app.get('/api/uploads', authMiddleware, (req, res) => {
  try {
    const fileList = [];
    
    FILE_CATEGORIES.forEach(category => {
      const categoryDir = path.join(UPLOADS_DIR, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir);
        files.forEach(filename => {
          const filePath = path.join(categoryDir, filename);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            fileList.push({
              filename,
              category,
              size: stats.size,
              createdAt: stats.birthtime,
              url: `/uploads/${category}/${filename}`
            });
          }
        });
      }
    });
    
    res.json(fileList);
  } catch (error) {
    console.error('Error reading uploads:', error);
    res.status(500).json({ success: false, message: '读取上传文件失败' });
  }
});

// 批量检查文件是否存在（用于前端实时监测）- 可选认证
app.post('/api/check-files-exist', optionalAuthMiddleware, (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!Array.isArray(urls)) {
      return res.status(400).json({ success: false, message: '请提供URL数组' });
    }
    
    const results = {};
    
    urls.forEach(url => {
      if (!url || typeof url !== 'string') {
        results[url] = { exists: false };
        return;
      }
      
      // 从URL中提取文件路径
      // URL格式: /uploads/category/filename 或 /uploads/filename
      let filePath;
      
      if (url.startsWith('/uploads/')) {
        const relativePath = url.substring('/uploads/'.length);
        filePath = path.join(UPLOADS_DIR, relativePath);
      } else {
        filePath = path.join(UPLOADS_DIR, url);
      }
      
      results[url] = {
        exists: fs.existsSync(filePath),
        path: filePath
      };
    });
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error checking files:', error);
    res.status(500).json({ success: false, message: '检查文件失败' });
  }
});

// 获取指定分类的文件列表
app.get('/api/uploads/:category', authMiddleware, (req, res) => {
  try {
    const { category } = req.params;
    const categoryDir = path.join(UPLOADS_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(categoryDir);
    const fileList = files.map(filename => {
      const filePath = path.join(categoryDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        url: `/uploads/${category}/${filename}`
      };
    });
    
    res.json(fileList);
  } catch (error) {
    console.error('Error reading uploads:', error);
    res.status(500).json({ success: false, message: '读取上传文件失败' });
  }
});

// 所有其他路由返回index.html（SPA支持）
app.get('*', (req, res) => {
  const indexPath = path.join(STATIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// 系统健康检查端点（公开，用于监控）
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    checks: {
      database: checkDataIntegrity(),
      filesystem: checkFileSystem(),
      memory: checkMemoryUsage()
    }
  };

  const allHealthy = Object.values(healthStatus.checks).every(check => check.status === 'ok');
  
  if (!allHealthy) {
    healthStatus.status = 'degraded';
    return res.status(503).json(healthStatus);
  }

  res.json(healthStatus);
});

// 数据一致性检查函数
function checkDataIntegrity() {
  try {
    const issues = [];
    
    // 检查所有数据模块文件是否存在且可读
    DATA_MODULES.forEach(module => {
      const moduleFile = path.join(DATA_DIR, `${module}.json`);
      if (!fs.existsSync(moduleFile)) {
        issues.push(`Missing data file: ${module}.json`);
      } else {
        try {
          const data = JSON.parse(fs.readFileSync(moduleFile, 'utf8'));
          if (!Array.isArray(data)) {
            issues.push(`Invalid format in ${module}.json (expected array)`);
          }
        } catch (parseError) {
          issues.push(`Parse error in ${module}.json: ${parseError.message}`);
        }
      }
    });

    return {
      status: issues.length === 0 ? 'ok' : 'warning',
      issues,
      moduleCount: DATA_MODULES.length
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// 文件系统检查函数
function checkFileSystem() {
  try {
    const checks = [
      { name: 'data_dir', path: DATA_DIR },
      { name: 'uploads_dir', path: UPLOADS_DIR },
      { name: 'static_dir', path: STATIC_DIR }
    ];

    const results = checks.map(check => ({
      name: check.name,
      exists: fs.existsSync(check.path),
      writable: fs.existsSync(check.path) ? fs.accessSync(check.path, fs.constants.W_OK) === null : false
    }));

    const allOk = results.every(r => r.exists && r.writable);

    return {
      status: allOk ? 'ok' : 'error',
      details: results
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// 内存使用情况检查
function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  return {
    status: usagePercent < 90 ? 'ok' : 'warning',
    heapUsedMB,
    heapTotalMB,
    usagePercent,
    rssMB: Math.round(memUsage.rss / 1024 / 1024)
  };
}

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log(`=================================`);
  console.log(`服务器已启动！`);
  console.log(`端口: ${PORT}`);
  console.log(`监听地址: ${HOST}`);
  console.log(`项目目录: ${PROJECT_DIR}`);
  console.log(`静态文件: ${STATIC_DIR}`);
  console.log(`上传文件: ${UPLOADS_DIR}`);
  console.log(`数据目录: ${DATA_DIR}`);
  console.log(`=================================`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://192.168.8.174:${PORT}`);
  console.log(`WebSocket: ws://192.168.8.174:${PORT}/ws`);
  console.log(`=================================`);
  console.log('数据存储结构:');
  console.log(`  data/ - 各模块数据文件`);
  DATA_MODULES.forEach(m => console.log(`    ${m}.json`));
  console.log(`  uploads/ - 上传文件分类存储`);
  FILE_CATEGORIES.forEach(c => console.log(`    ${c}/`));
  console.log(`=================================`);
  console.log('✅ WebSocket实时同步已启用');
  console.log('按 Ctrl+C 停止服务器');
});
