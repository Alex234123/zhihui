/**
 * 局域网部署服务器 - 智慧工地管理系统
 *
 * ⚠️ 重要提示：此文件已弃用！
 * 
 * 推荐使用 server.js 进行部署，它提供完整功能：
 * ✅ 静态文件服务
 * ✅ API接口（数据同步必需）
 * ✅ WebSocket实时同步
 * ✅ 文件上传/下载
 * ✅ 用户认证
 *
 * 启动命令：
 *   npm run server
 *   或
 *   node server.js
 *
 * 如果仍需使用此文件（仅静态文件，无API），请确保：
 * - 不需要数据同步功能
 * - 仅用于预览UI界面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('\n⚠️  警告: deploy-lan.js 已弃用！');
console.log('📌 请使用 "npm run server" 或 "node server.js" 启动完整功能服务器\n');

// 配置
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp'
};

// 获取本机IP地址
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部和链路本地地址
      if (!iface.internal && iface.family === 'IPv4' && iface.address !== '127.0.0.1') {
        // 排除169.254.x.x（链路本地地址）
        if (!iface.address.startsWith('169.254.')) {
          ips.push({
            address: iface.address,
            interface: name
          });
        }
      }
    }
  }
  
  return ips;
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  try {
    // 解析URL
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    
    // 默认到index.html
    if (urlPath === '/') {
      urlPath = '/index.html';
    }
    
    // 安全检查：防止目录遍历攻击
    if (urlPath.includes('..')) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }
    
    // 构建文件路径
    const filePath = path.join(DIST_DIR, urlPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`[404] ${req.url} -> 文件不存在: ${filePath}`);
      
      // SPA回退：对于API请求以外的路径，返回index.html
      if (!urlPath.startsWith('/api')) {
        const indexPath = path.join(DIST_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath);
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          });
          res.end(content);
          return;
        }
      }
      
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    // 获取文件状态
    const stat = fs.statSync(filePath);
    
    // 如果是目录，查找index.html
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        return;
      }
    }
    
    // 读取文件内容
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // 设置缓存策略
    let cacheControl = 'public, max-age=3600'; // 静态资源缓存1小时
    if (ext === '.html') {
      cacheControl = 'no-cache'; // HTML不缓存
    } else if (ext === '.js' || ext === '.css') {
      cacheControl = 'public, max-age=86400'; // JS/CSS缓存1天
    }
    
    // 响应头
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    };
    
    // 添加CORS头（允许跨域）
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    // 处理OPTIONS请求（预检请求）
    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      res.end();
      return;
    }
    
    console.log(`[200] ${req.url} -> ${filePath} (${(content.length / 1024).toFixed(1)}KB)`);
    
    res.writeHead(200, headers);
    res.end(content);
    
  } catch (error) {
    console.error('[ERROR]', error.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 智慧工地管理系统 - 局域网部署成功！');
  console.log('='.repeat(70));
  console.log(`\n⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`📁 服务目录: ${DIST_DIR}`);
  console.log(`🔌 监听端口: ${PORT}\n`);
  
  console.log('-'.repeat(70));
  console.log('📱 访问地址（请在同一局域网内的设备上打开）：');
  console.log('-'.repeat(70));
  
  // 显示所有可用的访问地址
  ips.forEach((ip, index) => {
    const url = `http://${ip.address}:${PORT}/dashboard`;
    console.log(`${index + 1}. [${ip.interface}] ${url}`);
  });
  
  // 本地访问
  console.log(`\n💻 本机访问: http://localhost:${PORT}/dashboard`);
  
  console.log('\n' + '-'.repeat(70));
  console.log('📋 访问信息:');
  console.log('-'.repeat(70));
  console.log(`✅ 用户名: admin`);
  console.log(`✅ 密码:   admin`);
  console.log(`\n📝 提示:`);
  console.log(`   • 确保设备连接在同一WiFi/局域网`);
  console.log(`   • 如果无法访问，请检查防火墙设置`);
  console.log(`   • Windows防火墙可能需要允许Node.js入站连接`);
  console.log(`   • 按 Ctrl+C 停止服务器\n`);
  
  console.log('='.repeat(70));
  console.log('🎉 系统已就绪，等待访问...\n');
  
  // 显示网络接口详情
  if (ips.length > 0) {
    console.log('🔍 检测到的网络接口:');
    ips.forEach(ip => {
      console.log(`   • ${ip.interface}: ${ip.address}`);
    });
    console.log('');
  }
});

// 错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 错误: 端口 ${PORT} 已被占用！`);
    console.error(`   请先停止占用该端口的进程，或修改端口后重试`);
    console.error(`   可尝试: npm run deploy -- --port=${parseInt(PORT) + 1}`);
    process.exit(1);
  } else {
    console.error('❌ 服务器错误:', error.message);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n⏹️  正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已停止');
    process.exit(0);
  });
  
  // 强制退出（5秒后）
  setTimeout(() => process.exit(0), 5000);
});
