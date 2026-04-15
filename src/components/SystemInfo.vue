<template>
  <el-card v-if="isAdmin" class="system-info-card">
    <template #header>
      <div class="card-header">
        <span>系统信息</span>
        <div class="header-buttons">
          <el-button 
            type="primary" 
            size="small" 
            @click="syncData"
            :loading="syncing"
            class="sync-button"
          >
            <el-icon><Refresh /></el-icon>
            同步数据
          </el-button>
          <el-dropdown>
            <el-button 
              type="info" 
              size="small" 
              class="export-button"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportAsJSON">导出为 JSON</el-dropdown-item>
                <el-dropdown-item @click="exportAsCSV">导出为 CSV</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button 
            type="success" 
            size="small" 
            @click="shareSystemInfo"
            class="share-button"
          >
            <el-icon><Share /></el-icon>
            分享
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="system-info-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="info-card">
            <template #header>
              <span class="info-card-title">系统状态</span>
            </template>
            <div class="info-item">
              <span class="info-label">系统版本：</span>
              <span class="info-value">{{ systemInfo.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前时间：</span>
              <span class="info-value">{{ systemInfo.currentTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行时间：</span>
              <span class="info-value">{{ systemInfo.uptime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">浏览器：</span>
              <span class="info-value">{{ systemInfo.browser }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="info-card">
            <template #header>
              <span class="info-card-title">设备信息</span>
            </template>
            <div class="info-item">
              <span class="info-label">屏幕分辨率：</span>
              <span class="info-value">{{ systemInfo.screenResolution }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">视口大小：</span>
              <span class="info-value">{{ systemInfo.viewportSize }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">操作系统：</span>
              <span class="info-value">{{ systemInfo.os }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设备类型：</span>
              <span class="info-value">{{ systemInfo.deviceType }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="info-card">
            <template #header>
              <span class="info-card-title">网络状态</span>
            </template>
            <div class="info-item">
              <span class="info-label">网络连接：</span>
              <span class="info-value">
                <el-tag :type="systemInfo.networkOnline ? 'success' : 'danger'">
                  {{ systemInfo.networkOnline ? '在线' : '离线' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">网络类型：</span>
              <span class="info-value">{{ systemInfo.networkType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">网络延迟：</span>
              <span class="info-value">{{ systemInfo.networkLatency }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">网络速度：</span>
              <span class="info-value">{{ systemInfo.networkSpeed }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">IP地址：</span>
              <span class="info-value">{{ systemInfo.ipAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用户代理：</span>
              <span class="info-value">{{ systemInfo.userAgent }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="info-card">
            <template #header>
              <span class="info-card-title">系统健康状态</span>
            </template>
            <div class="info-item">
              <span class="info-label">健康状态：</span>
              <span class="info-value">
                <el-tag :type="systemInfo.healthStatus.type">
                  {{ systemInfo.healthStatus.status }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">健康评分：</span>
              <span class="info-value">
                <el-progress 
                  :percentage="systemInfo.healthScore" 
                  :color="getHealthColor(systemInfo.healthScore)" 
                  :stroke-width="10"
                  :show-text="false"
                />
                <span class="progress-text">{{ systemInfo.healthScore }}/100</span>
              </span>
            </div>
            <div class="info-item" v-if="systemInfo.alerts.length > 0">
              <span class="info-label">预警信息：</span>
              <span class="info-value">
                <div class="alerts-container">
                  <el-tag 
                    v-for="(alert, index) in systemInfo.alerts" 
                    :key="index"
                    :type="alert.type"
                    size="small"
                    class="alert-tag"
                  >
                    {{ alert.message }}
                  </el-tag>
                </div>
              </span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="info-card">
            <template #header>
              <span class="info-card-title">数据同步状态</span>
            </template>
            <div class="info-item">
              <span class="info-label">同步状态：</span>
              <span class="info-value">
                <el-tag :type="systemInfo.syncStatus.type">
                  {{ systemInfo.syncStatus.status }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">最后同步时间：</span>
              <span class="info-value">{{ systemInfo.lastSyncTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据模块状态：</span>
              <span class="info-value">
                <div class="sync-status-container">
                  <el-tag 
                    v-for="(module, index) in systemInfo.moduleStatus" 
                    :key="index"
                    :type="module.status === '正常' ? 'success' : 'warning'"
                    size="small"
                    class="module-tag"
                  >
                    {{ module.name }}: {{ module.status }}
                  </el-tag>
                </div>
              </span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Share } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

const serverStartTime = ref(Date.now())
const currentTime = ref(new Date())
const networkOnline = ref(navigator.onLine)
const ipAddress = ref('获取中...')
const networkLatency = ref('测试中...')
const networkType = ref('获取中...')
const networkSpeed = ref('测试中...')

const healthScore = ref(0)
const healthStatus = ref({ status: '检测中...', type: 'info' })
const alerts = ref([])

const syncing = ref(false)
const syncStatus = ref({ status: '未同步', type: 'info' })
const lastSyncTime = ref('从未')
const moduleStatus = ref([
  { name: '人员管理', status: '正常' },
  { name: '设备管理', status: '正常' },
  { name: '安全检查', status: '正常' },
  { name: '进度管理', status: '正常' },
  { name: '材料管理', status: '正常' },
  { name: '用户管理', status: '正常' }
])

let subscriptions = []

const systemInfo = computed(() => {
  const uptimeMs = Date.now() - serverStartTime.value
  const uptimeSeconds = Math.floor(uptimeMs / 1000)
  const uptimeMinutes = Math.floor(uptimeSeconds / 60)
  const uptimeHours = Math.floor(uptimeMinutes / 60)
  const remainingMinutes = uptimeMinutes % 60
  const remainingSeconds = uptimeSeconds % 60
  const remainingMs = uptimeMs % 1000
  const formattedMs = String(remainingMs).padStart(3, '0')
  const uptime = `${uptimeHours}小时${remainingMinutes}分${remainingSeconds}秒${formattedMs}毫秒`
  
  const browserInfo = getBrowserInfo()
  const screenResolution = `${window.screen.width} x ${window.screen.height}`
  const viewportSize = `${window.innerWidth} x ${window.innerHeight}`
  const os = getOSInfo()
  const deviceType = getDeviceType()
  
  return {
    version: '1.0.0',
    currentTime: currentTime.value.toLocaleString('zh-CN'),
    uptime,
    browser: browserInfo,
    screenResolution,
    viewportSize,
    os,
    deviceType,
    networkOnline: networkOnline.value,
    networkType: networkType.value,
    networkLatency: networkLatency.value,
    networkSpeed: networkSpeed.value,
    ipAddress: ipAddress.value,
    userAgent: navigator.userAgent,
    healthScore: healthScore.value,
    healthStatus: healthStatus.value,
    alerts: alerts.value,
    syncStatus: syncStatus.value,
    lastSyncTime: lastSyncTime.value,
    moduleStatus: moduleStatus.value
  }
})

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent
  let browser = '未知浏览器'
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
    browser = 'Internet Explorer'
  }
  
  return browser
}

const getOSInfo = () => {
  const userAgent = navigator.userAgent
  let os = '未知操作系统'
  
  if (userAgent.includes('Windows')) {
    os = 'Windows'
  } else if (userAgent.includes('Macintosh')) {
    os = 'MacOS'
  } else if (userAgent.includes('Linux')) {
    os = 'Linux'
  } else if (userAgent.includes('Android')) {
    os = 'Android'
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
  }
  
  return os
}

const getDeviceType = () => {
  const width = window.innerWidth
  if (width < 768) {
    return '移动设备'
  } else if (width < 1024) {
    return '平板设备'
  } else {
    return '桌面设备'
  }
}

const getIPAddress = async () => {
  try {
    const response = await fetch('/api/system/info')
    if (response.ok) {
      const data = await response.json()
      const req = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
      if (req.ok) {
        const ipData = await req.json()
        ipAddress.value = `${ipData.ip} (内网)`
      } else {
        ipAddress.value = '局域网模式'
      }
    }
  } catch (error) {
    ipAddress.value = '局域网模式'
  }
}

const testNetworkLatency = async () => {
  try {
    const start = performance.now()
    const response = await fetch('/api/system/info')
    const end = performance.now()

    if (response.ok) {
      const latency = Math.round(end - start)
      networkLatency.value = `${latency}ms`
    } else {
      networkLatency.value = '测试失败'
    }
  } catch (error) {
    networkLatency.value = '无法连接服务器'
  }
}

const getServerSystemInfo = async () => {
  try {
    const response = await fetch('http://192.168.8.174:3001/api/system/info')
    if (response.ok) {
      const data = await response.json()
      serverStartTime.value = new Date(data.startTime).getTime()
    }
  } catch (error) {
    console.error('Error getting server system info:', error)
  }
}

const handleNetworkChange = () => {
  networkOnline.value = navigator.onLine
  getNetworkType()
  testNetworkSpeed()
}

const getNetworkType = () => {
  if (navigator.connection) {
    const connection = navigator.connection
    networkType.value = connection.type || '未知'
  } else {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Wi-Fi') || userAgent.includes('WiFi')) {
      networkType.value = 'WiFi'
    } else if (userAgent.includes('4G') || userAgent.includes('LTE')) {
      networkType.value = '4G'
    } else if (userAgent.includes('3G')) {
      networkType.value = '3G'
    } else if (userAgent.includes('2G')) {
      networkType.value = '2G'
    } else {
      networkType.value = '未知'
    }
  }
}

const testNetworkSpeed = () => {
  const startTime = performance.now()
  fetch('/api/system/info').then(() => {
    const endTime = performance.now()
    const duration = endTime - startTime
    networkSpeed.value = `本地响应 ${Math.round(duration)}ms`
  }).catch(() => {
    networkSpeed.value = '无法连接服务器'
  })
}

const getHealthColor = (score) => {
  if (score > 80) return '#67c23a'
  if (score > 50) return '#e6a23c'
  return '#f56c6c'
}

const assessHealthStatus = () => {
  let score = 100
  const newAlerts = []
  
  if (!networkOnline.value) {
    score -= 40
    newAlerts.push({ message: '网络连接中断', type: 'danger' })
  } else {
    const latencyMatch = networkLatency.value.match(/(\d+)ms/)
    if (latencyMatch) {
      const latency = parseInt(latencyMatch[1])
      if (latency > 500) {
        score -= 15
        newAlerts.push({ message: '网络延迟过高', type: 'warning' })
      } else if (latency > 200) {
        score -= 5
      }
    }
  }
  
  score = Math.max(0, Math.min(100, score))
  
  healthScore.value = score
  
  if (score > 80) {
    healthStatus.value = { status: '良好', type: 'success' }
  } else if (score > 50) {
    healthStatus.value = { status: '一般', type: 'warning' }
  } else {
    healthStatus.value = { status: '较差', type: 'danger' }
  }
  
  alerts.value = newAlerts
}

const generateAlerts = () => {
  assessHealthStatus()
}

const syncData = async () => {
  syncing.value = true
  syncStatus.value = { status: '同步中', type: 'info' }
  
  try {
    const modules = [
      { key: 'personnel', name: '人员管理' },
      { key: 'equipment', name: '设备管理' },
      { key: 'safety', name: '安全检查' },
      { key: 'progress', name: '进度管理' },
      { key: 'materials', name: '材料管理' },
      { key: 'users', name: '用户管理' }
    ]
    
    let successCount = 0
    
    for (const module of modules) {
      try {
        const data = await dataService.get(module.key, [])
        if (dataService.validateData(module.key, data)) {
          successCount++
          const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
          if (moduleIndex !== -1) {
            moduleStatus.value[moduleIndex].status = '正常'
          }
        } else {
          const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
          if (moduleIndex !== -1) {
            moduleStatus.value[moduleIndex].status = '数据格式错误'
          }
        }
      } catch (error) {
        console.error(`Error syncing ${module.name}:`, error)
        const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
        if (moduleIndex !== -1) {
          moduleStatus.value[moduleIndex].status = '同步失败'
        }
      }
    }
    
    if (successCount === modules.length) {
      syncStatus.value = { status: '同步成功', type: 'success' }
      ElMessage.success('数据同步成功')
    } else if (successCount > 0) {
      syncStatus.value = { status: '部分同步成功', type: 'warning' }
      ElMessage.warning('部分数据同步成功')
    } else {
      syncStatus.value = { status: '同步失败', type: 'danger' }
      ElMessage.error('数据同步失败')
    }
    
    lastSyncTime.value = new Date().toLocaleString('zh-CN')
    
    await dataService.addLog('info', `数据同步完成，成功：${successCount}，失败：${modules.length - successCount}`)
    
  } catch (error) {
    console.error('Error syncing data:', error)
    syncStatus.value = { status: '同步失败', type: 'danger' }
    ElMessage.error('数据同步失败')
  } finally {
    syncing.value = false
  }
}

const subscribeToModules = () => {
  const modules = ['personnel', 'equipment', 'safety', 'progress', 'materials', 'users']
  
  modules.forEach(module => {
    const unsubscribe = dataService.subscribe(module, (data) => {
      console.log(`${module} data updated:`, data)
      assessHealthStatus()
    })
    subscriptions.push(unsubscribe)
  })
}

const validateModuleStatus = async () => {
  const modules = [
    { key: 'personnel', name: '人员管理' },
    { key: 'equipment', name: '设备管理' },
    { key: 'safety', name: '安全检查' },
    { key: 'progress', name: '进度管理' },
    { key: 'materials', name: '材料管理' },
    { key: 'users', name: '用户管理' }
  ]
  
  for (const module of modules) {
    try {
      const data = await dataService.get(module.key, [])
      if (dataService.validateData(module.key, data)) {
        const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
        if (moduleIndex !== -1) {
          moduleStatus.value[moduleIndex].status = '正常'
        }
      } else {
        const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
        if (moduleIndex !== -1) {
          moduleStatus.value[moduleIndex].status = '数据格式错误'
        }
      }
    } catch (error) {
      console.error(`Error validating ${module.name}:`, error)
      const moduleIndex = moduleStatus.value.findIndex(m => m.name === module.name)
      if (moduleIndex !== -1) {
        moduleStatus.value[moduleIndex].status = '验证失败'
      }
    }
  }
}

let timeInterval = null
let performanceInterval = null

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1)
  
  assessHealthStatus()
  
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
  
  getServerSystemInfo()
  setInterval(getServerSystemInfo, 60000)
  
  getIPAddress()
  testNetworkLatency()
  setInterval(testNetworkLatency, 30000)
  
  getNetworkType()
  testNetworkSpeed()
  setInterval(testNetworkSpeed, 60000)
  
  setInterval(assessHealthStatus, 5000)
  
  subscribeToModules()
  validateModuleStatus()
  setInterval(validateModuleStatus, 30000)
  
  setTimeout(() => {
    syncData()
  }, 2000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  
  window.removeEventListener('online', handleNetworkChange)
  window.removeEventListener('offline', handleNetworkChange)
  
  subscriptions.forEach(unsubscribe => unsubscribe())
  subscriptions = []
})

const exportAsJSON = () => {
  try {
    const exportData = {
      systemInfo: systemInfo.value,
      exportTime: new Date().toLocaleString('zh-CN'),
      version: '1.0.0'
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-info-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('系统信息已导出为JSON文件')
    dataService.addLog('info', '系统信息导出为JSON文件')
  } catch (error) {
    console.error('Error exporting JSON:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const exportAsCSV = () => {
  try {
    const headers = [
      '类别', '项目', '值'
    ]
    
    const rows = []
    
    rows.push(['系统状态', '系统版本', systemInfo.value.version])
    rows.push(['系统状态', '当前时间', systemInfo.value.currentTime])
    rows.push(['系统状态', '运行时间', systemInfo.value.uptime])
    rows.push(['系统状态', '浏览器', systemInfo.value.browser])
    
    rows.push(['设备信息', '屏幕分辨率', systemInfo.value.screenResolution])
    rows.push(['设备信息', '视口大小', systemInfo.value.viewportSize])
    rows.push(['设备信息', '操作系统', systemInfo.value.os])
    rows.push(['设备信息', '设备类型', systemInfo.value.deviceType])
    
    rows.push(['网络状态', '网络连接', systemInfo.value.networkOnline ? '在线' : '离线'])
    rows.push(['网络状态', '网络类型', systemInfo.value.networkType])
    rows.push(['网络状态', '网络延迟', systemInfo.value.networkLatency])
    rows.push(['网络状态', '网络速度', systemInfo.value.networkSpeed])
    rows.push(['网络状态', 'IP地址', systemInfo.value.ipAddress])
    
    rows.push(['健康状态', '健康评分', `${systemInfo.value.healthScore}/100`])
    rows.push(['健康状态', '健康状态', systemInfo.value.healthStatus.status])
    
    rows.push(['数据同步', '同步状态', systemInfo.value.syncStatus.status])
    rows.push(['数据同步', '最后同步时间', systemInfo.value.lastSyncTime])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-info-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('系统信息已导出为CSV文件')
    dataService.addLog('info', '系统信息导出为CSV文件')
  } catch (error) {
    console.error('Error exporting CSV:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const shareSystemInfo = () => {
  try {
    const shareContent = `系统信息\n` +
      `系统版本: ${systemInfo.value.version}\n` +
      `当前时间: ${systemInfo.value.currentTime}\n` +
      `运行时间: ${systemInfo.value.uptime}\n` +
      `健康评分: ${systemInfo.value.healthScore}/100\n` +
      `健康状态: ${systemInfo.value.healthStatus.status}\n` +
      `网络状态: ${systemInfo.value.networkOnline ? '在线' : '离线'}\n` +
      `网络延迟: ${systemInfo.value.networkLatency}\n` +
      `最后同步时间: ${systemInfo.value.lastSyncTime}`
    
    if (navigator.share) {
      navigator.share({
        title: '系统信息',
        text: shareContent
      }).then(() => {
        ElMessage.success('分享成功')
        dataService.addLog('info', '系统信息分享成功')
      }).catch((error) => {
        console.error('Error sharing:', error)
        copyToClipboard(shareContent)
      })
    } else {
      copyToClipboard(shareContent)
    }
  } catch (error) {
    console.error('Error sharing:', error)
    ElMessage.error('分享失败，请重试')
  }
}

const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('系统信息已复制到剪贴板')
      dataService.addLog('info', '系统信息复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('系统信息已复制到剪贴板')
      dataService.addLog('info', '系统信息复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败，请手动复制')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}
</script>

<style scoped>
.system-info-card {
  margin-top: 0;
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

.card-header span {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  letter-spacing: 0.5px;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.sync-button {
  background: linear-gradient(135deg, #660099, #8B5CF6) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.3) !important;
}

.sync-button:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(102, 0, 153, 0.4) !important;
  background: linear-gradient(135deg, #550080, #7C3AED) !important;
}

.export-button {
  background: linear-gradient(135deg, #6B7280, #4B5563) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3) !important;
}

.export-button:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4) !important;
  background: linear-gradient(135deg, #4B5563, #374151) !important;
}

.share-button {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
}

.share-button:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
  background: linear-gradient(135deg, #059669, #047857) !important;
}

.system-info-content {
  margin-top: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(102, 0, 153, 0.1);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 0, 153, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.15);
  border-color: rgba(102, 0, 153, 0.2);
}

.info-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(102, 0, 153, 0.08);
  transition: all 0.2s ease;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item:hover {
  background: rgba(102, 0, 153, 0.03);
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 6px;
}

.info-label {
  font-size: 14px;
  color: #4E5969;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #1D2129;
  font-weight: 500;
  word-break: break-all;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #1D2129;
  min-width: 60px;
  text-align: right;
}

.alerts-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
}

.alert-tag {
  font-size: 12px;
}

.sync-status-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
}

.module-tag {
  font-size: 12px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-buttons {
    width: 100%;
    justify-content: flex-start;
  }
  
  .sync-button,
  .export-button,
  .share-button {
    font-size: 12px !important;
    padding: 6px 12px !important;
  }
}
</style>
