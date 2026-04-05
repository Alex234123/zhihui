# 更新日志 (CHANGELOG)

> 本文件记录智慧工地管理系统所有版本的更新内容。

---

## v2.0 - 进度管理全面升级 (2026-04-05)

### 🎯 核心更新：进度管理模块大改

#### 1. 智能状态系统（4 → 8 种状态）
- **新增 8 种任务状态**，由 `computeTaskStatus()` 函数自动综合计算
- 状态基于三维度判定：完成百分比 + 计划时间 vs 实际时间 + 当前日期

| 状态值 | 显示名 | 触发条件 | 颜色 |
|--------|--------|----------|------|
| `not_started` | 未开始 | progress=0，未到计划开始日 | 灰 |
| `started` | 已开始 | 有实际开工日期，progress=0 | 蓝 |
| `in_progress` | 施工中 | 0 < progress < 100，有实际开工 | 蓝 |
| **`ahead_of_schedule`** | **超前** ⭐ | 实际进度 > 预期进度 10%+ | 绿 |
| **`behind_schedule`** | **滞后** ⚠️ | 实际进度 < 预期进度 10%+ | 橙 |
| `delayed` | 延期 🔴 | 已过计划结束日期但未完成 | 红 |
| `paused` | 暂停 | 手动标记暂停 | 灰 |
| `completed` | 已完成 | progress=100 或有实际完工日 | 绿 |

#### 2. 四时间字段系统
- 原始 `startDate/endDate` → 拆分为 **4 个独立时间字段**
- 向后兼容：旧数据自动映射到新结构

| 字段名 | 用途 |
|--------|------|
| `plannedStartDate` | 计划开始时间 |
| `plannedEndDate` | 计划结束时间 |
| `actualStartDate` | 实际开工时间（现场开工时填写） |
| `actualEndDate` | 实际完工时间（完工后填写） |

#### 3. 节点编辑抽屉 UI 重做
- 分区表单设计：责任信息 → 进度与状态 → 计划时间 → 实际时间 → 备注附件
- 新增**智能状态标签** + **进度偏差提示**（如"进度滞后约8%"）
- 自动行为：progress > 0% 自动填实际开工日期；100% 自动填实际完工日期

#### 4. 甘特图双轴显示
- **浅色半透明条** = 计划时间
- **深色实色条** = 实际进度
- 底部图例区分两种数据
- 修复甘特图为空问题：原模板任务日期为 null 导致无数据渲染

#### 5. Dashboard 看板实时同步修复
- **双数据源架构**：`progressList`(摘要) + `progressDetailList`(完整任务树)
- 新增 `computeBlockStageInfo()` 函数从任务树实时计算当前阶段/任务名称
- 彻底解决看板区块施工情况显示旧数据不更新的问题

### 🐛 Bug 修复
- **甘特图不显示**：模板任务 startDate/endDate 为 null 被过滤，现自动生成估算日期
- **图表实例重复初始化**：切换标签页时未 dispose 旧实例，已修复
- **变量名笔误**：`subStages.tasks` → `subStage.tasks`
- **看板阶段信息不更新**：`getCurrentStageInfo()` 基于 progress 数值查找全部落空，改为基于 status 遍历
- **Dashboard.vue 文件截断**：推送时误传片段导致文件从 3049 行变为 5 行，已恢复完整文件

### 🔧 配置变更
- **vite.config.js**：添加 `host: '0.0.0.0'` 支持局域网访问
- 局域网设备可通过 `http://<本机IP>:3000` 直接访问前端

### 📦 构建结果
```
dist/index.html          0.46 kB
dist/assets/index-xxx.js   614 kB (gzipped: 191 kB)
构建耗时: 2分26秒 | 零错误
```

---

## v1.5 - 功能模块补全 (2026-04-04)

### ✅ 上传的组件文件（共 20 个）

#### 核心业务组件
| 文件 | 说明 | 行数 |
|------|------|------|
| `PersonnelManagement.vue` | 人员管理 - 三方责任体(建设/监理/施工) + 评分排名系统 | ~2570 |
| `EquipmentManagement.vue` | 设备管理 - CRUD + 照片上传 + 权限控制 + 工作流删除 | ~1453 |
| `SafetyInspection.vue` | 安全巡检 - 搜索过滤 + 关联设备/人员选择 + 批量操作 | ~3127 |
| `MaterialManagement.vue` | 材料管理 - 分类筛选 + 库存预警 + 领用记录 + 工作流审批 | ~2777 |
| `QualityManagement.vue` | 质量管理 - 优秀案例/问题记录 + 照片同步 + 详情查看 | ~2019 |
| `MajorEvents.vue` | 大事件 - 时间线展示 + 统计卡片 + 类型彩色标签 + 照片拖拽上传 | ~1637 |
| `ProgressManagement.vue` | 进度管理 - 多区块树形节点 + 甘特图 + 批量编辑 + 模板复制 | ~1900+
| `ProgressManagementPro.vue` | 进度管理Pro版 - 高级功能扩展 | ~3899 |
| `FileManagement.vue` | 文件管理 - 多分类上传/预览/删除 + 大小统计 | ~2217 |
| `Dashboard.vue` | 数据看板 - 区块进度概览 + 照片画廊 + 进度对比图表 | ~3049 |
| `MainLayout.vue` | 主布局 - macOS Dock 导航栏 + 液态玻璃风格 | ~2390 |
| `Login.vue` | 登录页 - 圆通品牌主题 + 手机号登录/注册 | ~2155 |

#### 辅助功能组件
| 文件 | 说明 | 行数 |
|------|------|------|
| `BottomDock.vue` | macOS 风格底部导航栏 - 液态玻璃效果 + hover 动画 | ~1479 |
| `SpaceBackground.vue` | 太空背景动画 - Canvas 星空 + 流星 + 星云 + 极光 | ~945 |
| `SystemInfo.vue` | 系统信息面板 - 设备/网络/健康评分 + 数据校验 | ~2937 |
| `LogSystem.vue` | 日志系统 - 搜索/分级过滤 + dataService 实时订阅 | ~830 |
| `FeedbackForm.vue` | 反馈表单 - 四种类型 + 文件附件 + localStorage 存储 | ~1074 |
| `BugFeedback.vue` | Bug 反馈 - 提交/解决/删除 + 严重程度分级 | ~1010 |
| `Workflow.vue` | 工作流管理 - 科幻主题 + 三标签页(我的/待处理/所有) + 审批流程 | ~1980 |
| `ErrorHandler.vue` | 错误处理 - 统计卡片 + 日志搜索 + 详情对话框 | ~947 |
| `PerformanceMonitor.vue` | 性能监控 - Navigation/Paint/Resources/API/Memory 五维指标 | ~881 |
| `ParticleBackground.vue` | 粒子背景 - Canvas 物理引擎 + Vector2D + 鼠标交互 | ~706 |

#### 服务 & 工具文件
| 文件 | 说明 |
|------|------|
| `services/dataService.js` | 数据服务核心 - 内存缓存→localStorage→API 三级存储 + 重试机制 |
| `services/loggerService.js` | 日志服务 - ERROR/WARN/INFO/DEBUG/TRACE 五级 + 控制台输出 + 本地持久化 |
| `services/performanceService.js` | 性能监控服务 - 导航/绘制/资源/内存/API 五维度采集 + 瓶颈分析 |
| `api/api.js` | API 封装层 - 统一请求/响应拦截 + Token 管理 + 错误处理 |
| `api/progressApi.js` | 进度 API 接口定义 - TypeScript 风格接口文档 |
| `types/index.js` | 类型定义 - PersonnelType/EquipmentType/SafetyType 等 + 运行时验证 |

---

## v1.0 - 项目初始化 (2026-04-03)

### 📋 项目基础搭建

#### 后端基础设施
| 文件 | 说明 |
|------|------|
| `server.js` | Express 服务器 - JWT 认证 + 20 个数据模块 + 文件上传 + 公网隧道支持 |
| `package.json` | 项目配置 - Vue 3 + Vite 5 + ECharts 6 + Element Plus + Express 4 |
| `.gitignore` | Git 忽略规则 - node_modules / dist / data / uploads |

#### 前端基础框架
| 文件 | 说明 |
|------|------|
| `index.html` | 入口 HTML - CDN 引入 Element Plus 图标集 |
| `src/main.js` | 应用入口 - Element Plus 全局注册 + SCSS 样式导入 |
| `src/App.vue` | 根组件 - 路由视图容器 + 登录守卫 |
| `src/router/index.js` | 路由配置 - 15 个页面路由 + Token 验证守卫 |
| `src/styles/index.scss` | 全局样式 - CSS 变量 + 液态玻璃效果 + 响应式适配 |

#### 数据定义
| 文件 | 说明 |
|------|------|
| `src/data/constructionNodes.js` | 施工节点数据模板 - A/B/C/D 四区块 × 5 阶段 × N 子任务 |
| `src/data/constructionSchedule.js` | 施工计划排期表 |

#### 工具脚本
| 文件 | 说明 |
|------|------|
| `start-public.bat` | 一键启动公网隧道 (localtunnel / Cloudflare Tunnel) |
| `vitest.config.js` | 单元测试配置 |
| `uploads/.gitkeep` | 上传目录占位符 |

### 🏗️ 技术选型
- **前端**: Vue 3 Composition API + `<script setup>` + Element Plus + ECharts 6
- **后端**: Express.js + JSON 文件存储（零数据库依赖）
- **构建**: Vite 5（开发热更新 + 生产优化）
- **认证**: bcryptjs 密码哈希 + JWT Token
- **样式**: SCSS + 液态玻璃拟态(Liquid Glass Morphism)设计语言
- **部署**: 局域网直连 + 公网隧道双模式

---

## 📊 项目统计

| 指标 | 数量 |
|------|------|
| 总提交数 | 25+ commits |
| Vue 组件 | 22 个 |
| 服务文件 | 3 个 |
| API 文件 | 2 个 |
| 数据定义 | 2 个 |
| 配置文件 | 6 个 |
| 总代码行数 | ~40,000+ 行 |
| 支持的功能模块 | 11 个 |
| 任务状态种类 | 8 种 |

---

## 🔮 即将推出

- [ ] 进度报表导出（PDF/Excel）
- [ ] 移动端自适应优化
- [ ] 多用户协作权限细化
- [ ] WebSocket 实时通知
- [ ] 数据备份与恢复功能
