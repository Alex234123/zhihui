# 智慧工地管理系统 (ZhiHui Construction Site Management)

## 项目简介
基于 Vue 3 + Express 的智慧工地综合管理平台，支持多模块数据管理、文件上传下载、进度跟踪、安全巡检等功能。

## 📝 更新日志

> 所有版本更新记录请查看 [**CHANGELOG.md**](./CHANGELOG.md)

| 版本 | 日期 | 核心内容 |
|------|------|----------|
| **[v2.0](./CHANGELOG.md#v20---进度管理全面升级-2026-04-05)** | 2026-04-05 | ⭐ **智能状态系统(8种)** + 四时间字段 + 甘特图双轴 + 看板实时同步 |
| [v1.5](./CHANGELOG.md#v15---功能模块补全-2026-04-04) | 2026-04-04 | 22个组件全部上传 + 11个功能模块补全 |
| [v1.0](./CHANGELOG.md#v10---项目初始化-2026-04-03) | 2026-04-03 | 项目基础搭建 + 前后端框架 + 数据定义 |

## 技术栈

### 前端
- **Vue 3** - Composition API + `<script setup>`
- **Element Plus** - UI 组件库
- **Vue Router 5** - 路由管理（含Token验证守卫）
- **ECharts 6** - 数据可视化（甘特图/仪表盘）
- **Vite 5** - 构建工具

### 后端
- **Express.js** - Web服务器
- **JSON文件存储** - 无需数据库，轻量部署
- **bcryptjs** - 密码哈希加密
- **cors** - 跨域支持

## 功能模块

| 模块 | 说明 | v2.0 更新 |
|------|------|----------|
| 📊 数据看板 | 各区块施工进度概览、照片展示、计划vs实际对比 | ✅ 实时同步任务树 |
| 👥 人员管理 | 工地三方责任体信息、评分排名、关联验证 | |
| 🔧 设备管理 | 设备台账、状态追踪、工作流删除审批 | |
| 🛡️ 安全巡检 | 安全检查记录、问题跟踪、批量操作 | |
| 📈 进度管理 | 多区块树形节点、甘特图双轴、智能状态(8种) | ✅ **全面升级** |
| 📦 材料管理 | 材料库存、领用记录、预警阈值 | |
| 📁 文件管理 | 多分类文件上传/预览/删除 | |
| ⭐ 质量管理 | 质量检验记录、优秀案例/问题分类 | |
| 📰 大事件 | 重要事件时间线、照片拖拽上传 | |
| 🔄 审批流程 | 工作流申请与审批（管理员处理） | |
| 🎨 视觉效果 | 太空背景、粒子动画、液态玻璃UI、macOS Dock导航 | |
| 📋 系统工具 | 日志系统、性能监控、错误处理、系统信息面板 | |

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev      # 前端开发服务器 (端口3000, 支持局域网访问)
npm run server   # 后端API服务器 (端口3001)
```

### 生产构建
```bash
npm run build    # 构建前端到 dist/
npm start        # 启动后端服务（自动托管静态文件）
```

## 部署

### 局域网访问
启动后通过 `http://<本机IP>:3000` 访问前端，`http://<本机IP>:3001` 访问后端API

### 公网部署
运行 `start-public.bat` 一键启动公网隧道（localtunnel / Cloudflare Tunnel）

## 目录结构
```
d:\\zhihui\\\n├── src/                  # 前端源码
│   ├── components/       # Vue组件 (22个)
│   │   ├── Dashboard.vue          # 数据看板 (3049行)
│   │   ├── ProgressManagement.vue # 进度管理 (~1900+行)
│   │   ├── PersonnelManagement.vue # 人员管理 (~2570行)
│   │   └── ...                   # 其他19个组件
│   ├── api/             # API接口层
│   ├── services/        # 数据服务层 (dataService/loggerService/performanceService)
│   ├── utils/           # 工具函数 (storage.js)
│   ├── data/            # 数据定义 (施工节点模板)
│   ├── types/           # 类型定义
│   ├── router/          # 路由配置
│   └── styles/          # 全局样式 (SCSS液态玻璃风格)
├── server.js            # Express后端服务器 (JWT+20数据模块)
├── CHANGELOG.md         # 🆕 更新日志
├── package.json         # 项目依赖
├── vite.config.js       # Vite构建配置 (host: 0.0.0.0 局域网支持)
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