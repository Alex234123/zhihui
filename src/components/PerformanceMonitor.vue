<template>
  <el-card class="performance-card">
    <template #header>
      <div class="card-header">
        <span>性能监控</span>
        <el-button
          type="primary"
          size="small"
          @click="exportReport"
        >
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </template>
    
    <div class="performance-content">
      <!-- 导航性能 -->
      <el-collapse>
        <el-collapse-item title="导航性能">
          <el-table :data="navigationData" stripe style="width: 100%">
            <el-table-column prop="metric" label="指标" width="180" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </el-collapse-item>
        
        <!-- 绘制性能 -->
        <el-collapse-item title="绘制性能">
          <el-table :data="paintData" stripe style="width: 100%">
            <el-table-column prop="metric" label="指标" width="180" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </el-collapse-item>
        
        <!-- 资源加载 -->
        <el-collapse-item title="资源加载">
          <el-table :data="resourceData" stripe style="width: 100%">
            <el-table-column prop="name" label="资源" width="300" />
            <el-table-column prop="duration" label="加载时间(ms)" width="150" />
            <el-table-column prop="initiatorType" label="类型" width="100" />
          </el-table>
        </el-collapse-item>
        
        <!-- API请求 -->
        <el-collapse-item title="API请求">
          <el-table :data="apiData" stripe style="width: 100%">
            <el-table-column prop="url" label="URL" width="300" />
            <el-table-column prop="method" label="方法" width="100" />
            <el-table-column prop="duration" label="响应时间(ms)" width="150" />
            <el-table-column prop="status" label="状态" width="100" />
          </el-table>
        </el-collapse-item>
        
        <!-- 内存使用 -->
        <el-collapse-item title="内存使用">
          <el-table :data="memoryData" stripe style="width: 100%">
            <el-table-column prop="metric" label="指标" width="180" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </el-collapse-item>
        
        <!-- 性能瓶颈 -->
        <el-collapse-item title="性能瓶颈">
          <div v-if="bottlenecks.length === 0" class="no-bottlenecks">
            <el-empty description="未发现明显性能瓶颈" />
          </div>
          <el-table v-else :data="bottlenecks" stripe style="width: 100%">
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="metric" label="指标" />
            <el-table-column prop="value" label="值" width="150" />
            <el-table-column prop="severity" label="严重程度" width="120">
              <template #default="{ row }">
                <el-tag :type="row.severity === 'high' ? 'danger' : 'warning'">
                  {{ row.severity === 'high' ? '高' : '中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="recommendation" label="建议" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import performanceService from '../services/performanceService'

const metrics = ref(null)
const bottlenecks = ref([])

// 计算导航性能数据
const navigationData = computed(() => {
  if (!metrics.value?.navigation) return []
  const nav = metrics.value.navigation
  return [
    { metric: '页面加载时间', value: `${(nav.loadEventEnd - nav.fetchStart).toFixed(2)}ms` },
    { metric: 'DOM加载时间', value: `${(nav.domContentLoadedEventEnd - nav.fetchStart).toFixed(2)}ms` },
    { metric: '首字节时间', value: `${(nav.responseStart - nav.fetchStart).toFixed(2)}ms` },
    { metric: '重定向时间', value: `${(nav.redirectEnd - nav.redirectStart).toFixed(2)}ms` },
    { metric: 'DNS解析时间', value: `${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(2)}ms` },
    { metric: 'TCP连接时间', value: `${(nav.connectEnd - nav.connectStart).toFixed(2)}ms` },
    { metric: '请求时间', value: `${(nav.responseEnd - nav.requestStart).toFixed(2)}ms` },
    { metric: 'DOM处理时间', value: `${(nav.domContentLoadedEventEnd - nav.responseEnd).toFixed(2)}ms` },
    { metric: '页面渲染时间', value: `${(nav.loadEventEnd - nav.domContentLoadedEventEnd).toFixed(2)}ms` },
  ]
})

// 计算绘制性能数据
const paintData = computed(() => {
  if (!metrics.value?.paint) return []
  return metrics.value.paint.map(entry => ({
    metric: entry.name === 'first-paint' ? '首次绘制(FP)' : '首次内容绘制(FCP)',
    value: `${entry.startTime.toFixed(2)}ms`,
  }))
})

// 计算资源加载数据
const resourceData = computed(() => {
  if (!metrics.value?.resources) return []
  return metrics.value.resources
    .filter(resource => resource.duration > 0)
    .map(resource => ({
      name: resource.name,
      duration: resource.duration.toFixed(2),
      initiatorType: resource.initiatorType,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10) // 只显示前10个慢资源
})

// 计算API请求数据
const apiData = computed(() => {
  if (!metrics.value?.apiRequests) return []
  return metrics.value.apiRequests
    .map(request => ({
      url: request.url,
      method: request.method,
      duration: request.duration.toFixed(2),
      status: request.status,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10) // 只显示前10个慢请求
})

// 计算内存使用数据
const memoryData = computed(() => {
  if (!metrics.value?.memory) return []
  const mem = metrics.value.memory
  return [
    { metric: '已使用内存', value: `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` },
    { metric: '总内存', value: `${(mem.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB` },
    { metric: '内存使用率', value: `${((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100).toFixed(2)}%` },
    { metric: '内存限制', value: mem.jsHeapSizeLimit ? `${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB` : 'N/A' },
  ]
})

// 导出性能报告
const exportReport = () => {
  const report = performanceService.exportReport()
  const blob = new Blob([report], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 加载性能数据
const loadMetrics = () => {
  metrics.value = performanceService.getMetrics()
  bottlenecks.value = performanceService.analyzeBottlenecks()
}

onMounted(() => {
  loadMetrics()
  // 每秒更新一次性能数据
  setInterval(loadMetrics, 1000)
})
</script>

<style scoped>
.performance-card {
  margin-top: var(--light-spacing-lg);
  animation: lightFadeInUp var(--light-transition-slow) var(--light-easing);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.performance-content {
  margin-top: var(--light-spacing-md);
}

.no-bottlenecks {
  padding: var(--light-spacing-lg);
  text-align: center;
}

/* 表格样式 */
.el-table {
  margin-top: var(--light-spacing-sm);
  border-radius: var(--light-radius-md);
  overflow: hidden;
}

.el-table th {
  background-color: var(--light-bg-secondary);
  font-weight: 600;
  color: var(--light-text-primary);
}

.el-table td {
  color: var(--light-text-secondary);
}

.el-table__row:hover {
  background-color: var(--light-bg-hover) !important;
}

/* 折叠面板样式 */
.el-collapse {
  border-radius: var(--light-radius-md);
  overflow: hidden;
}

.el-collapse-item {
  border-radius: var(--light-radius-md);
  overflow: hidden;
  margin-bottom: var(--light-spacing-sm);
}

.el-collapse-item__header {
  background-color: var(--light-bg-secondary);
  border-radius: var(--light-radius-md);
  font-weight: 600;
  color: var(--light-text-primary);
}

.el-collapse-item__content {
  border-radius: 0 0 var(--light-radius-md) var(--light-radius-md);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--light-spacing-sm);
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