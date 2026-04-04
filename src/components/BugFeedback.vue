<template>
  <el-card class="bug-feedback-card">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <span>Bug反馈</span>
          <div class="system-status">
            <div class="status-indicator">
              <span class="status-dot online"></span>
              <span class="status-text">系统正常运行</span>
            </div>
          </div>
        </div>
        <el-button 
          type="primary" 
          size="small"
          @click="dialogVisible = true"
          class="create-button"
        >
          <el-icon><Plus /></el-icon>
          提交反馈
        </el-button>
      </div>
    </template>
    
    <div class="feedback-list">
      <el-empty v-if="feedbackList.length === 0" description="暂无反馈" />
      <el-card 
        v-for="item in feedbackList" 
        :key="item.id"
        class="feedback-item"
        :class="item.status"
      >
        <div class="feedback-header">
          <div class="feedback-title">{{ item.title }}</div>
          <div class="feedback-meta">
            <span class="feedback-user">{{ item.user }}</span>
            <span class="feedback-time">{{ item.time }}</span>
            <el-tag :type="getStatusTagType(item.status)" size="small">
              {{ item.status }}
            </el-tag>
          </div>
        </div>
        <div class="feedback-content">{{ item.content }}</div>
        <div class="feedback-actions" v-if="item.status !== '已解决'">
          <el-button 
            v-if="isAdmin"
            size="small" 
            type="success" 
            @click="markAsResolved(item.id)"
            class="action-button approve"
          >
            <el-icon><Check /></el-icon>
            标记为已解决
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteFeedback(item.id)"
            class="action-button reject"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </el-card>
    </div>
    
    <el-dialog
      v-model="dialogVisible"
      title="提交Bug反馈"
      width="500px"
      class="feedback-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入Bug标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述Bug情况"
          />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="form.severity" placeholder="请选择严重程度">
            <el-option label="轻微" value="轻微" />
            <el-option label="一般" value="一般" />
            <el-option label="严重" value="严重" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check, Delete } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const dialogVisible = ref(false)
const formRef = ref(null)
const feedbackList = ref([])

const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

const getStatusTagType = (status) => {
  const typeMap = {
    '待处理': 'warning',
    '已解决': 'success'
  }
  return typeMap[status] || 'info'
}

const form = ref({
  title: '',
  content: '',
  severity: '一般'
})

const rules = {
  title: [{ required: true, message: '请输入Bug标题', trigger: 'blur' }],
  content: [{ required: true, message: '请详细描述Bug情况', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }]
}

const loadFeedback = async () => {
  feedbackList.value = await dataService.get('feedback', [])
}

const submitFeedback = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      const newFeedback = {
        id: Date.now().toString(36),
        title: form.value.title,
        content: form.value.content,
        severity: form.value.severity,
        user: localStorage.getItem('zhihui_site_username') || '匿名用户',
        time: new Date().toLocaleString('zh-CN'),
        status: '待处理'
      }
      
      const updatedList = [...feedbackList.value, newFeedback]
      await dataService.set('feedback', updatedList)
      feedbackList.value = updatedList
      
      dialogVisible.value = false
      form.value = {
        title: '',
        content: '',
        severity: '一般'
      }
      ElMessage.success('反馈提交成功')
    }
  })
}

const markAsResolved = async (id) => {
  const updatedList = feedbackList.value.map(item => {
    if (item.id === id) {
      return { ...item, status: '已解决' }
    }
    return item
  })
  await dataService.set('feedback', updatedList)
  feedbackList.value = updatedList
  ElMessage.success('已标记为已解决')
}

const deleteFeedback = async (id) => {
  const updatedList = feedbackList.value.filter(item => item.id !== id)
  await dataService.set('feedback', updatedList)
  feedbackList.value = updatedList
  ElMessage.success('反馈已删除')
}

onMounted(async () => {
  await loadFeedback()
  
  dataService.subscribe('feedback', (data) => {
    if (data) {
      feedbackList.value = data
    }
  })
})
</script>

<style scoped>
.bug-feedback-card {
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

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-left span {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  letter-spacing: 0.5px;
}

.system-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
}

.status-dot.online {
  background: #10B981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
}

@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
  }
}

.status-text {
  font-size: 13px;
  color: #10B981;
  font-weight: 500;
}

.create-button {
  background: linear-gradient(135deg, #660099, #8B5CF6) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.3) !important;
}

.create-button:hover {
  transform: translateY(-2px) scale(1.02) !important;
  box-shadow: 0 6px 16px rgba(102, 0, 153, 0.4) !important;
  background: linear-gradient(135deg, #550080, #7C3AED) !important;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.feedback-item {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(102, 0, 153, 0.1);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 0, 153, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.feedback-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.15);
  border-color: rgba(102, 0, 153, 0.2);
}

.feedback-item.已解决 {
  border-left: 4px solid #67C23A;
  opacity: 0.9;
}

.feedback-item.待处理 {
  border-left: 4px solid #E6A23C;
}

.feedback-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(102, 0, 153, 0.08);
}

.feedback-title {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 8px;
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #86909C;
  flex-wrap: wrap;
}

.feedback-content {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #4E5969;
}

.feedback-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid rgba(102, 0, 153, 0.08);
}

.action-button.approve {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  border: none !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.action-button.approve:hover {
  transform: translateY(-1px) scale(1.02) !important;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3) !important;
}

.action-button.reject {
  background: linear-gradient(135deg, #F56C6C, #E64242) !important;
  border: none !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.action-button.reject:hover {
  transform: translateY(-1px) scale(1.02) !important;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.3) !important;
}

.feedback-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.98);
  --el-dialog-border-color: rgba(102, 0, 153, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.2);
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-left span {
    font-size: 16px;
  }
  
  .feedback-meta {
    flex-wrap: wrap;
  }
  
  .feedback-actions {
    flex-direction: column;
  }
  
  .feedback-actions .el-button {
    width: 100%;
  }
}
</style>