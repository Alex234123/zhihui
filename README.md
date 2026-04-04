# 智慧工地管理系统 (ZhiHui Construction Site Management)

## 项目简介
基于 Vue 3 + Express 的智慧工地综合管理平台，支持多模块数据管理、文件上传下载、进度跟踪、安全巡检等功能。

## 技术栈

### 前端
- **Vue 3** - Composition API + `<script setup>`
- **Element Plus** - UI 组件库
- **Vue Router 5** - 路由管理（含Token验证守卫）
- **ECharts** - 数据可视化
- **Vite** - 构建工具

### 后端
- **Express.js** - Web服务器
- **JSON文件存储** - 无需数据库，轻量部署
- **bcryptjs** - 密码哈希加密
- **cors** - 跨域支持

## 功能模块

| 模块 | 说明 |
|------|------|
| 📊 数据看板 | 各区块施工进度概览、照片展示 |
| 👥 人员管理 | 工地人员信息管理 |
| 🔧 设备管理 | 设备台账与状态追踪 |
| 🛡️ 安全巡检 | 安全检查记录与问题跟踪 |
| 📈 进度管理 | 多区块树形进度节点管理（支持增删改） |
| 📦 材料管理 | 材料库存与领用记录 |
| 📁 文件管理 | 多分类文件上传/预览/删除 |
| ⭐ 质量管理 | 质量检验记录 |
| 📰 大事件 | 重要事件时间线 |
| 🔄 审批流程 | 工作流申请与审批 |

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev      # 前端开发服务器 (端口3000)
npm run server   # 后端API服务器 (端口3001)
```

### 生产构建
```bash
npm run build    # 构建前端到 dist/
npm start        # 启动后端服务（自动托管静态文件）
```

## 部署

### 局域网访问
启动后直接通过 `http://<本机IP>:3001` 访问

### 公网部署
运行 `start-public.bat` 一键启动公网隧道（localtunnel / Cloudflare Tunnel）

## 目录结构
```
d:\zhihui\
├── src/                  # 前端源码
│   ├── components/       # Vue组件
│   ├── api/             # API接口层
│   ├── services/        # 数据服务层
│   ├── utils/           # 工具函数
│   └── data/            # 数据定义
├── server.js            # Express后端服务器
├── data/                # JSON数据存储（运行时生成）
├── uploads/             # 上传文件存储
└── dist/                # 前端构建产物
```

## 账号信息
- 管理员账号: `admin` / `admin`
- 支持手机号注册和登录
- 支持"忘记密码"功能（日期验证码：YYYYMMDD格式）

## License
MIT