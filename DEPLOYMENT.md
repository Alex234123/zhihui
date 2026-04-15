# 智慧工地管理系统 - 部署说明

## 环境配置

项目支持开发环境和生产环境的灵活配置。

### 开发环境
- API地址: `http://localhost:3001/api`
- 使用 `.env.development` 配置文件

### 生产环境
- API地址: `http://192.168.8.174:3001/api`
- 使用 `.env.production` 配置文件

## 部署到 192.168.8.174 服务器

### 1. 构建生产版本

```bash
# 在项目根目录执行
npm run build
```

### 2. 启动服务器

#### 使用默认配置（数据存储在项目根目录）

```bash
npm run start
# 或
node server.js
```

#### 自定义数据存储位置（推荐）

如果希望将数据存储到指定的开发文件夹中，可以设置环境变量：

```bash
# Linux/Mac
export DATA_DIR=/path/to/your/data/folder
export UPLOADS_DIR=/path/to/your/uploads/folder
export PORT=3001
export HOST=0.0.0.0
npm run start

# Windows (PowerShell)
$env:DATA_DIR="C:\path\to\your\data\folder"
$env:UPLOADS_DIR="C:\path\to\your\uploads\folder"
npm run start
```

### 3. 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | 3001 |
| `HOST` | 服务器监听地址 | 0.0.0.0 |
| `DATA_DIR` | 数据文件存储目录 | 项目根目录 |
| `UPLOADS_DIR` | 上传文件存储目录 | 项目根目录/uploads |

### 4. 访问应用

部署完成后，可以通过以下地址访问：
- 本地: http://localhost:3001
- 局域网: http://192.168.8.174:3001

## 开发模式

```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器（另一个终端）
npm run server
```

## 数据管理

- 数据文件: `data.json` (位置由 `DATA_DIR` 决定)
- 备份文件: `backups/` 目录（自动创建）
- 上传文件: `uploads/` 目录（位置由 `UPLOADS_DIR` 决定）
