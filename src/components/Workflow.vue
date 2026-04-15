<template>
  <div class="workflow" @mousemove="handleMouseMove">
    <!-- Dynamic Sci-Fi Background -->
    <div class="workflow-bg">
      <div class="bg-grid"></div>
      <div class="bg-gradient"></div>
    </div>
    
    <!-- Mouse Follow Light Effect -->
    <div class="mouse-light" :style="{ left: mouseX + 'px', top: mouseY + 'px' }"></div>
    
    <!-- Futuristic Header -->
    <div class="workflow-header">
      <div class="header-left">
        <h2>工作流</h2>
        <div class="system-status">
          <div class="status-indicator">
            <span class="status-dot online"></span>
            <span class="status-text">系统正常运行</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Workflow Tabs -->
    <el-tabs class="workflow-tabs" v-model="activeTab">
      <el-tab-pane label="我的申请" name="my">
        <div class="workflow-list">
          <el-empty v-if="myApplications.length === 0" description="暂无申请" />
          <el-card 
            v-for="app in myApplications" 
            :key="app.id"
            class="workflow-card"
            :class="app.status"
          >
            <div class="workflow-header-card">
              <div class="workflow-title">{{ app.title }}</div>
              <el-tag :type="getStatusTagType(app.status)" size="small">{{ app.status }}</el-tag>
            </div>
            <div class="workflow-content">
              <div class="workflow-info">
                <div class="info-item">
                  <span class="info-label">申请类型：</span>
                  <span class="info-value">{{ app.type }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{ app.createdAt }}</span>
                </div>
                <div class="info-item" v-if="app.processedAt">
                  <span class="info-label">处理时间：</span>
                  <span class="info-value">{{ app.processedAt }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请内容：</span>
                  <span class="info-value">{{ app.content }}</span>
                </div>
                <div class="info-item" v-if="app.remark">
                  <span class="info-label">处理意见：</span>
                  <span class="info-value">{{ app.remark }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待处理" name="pending" v-if="isAdmin">
        <div class="workflow-list">
          <el-empty v-if="pendingApplications.length === 0" description="暂无待处理申请" />
          <el-card 
            v-for="app in pendingApplications" 
            :key="app.id"
            class="workflow-card"
            :class="app.status"
          >
            <div class="workflow-header-card">
              <div class="workflow-title">{{ app.title }}</div>
              <el-tag :type="getStatusTagType(app.status)" size="small">{{ app.status }}</el-tag>
            </div>
            <div class="workflow-content">
              <div class="workflow-info">
                <div class="info-item">
                  <span class="info-label">申请类型：</span>
                  <span class="info-value">{{ app.type }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请人：</span>
                  <span class="info-value">{{ app.applicant }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{ app.createdAt }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请内容：</span>
                  <span class="info-value">{{ app.content }}</span>
                </div>
              </div>
              <div class="workflow-actions">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="approveApplication(app)"
                  class="action-button approve"
                >
                  <el-icon><Check /></el-icon>
                  批准
                </el-button>
                <el-button 
                  type="danger" 
                  size="small"
                  @click="rejectApplication(app)"
                  class="action-button reject"
                >
                  <el-icon><Close /></el-icon>
                  拒绝
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
      <el-tab-pane label="所有申请" name="all" v-if="isAdmin">
        <div class="workflow-list">
          <el-empty v-if="allApplications.length === 0" description="暂无申请" />
          <el-card 
            v-for="app in allApplications" 
            :key="app.id"
            class="workflow-card"
            :class="app.status"
          >
            <div class="workflow-header-card">
              <div class="workflow-title">{{ app.title }}</div>
              <el-tag :type="getStatusTagType(app.status)" size="small">{{ app.status }}</el-tag>
            </div>
            <div class="workflow-content">
              <div class="workflow-info">
                <div class="info-item">
                  <span class="info-label">申请类型：</span>
                  <span class="info-value">{{ app.type }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请人：</span>
                  <span class="info-value">{{ app.applicant }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请时间：</span>
                  <span class="info-value">{{ app.createdAt }}</span>
                </div>
                <div class="info-item" v-if="app.processedAt">
                  <span class="info-label">处理时间：</span>
                  <span class="info-value">{{ app.processedAt }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">申请内容：</span>
                  <span class="info-value">{{ app.content }}</span>
                </div>
                <div class="info-item" v-if="app.remark">
                  <span class="info-label">处理意见：</span>
                  <span class="info-value">{{ app.remark }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
    

    
    <!-- Approve/Reject Dialog -->
    <el-dialog
      v-model="processDialogVisible"
      :title="currentApplication ? (isApproving ? '批准申请' : '拒绝申请') : ''"
      width="500px"
      class="futuristic-dialog"
    >
      <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="100px" class="futuristic-form">
        <el-form-item label="处理意见" prop="remark">
          <el-input
            v-model="processForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见"
            class="futuristic-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="futuristic-button secondary" @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" class="futuristic-button primary" @click="processApplication">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Operation } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const mouseX = ref(0)
const mouseY = ref(0)
const activeTab = ref('my')
const processDialogVisible = ref(false)
const processFormRef = ref(null)
const currentApplication = ref(null)
const isApproving = ref(false)

// 检查当前用户是否是管理员
const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

// 获取当前用户名
const currentUserName = computed(() => {
  return localStorage.getItem('zhihui_site_username') || '未知用户'
})

// 表单数据
const processForm = ref({
  remark: ''
})

// 表单验证规则
const processRules = {
  remark: [{ required: true, message: '请输入处理意见', trigger: 'blur' }]
}

// 工作流数据
const applications = ref([])

// 我的申请
const myApplications = computed(() => {
  return applications.value.filter(app => app.applicant === currentUserName.value)
})

// 待处理申请
const pendingApplications = computed(() => {
  return applications.value.filter(app => app.status === '待处理')
})

// 所有申请
const allApplications = computed(() => {
  return applications.value
})

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '待处理': 'warning',
    '已批准': 'success',
    '已拒绝': 'danger'
  }
  return typeMap[status] || 'info'
}

// 处理鼠标移动
const handleMouseMove = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

// 批准申请
const approveApplication = (app) => {
  currentApplication.value = app
  isApproving.value = true
  processForm.value = {
    remark: ''
  }
  processDialogVisible.value = true
}

// 拒绝申请
const rejectApplication = (app) => {
  currentApplication.value = app
  isApproving.value = false
  processForm.value = {
    remark: ''
  }
  processDialogVisible.value = true
}

// 处理申请
const processApplication = async () => {
  processFormRef.value.validate(async (valid) => {
    if (valid && currentApplication.value) {
      const updatedApplications = applications.value.map(app => {
        if (app.id === currentApplication.value.id) {
          return {
            ...app,
            status: isApproving.value ? '已批准' : '已拒绝',
            processedAt: new Date().toLocaleString('zh-CN'),
            remark: processForm.value.remark
          }
        }
        return app
      })
      
      await dataService.set('workflow', updatedApplications)
      applications.value = updatedApplications
      processDialogVisible.value = false
      ElMessage.success('申请处理成功')
    }
  })
}

// 加载工作流数据
const loadWorkflowData = async () => {
  applications.value = await dataService.get('workflow', [])
}

// 订阅数据变化
const subscribeToDataChanges = () => {
  dataService.subscribe('workflow', (data) => {
    if (data) {
      applications.value = data
    }
  })
}

onMounted(async () => {
  await loadWorkflowData()
  subscribeToDataChanges()
})
</script>

<style scoped>
/* Import Orbitron font */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');

.workflow {
  padding: 20px;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
}

/* Dynamic Sci-Fi Background */
.workflow-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 25s linear infinite;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 229, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(100, 255, 218, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(68, 138, 255, 0.05) 0%, transparent 50%);
  animation: gradientShift 20s ease-in-out infinite alternate;
}

/* Workflow content with z-index to ensure it's above background */
.workflow-header,
.workflow-tabs,
.el-card {
  position: relative;
  z-index: 1;
}

/* Mouse Follow Light Effect */
.mouse-light {
  position: fixed;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  transform: translate(-50%, -50%);
  transition: all 0.1s ease-out;
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.3);
  mix-blend-mode: soft-light;
}

/* Futuristic Header */
.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(25px);
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.1);
}

.header-left h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--future-primary);
  margin: 0 0 10px 0;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
  font-family: var(--future-font-family);
  letter-spacing: 1px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(35, 51, 70, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 229, 255, 0.1);
  transition: all 0.3s ease;
}

.status-indicator:hover {
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

.status-dot.online {
  background: var(--future-success);
  box-shadow: 0 0 10px rgba(105, 240, 174, 0.6);
}

.status-text {
  font-size: 0.875rem;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
}



/* Workflow Tabs */
.workflow-tabs {
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(25px);
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.workflow-tabs .el-tabs__header {
  background: rgba(35, 51, 70, 0.8);
  border-bottom: 1px solid rgba(0, 229, 255, 0.3);
}

.workflow-tabs .el-tabs__nav {
  margin: 0;
}

.workflow-tabs .el-tabs__item {
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
  transition: all 0.3s ease;
  padding: 15px 20px;
}

.workflow-tabs .el-tabs__item:hover {
  color: var(--future-primary);
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.workflow-tabs .el-tabs__item.is-active {
  color: var(--future-primary);
  font-weight: 600;
  border-bottom: 2px solid var(--future-primary);
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.workflow-tabs .el-tabs__content {
  padding: 20px;
}

/* Workflow List */
.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Workflow Card */
.workflow-card {
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(25px);
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 229, 255, 0.2);
  border-color: var(--future-primary);
}

.workflow-card.待处理 {
  border-left: 4px solid #E6A23C;
}

.workflow-card.已批准 {
  border-left: 4px solid #67C23A;
}

.workflow-card.已拒绝 {
  border-left: 4px solid #F56C6C;
}

.workflow-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
}

.workflow-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--future-text-primary);
  font-family: var(--future-font-family);
}

.workflow-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.workflow-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--future-text-secondary);
  min-width: 100px;
  font-family: var(--future-font-family-secondary);
}

.info-value {
  font-size: 0.875rem;
  color: var(--future-text-primary);
  flex: 1;
  font-family: var(--future-font-family-secondary);
  line-height: 1.4;
}

.workflow-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 229, 255, 0.2);
}

.action-button {
  transition: all 0.3s ease;
}

.action-button.approve:hover {
  background: rgba(105, 240, 174, 0.3);
  border-color: var(--future-success);
  box-shadow: 0 0 20px rgba(105, 240, 174, 0.5);
  transform: scale(1.05);
}

.action-button.reject:hover {
  background: rgba(245, 108, 108, 0.3);
  border-color: var(--future-danger);
  box-shadow: 0 0 20px rgba(245, 108, 108, 0.5);
  transform: scale(1.05);
}

/* Enhanced Futuristic Dialog Effects */
.futuristic-dialog {
  --el-dialog-bg-color: rgba(18, 26, 38, 0.95);
  --el-dialog-border-color: rgba(0, 229, 255, 0.3);
  --el-dialog-header-bg-color: rgba(35, 51, 70, 0.8);
  --el-dialog-title-color: var(--future-text-primary);
  border-radius: var(--future-radius-lg);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 229, 255, 0.2);
  overflow: hidden;
  animation: futurismSlideInUp var(--future-transition-normal) var(--future-easing), dialogGlow 3s ease-in-out infinite;
}

/* Enhanced Input Focus Effects */
.futuristic-input:focus {
  border-color: var(--future-primary);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  background: rgba(35, 51, 70, 0.9);
  animation: inputFocusGlow 2s ease-in-out infinite;
}

/* Animations */
@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes gradientShift {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(105, 240, 174, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(105, 240, 174, 0.8);
  }
}

@keyframes buttonHoverGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.7);
  }
}

@keyframes dialogGlow {
  0%, 100% {
    box-shadow: 0 20px 60px rgba(0, 229, 255, 0.2);
  }
  50% {
    box-shadow: 0 25px 70px rgba(0, 229, 255, 0.3);
  }
}

@keyframes inputFocusGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.7);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .workflow {
    padding: 10px;
  }
  
  .workflow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-left h2 {
    font-size: 1.2rem;
  }
  
  .workflow-tabs .el-tabs__item {
    padding: 10px 15px;
    font-size: 0.875rem;
  }
  
  .workflow-tabs .el-tabs__content {
    padding: 15px;
  }
  
  .workflow-header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .workflow-actions {
    flex-direction: column;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-label {
    min-width: auto;
  }
}
</style>