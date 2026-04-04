<template>
  <el-card class="log-system-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">系统日志</span>
        <div class="filter-container">
          <el-input v-model="searchKeyword" placeholder="搜索日志" size="small" class="search-input" @input="handleSearch" />
          <el-select v-model="selectedLevel" placeholder="筛选级别" size="small" class="filter-select" @change="handleLevelChange">
            <el-option label="全部" value="" />
            <el-option label="info" value="info" />
            <el-option label="warning" value="warning" />
            <el-option label="error" value="error" />
            <el-option label="success" value="success" />
          </el-select>
          <el-button type="primary" size="small" @click="clearLogs" class="clear-button">
            <el-icon><Delete /></el-icon>
            清空日志
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="log-list">
      <el-empty v-if="paginatedLogs.length === 0" description="暂无日志" />
      <el-card 
        v-for="log in paginatedLogs" 
        :key="log.id"
        class="log-item"
        :class="log.level"
      >
        <div class="log-header">
          <div class="log-info">
            <div class="log-time">{{ log.time }}</div>
            <div class="log-id">ID: {{ log.id }}</div>
          </div>
          <el-tag :type="getTagType(log.level)" size="small">{{ log.level }}</el-tag>
        </div>
        <div class="log-content">{{ log.message }}</div>
        <div v-if="log.context" class="log-context">
          <div class="log-context-title">上下文信息:</div>
          <pre class="log-context-content">{{ JSON.stringify(log.context, null, 2) }}</pre>
        </div>
      </el-card>
    </div>
    
    <div class="pagination-container">
      <el-pagination
        v-if="total > 0"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const logList = ref([])
const selectedLevel = ref('')
const searchKeyword = ref('')
const filteredLogs = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const paginatedLogs = ref([])

const loadLogs = async () => {
  logList.value = await dataService.get('logs', [])
  updateFilteredLogs()
}

const clearLogs = async () => {
  await dataService.set('logs', [])
  logList.value = []
  updateFilteredLogs()
  ElMessage.success('日志已清空')
}

const updateFilteredLogs = () => {
  filteredLogs.value = logList.value.filter(log => {
    const levelMatch = !selectedLevel.value || log.level === selectedLevel.value
    const keywordMatch = !searchKeyword.value || 
      log.message.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      log.time.toLowerCase().includes(searchKeyword.value.toLowerCase())
    return levelMatch && keywordMatch
  })
  updatePagination()
}

const handleLevelChange = () => {
  updateFilteredLogs()
}

const handleSearch = () => {
  currentPage.value = 1
  updateFilteredLogs()
}

const updatePagination = () => {
  total.value = filteredLogs.value.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  paginatedLogs.value = filteredLogs.value.slice(start, end)
}

const handlePageChange = (page) => {
  currentPage.value = page
  updatePagination()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  updatePagination()
}

const getTagType = (level) => {
  const typeMap = {
    'info': 'info',
    'warning': 'warning',
    'error': 'danger',
    'success': 'success'
  }
  return typeMap[level] || 'info'
}

onMounted(async () => {
  await loadLogs()
  
  dataService.subscribe('logs', (data) => {
    if (data) {
      logList.value = data
      updateFilteredLogs()
    }
  })
})
</script>

<style scoped>
.log-system-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(102, 0, 153, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.15);
  backdrop-filter: blur(20px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  letter-spacing: 0.5px;
}

.filter-container {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

.clear-button {
  background: linear-gradient(135deg, #F56C6C, #E64242) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3) !important;
}

.clear-button:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(245, 108, 108, 0.4) !important;
  background: linear-gradient(135deg, #E64242, #D93030) !important;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.log-item {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(102, 0, 153, 0.1);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 0, 153, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.log-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.15);
  border-color: rgba(102, 0, 153, 0.2);
}

.log-item.info {
  border-left: 4px solid #409EFF;
}

.log-item.warning {
  border-left: 4px solid #E6A23C;
}

.log-item.error {
  border-left: 4px solid #F56C6C;
}

.log-item.success {
  border-left: 4px solid #67C23A;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.log-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-time {
  font-size: 13px;
  color: #86909C;
}

.log-id {
  font-size: 11px;
  color: #C9CDD4;
}

.log-content {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #4E5969;
}

.log-context {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(102, 0, 153, 0.08);
}

.log-context-title {
  font-size: 12px;
  color: #660099;
  margin-bottom: 4px;
  font-weight: 600;
}

.log-context-content {
  font-size: 11px;
  color: #86909C;
  background: rgba(102, 0, 153, 0.05);
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
}

.log-context-content::-webkit-scrollbar {
  height: 4px;
}

.log-context-content::-webkit-scrollbar-track {
  background: rgba(102, 0, 153, 0.05);
  border-radius: 2px;
}

.log-context-content::-webkit-scrollbar-thumb {
  background: rgba(102, 0, 153, 0.3);
  border-radius: 2px;
}

.log-context-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 0, 153, 0.5);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pagination {
  --el-pagination-fill-color: rgba(255, 255, 255, 0.9);
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.85);
  --el-pagination-button-border-color: rgba(102, 0, 153, 0.2);
  --el-pagination-button-color: #4E5969;
  --el-pagination-current-bg-color: #660099;
  --el-pagination-current-color: #FFFFFF;
  --el-pagination-button-hover-bg-color: rgba(102, 0, 153, 0.1);
  --el-pagination-button-hover-color: #660099;
  --el-pagination-button-hover-border-color: rgba(102, 0, 153, 0.3);
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .filter-container {
    width: 100%;
    justify-content: flex-start;
  }
  
  .search-input,
  .filter-select {
    flex: 1;
    min-width: 0;
  }
  
  .clear-button {
    width: 100%;
  }
  
  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>