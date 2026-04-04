<template>
  <el-card class="error-handler-card">
    <template #header>
      <div class="card-header">
        <span>错误处理与日志</span>
        <div class="header-actions">
          <el-button
            type="primary"
            size="small"
            @click="exportLogs"
          >
            <el-icon><Download /></el-icon>
            导出日志
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="clearLogs"
          >
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="error-handler-content">
      <!-- 错误统计 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card error">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ errorCount }}</div>
                <div class="stat-label">错误数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warn">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ warnCount }}</div>
                <div class="stat-label">警告数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card info">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Search /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ infoCount }}</div>
                <div class="stat-label">信息数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card total">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalCount }}</div>
                <div class="stat-label">总日志数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 日志过滤器 -->
      <div class="filter-container">
        <el-select v-model="logLevel" placeholder="选择日志级别" style="width: 120px; margin-right: 10px;">
          <el-option label="全部" value="" />
          <el-option label="错误" value="error" />
          <el-option label="警告" value="warn" />
          <el-option label="信息" value="info" />
          <el-option label="调试" value="debug" />
          <el-option label="跟踪" value="trace" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索日志" style="width: 200px;" />
      </div>
      
      <!-- 日志列表 -->
      <el-table :data="filteredLogs" stripe style="width: 100%; margin-top: 20px;">
        <el-table-column prop="timestamp" label="时间" width="200" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" />
        <el-table-column prop="error" label="错误" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.error"
              type="text"
              size="small"
              @click="showErrorDetails(row.error)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 错误详情对话框 -->
      <el-dialog
        v-model="errorDialogVisible"
        title="错误详情"
        width="800px"
      >
        <div class="error-details">
          <el-form :model="currentError" label-width="100px">
            <el-form-item label="错误消息">
              <el-input
                v-model="currentError.message"
                type="textarea"
                :rows="3"
                readonly
              />
            </el-form-item>
            <el-form-item label="错误名称">
              <el-input v-model="currentError.name" readonly />
            </el-form-item>
            <el-form-item label="错误堆栈">
              <el-input
                v-model="currentError.stack"
                type="textarea"
                :rows="10"
                readonly
              />
            </el-form-item>
          </el-form>
        </div>
      </el-dialog>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Download, Delete, Warning, Bell, Search, Document } from '@element-plus/icons-vue'
import logger from '../services/loggerService'

const logs = ref([])
const logLevel = ref('')
const searchKeyword = ref('')
const errorDialogVisible = ref(false)
const currentError = ref({})

// 计算各种级别的日志数量
const errorCount = computed(() => logs.value.filter(log => log.level === 'error').length)
const warnCount = computed(() => logs.value.filter(log => log.level === 'warn').length)
const infoCount = computed(() => logs.value.filter(log => log.level === 'info').length)
const totalCount = computed(() => logs.value.length)

// 过滤日志
const filteredLogs = computed(() => {
  let result = logs.value
  
  // 按级别过滤
  if (logLevel.value) {
    result = result.filter(log => log.level === logLevel.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(log => 
      log.message.toLowerCase().includes(keyword) ||
      (log.error && log.error.message.toLowerCase().includes(keyword)) ||
      (log.context && JSON.stringify(log.context).toLowerCase().includes(keyword))
    )
  }
  
  // 按时间倒序排序
  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// 获取日志级别对应的标签类型
const getLevelType = (level) => {
  switch (level) {
    case 'error':
      return 'danger'
    case 'warn':
      return 'warning'
    case 'info':
      return 'info'
    case 'debug':
      return 'success'
    case 'trace':
      return 'primary'
    default:
      return ''
  }
}

// 显示错误详情
const showErrorDetails = (error) => {
  currentError.value = error
  errorDialogVisible.value = true
}

// 导出日志
const exportLogs = () => {
  logger.exportLogs()
}

// 清空日志
const clearLogs = () => {
  logger.clearLogs()
  logs.value = []
}

// 加载日志
const loadLogs = () => {
  logs.value = logger.loadLogs()
}

onMounted(() => {
  loadLogs()
  // 每5秒更新一次日志
  setInterval(loadLogs, 5000)
})
</script>

<style scoped>
.error-handler-card {
  margin-top: var(--light-spacing-lg);
  animation: lightFadeInUp var(--light-transition-slow) var(--light-easing);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: var(--light-spacing-sm);
}

.error-handler-content {
  margin-top: var(--light-spacing-md);
}

/* 统计卡片样式 */
.stat-card {
  margin-bottom: var(--light-spacing-sm);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--light-spacing-md);
  padding: var(--light-spacing-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--light-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: var(--light-shadow-sm);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--light-text-primary);
  margin-bottom: var(--light-spacing-xs);
}

.stat-label {
  font-size: 14px;
  color: var(--light-text-secondary);
  font-weight: 500;
}

/* 统计卡片颜色 */
.stat-card.error .stat-icon {
  background: var(--light-danger);
}

.stat-card.warn .stat-icon {
  background: var(--light-warning);
}

.stat-card.info .stat-icon {
  background: var(--light-info);
}

.stat-card.total .stat-icon {
  background: var(--light-secondary);
}

/* 过滤器容器 */
.filter-container {
  display: flex;
  align-items: center;
  margin-top: var(--light-spacing-md);
}

/* 错误详情样式 */
.error-details {
  max-height: 500px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--light-spacing-sm);
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: var(--light-spacing-sm);
  }
  
  .filter-container .el-select,
  .filter-container .el-input {
    width: 100%;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table th,
  .el-table td {
    padding: var(--light-spacing-xs) var(--light-spacing-sm);
  }
}
</style>