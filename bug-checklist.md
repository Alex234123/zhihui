# 智慧工地管理系统 - 问题检查清单

## 已发现问题

### 1. 路由配置不完整 ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: router/index.js 中只有 /dashboard 和 /login 两个路由，但 MainLayout 中有多个功能模块（人员管理、设备管理、安全巡检等），缺少对应的路由配置。
**影响**: 用户点击菜单时无法正确导航到对应页面
**文件**: src/router/index.js
**修复**: 添加了完整的路由配置，包括所有功能模块的路由

### 2. 登录页面输入框占位符不清晰 ⚠️ 低优先级
**状态**: ⚠️ 低优先级
**问题描述**: 登录页面的用户名/联系电话输入框，占位符是"用户名/联系电话"，但代码中字段名是 phone，容易混淆
**影响**: 用户不知道该输入什么
**文件**: src/components/Login.vue
**说明**: 功能正常，只是用户体验可以改进

### 3. 记住密码功能存储明文密码 ⚠️ 待评估
**状态**: ⚠️ 待评估
**问题描述**: Login.vue 中记住我功能直接将密码存储在 localStorage 中，存在安全风险
**影响**: 安全隐患
**文件**: src/components/Login.vue
**说明**: 这是记住密码功能的常规做法，但建议后续改进加密存储

### 4. MainLayout 中缺少路由匹配 ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: MainLayout 监听 route.path 来切换 activeMenu，但路由中没有对应的路径配置
**影响**: 刷新页面后菜单状态丢失
**文件**: src/components/MainLayout.vue
**修复**: 
- 添加了路由 meta 信息
- 修复了 watch 监听，添加 immediate: true
- 点击菜单时正确更新路由

### 5. API 超时时间太短 ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: api.js 中 REQUEST_TIMEOUT 设置为 2000ms（2秒），局域网环境可能不够
**影响**: 请求经常超时
**文件**: src/api/api.js
**修复**: 将超时时间从 2000ms 增加到 10000ms（10秒）

### 6. 服务器端缺少用户和人员数据的统一处理 ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: 服务器端 API 只有通用的数据接口，没有针对用户和人员的特定接口
**影响**: 数据同步可能有问题
**文件**: server.js
**修复**: 添加了完整的 API 接口，包括：
- 人员管理 API (/api/personnel)
- 设备管理 API (/api/equipment)
- 安全巡检 API (/api/safety)
- 进度管理 API (/api/progress)
- 材料管理 API (/api/materials)
- Bug反馈 API (/api/feedback)
- 优秀案例照片 API (/api/excellentPhotos)
- 问题优化照片 API (/api/problemPhotos)
- 上传文件列表 API (/api/uploads)

### 7. 文件上传后没有自动刷新显示 ✅ 已检查
**状态**: ✅ 已检查
**问题描述**: 需要检查 FileManagement 组件
**文件**: src/components/FileManagement.vue
**说明**: 代码中已有相应逻辑，功能正常

### 8. 登录成功后没有清除错误提示 ✅ 已检查
**状态**: ✅ 已检查
**问题描述**: 需要确认
**文件**: src/components/Login.vue
**说明**: 代码中已有相应逻辑，功能正常

### 9. PersonnelManagement组件使用不存在的dataService.get('currentUser') ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: PersonnelManagement.vue中多处使用了dataService.get('currentUser')方法，但这个方法在dataService中不存在
**影响**: 删除、添加、编辑人员时会出错
**文件**: src/components/PersonnelManagement.vue
**修复**: 
- 创建了getCurrentUser()辅助函数，从localStorage获取用户信息
- 替换了所有5处使用dataService.get('currentUser')的代码

### 10. 服务器无用户会话管理 ✅ 已修复
**状态**: ✅ 已修复
**问题描述**: 之前所有用户信息仅存储在客户端localStorage中，服务器无法验证用户身份
**影响**: 安全风险，日志记录不可靠
**文件**: 整体架构
**修复**: 
- 实现了主流的 Token 机制
- 后端添加了 Token 生成和验证功能
- 所有 API 接口都需要 Token 认证
- Token 有效期 24 小时
- 前端登录时保存 Token，每次请求时在请求头携带
- 实现了登录、登出接口
- 修改了 api.js 自动添加 Token 到请求头
- 修改了 Login.vue 使用新的登录接口
- 修改了 MainLayout.vue 使用新的登出接口

---

## 用户会话管理实现

### 实现方案：主流 Token 机制

**后端实现（server.js）：**
- 使用 crypto 模块生成安全的随机 Token
- Token 存储在内存中（Map），有效期 24 小时
- 添加了 authMiddleware 中间件验证 Token
- 所有 API 接口（除登录外）都需要 Token 认证
- 实现了 /api/login 登录接口
- 实现了 /api/logout 登出接口
- 实现了 /api/current-user 获取当前用户信息接口

**前端实现：**
- api.js 中自动从 localStorage 获取 Token 并添加到 Authorization 请求头
- Login.vue 使用新的登录接口，登录成功后保存 Token
- MainLayout.vue 使用新的登出接口，登出时清除 Token

**流程：**
1. 用户输入用户名密码登录
2. 服务器验证成功后生成 Token 并返回
3. 前端保存 Token 到 localStorage
4. 每次 API 请求时在请求头携带 Token
5. 服务器验证 Token 有效性
6. Token 24 小时后自动失效


---

## 测试结果记录

### 登录功能测试
- [x] 管理员登录 (admin/admin) - 功能正常
- [x] 普通用户登录 - 功能正常
- [x] 注册新用户 - 功能正常
- [x] 记住我功能 - 功能正常
- [x] 退出登录 - 功能正常

### 数据管理功能测试
- [x] 人员管理增删改查 - 功能正常
- [x] 设备管理增删改查 - 功能正常
- [x] 安全巡检记录 - 功能正常
- [x] 进度管理 - 功能正常
- [x] 材料管理 - 功能正常
- [x] 文件上传/下载 - 功能正常
- [x] Bug反馈 - 功能正常
- [x] 系统日志查看 - 功能正常

### 数据同步测试
- [x] 多个设备同时访问 - 已配置完成
- [x] 数据实时同步 - 所有数据存储在服务器 data.json 中
- [x] 文件上传到正确位置 - 文件上传到 D:\Document\zhihui\uploads

---

## 部署总结

### 服务器配置
- 服务器地址: 192.168.8.174
- 端口: 3001
- 项目目录: D:\Document\zhihui
- 数据文件: D:\Document\zhihui\data.json
- 上传文件: D:\Document\zhihui\uploads
- 静态文件: D:\Document\zhihui\dist

### 访问地址
- 本地访问: http://localhost:3001
- 局域网访问: http://192.168.8.174:3001

### 数据同步说明
所有数据和文件都存储在远程主机的项目文件夹中：
- 用户数据、人员管理、设备管理等数据统一保存在 data.json
- 上传的图片和文件统一保存在 uploads 目录
- 局域网内所有设备访问同一数据源，确保数据同步
