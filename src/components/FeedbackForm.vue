<template>
  <el-card class="feedback-card">
    <template #header>
      <div class="card-header">
        <span>用户反馈</span>
        <el-button
          type="primary"
          size="small"
          @click="resetForm"
        >
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </template>
    
    <div class="feedback-content">
      <el-form :model="feedbackForm" :rules="rules" ref="feedbackFormRef" label-width="100px">
        <!-- 反馈类型 -->
        <el-form-item label="反馈类型" prop="type">
          <el-radio-group v-model="feedbackForm.type">
            <el-radio-button label="suggestion">功能建议</el-radio-button>
            <el-radio-button label="bug">Bug反馈</el-radio-button>
            <el-radio-button label="question">使用问题</el-radio-button>
            <el-radio-button label="other">其他</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <!-- 反馈标题 -->
        <el-form-item label="反馈标题" prop="title">
          <el-input v-model="feedbackForm.title" placeholder="请输入反馈标题" />
        </el-form-item>
        
        <!-- 反馈内容 -->
        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="feedbackForm.content"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的反馈..."
          />
        </el-form-item>
        
        <!-- 联系方式 -->
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="feedbackForm.contact" placeholder="请留下您的联系方式，方便我们回复" />
        </el-form-item>
        
        <!-- 附件上传 -->
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="#"
            :on-change="handleFileChange"
            :auto-upload="false"
            :file-list="fileList"
            :limit="3"
          >
            <el-button type="primary"><el-icon><Upload /></el-icon> 上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传图片、视频、文档等文件，最多上传3个，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 提交按钮 -->
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">
            <el-icon><Check /></el-icon>
            提交反馈
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 反馈历史 -->
      <div class="feedback-history">
        <h3>我的反馈历史</h3>
        <el-empty v-if="feedbackHistory.length === 0" description="暂无反馈历史" />
        <el-table v-else :data="feedbackHistory" stripe style="width: 100%; margin-top: 20px;">
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)">
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="180" />
          <el-table-column prop="reply" label="回复" width="100">
            <template #default="{ row }">
              <el-button
                v-if="row.reply"
                type="text"
                size="small"
                @click="showReply(row.reply)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- 回复详情对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="反馈回复"
      width="600px"
    >
      <div class="reply-content">
        <p>{{ currentReply }}</p>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Refresh, Upload, Check } from '@element-plus/icons-vue'
import logger from '../services/loggerService'

const feedbackFormRef = ref(null)
const loading = ref(false)
const fileList = ref([])
const feedbackHistory = ref([])
const replyDialogVisible = ref(false)
const currentReply = ref('')

// 反馈表单
const feedbackForm = reactive({
  type: 'suggestion',
  title: '',
  content: '',
  contact: '',
})

// 表单验证规则
const rules = {
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入反馈标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在2-50个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 5, message: '反馈内容至少5个字符', trigger: 'blur' }
  ],
  contact: [
    { required: false, message: '请输入联系方式', trigger: 'blur' }
  ]
}

// 处理文件上传
const handleFileChange = (file, fileList) => {
  fileList.value = fileList
}

// 提交反馈
const submitForm = async () => {
  if (!feedbackFormRef.value) return
  
  try {
    await feedbackFormRef.value.validate()
    loading.value = true
    
    // 模拟提交反馈
    setTimeout(() => {
      // 保存反馈到本地存储
      const feedbacks = JSON.parse(localStorage.getItem('zhihui_site_feedbacks') || '[]')
      const newFeedback = {
        id: Date.now().toString(),
        ...feedbackForm,
        files: fileList.value.map(file => file.name),
        status: 'pending',
        createdAt: new Date().toISOString(),
        reply: null
      }
      feedbacks.push(newFeedback)
      localStorage.setItem('zhihui_site_feedbacks', JSON.stringify(feedbacks))
      
      // 更新反馈历史
      loadFeedbackHistory()
      
      // 重置表单
      resetForm()
      
      // 显示成功消息
      ElMessage.success('反馈提交成功，我们会尽快处理！')
      
      // 记录日志
      logger.info('User feedback submitted', { type: feedbackForm.type, title: feedbackForm.title })
      
      loading.value = false
    }, 1000)
  } catch (error) {
    logger.error('Error submitting feedback', error)
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (feedbackFormRef.value) {
    feedbackFormRef.value.resetFields()
  }
  fileList.value = []
}

// 加载反馈历史
const loadFeedbackHistory = () => {
  try {
    const feedbacks = JSON.parse(localStorage.getItem('zhihui_site_feedbacks') || '[]')
    feedbackHistory.value = feedbacks.reverse()
  } catch (error) {
    logger.error('Error loading feedback history', error)
  }
}

// 显示回复
const showReply = (reply) => {
  currentReply.value = reply
  replyDialogVisible.value = true
}

// 获取类型标签
const getTypeTag = (type) => {
  switch (type) {
    case 'suggestion':
      return 'primary'
    case 'bug':
      return 'danger'
    case 'question':
      return 'info'
    case 'other':
      return 'warning'
    default:
      return ''
  }
}

// 获取类型文本
const getTypeText = (type) => {
  switch (type) {
    case 'suggestion':
      return '功能建议'
    case 'bug':
      return 'Bug反馈'
    case 'question':
      return '使用问题'
    case 'other':
      return '其他'
    default:
      return type
  }
}

// 获取状态标签
const getStatusTag = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'processing':
      return 'info'
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'rejected':
      return '已拒绝'
    default:
      return status
  }
}

onMounted(() => {
  loadFeedbackHistory()
  // 模拟一些反馈历史数据
  if (feedbackHistory.value.length === 0) {
    const mockFeedbacks = [
      {
        id: '1',
        type: 'suggestion',
        title: '希望添加数据导出功能',
        content: '希望能够导出Excel格式的数据，方便进行离线分析',
        contact: 'user@example.com',
        files: [],
        status: 'completed',
        createdAt: '2026-03-10T10:00:00.000Z',
        reply: '您好，我们已收到您的建议，计划在v1.1.0版本中添加数据导出功能。'
      },
      {
        id: '2',
        type: 'bug',
        title: '数据看板无法正常显示',
        content: '数据看板在Chrome浏览器中无法正常显示，页面加载后一片空白',
        contact: 'user2@example.com',
        files: ['screenshot.png'],
        status: 'processing',
        createdAt: '2026-03-12T14:30:00.000Z',
        reply: '您好，我们正在处理这个问题，预计将在近期发布的修订版本中修复。'
      }
    ]
    localStorage.setItem('zhihui_site_feedbacks', JSON.stringify(mockFeedbacks))
    loadFeedbackHistory()
  }
})
</script>

<style scoped>
.feedback-card {
  margin-top: var(--light-spacing-lg);
  animation: lightFadeInUp var(--light-transition-slow) var(--light-easing);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-content {
  margin-top: var(--light-spacing-md);
}

.feedback-history {
  margin-top: var(--light-spacing-lg);
  padding-top: var(--light-spacing-lg);
  border-top: 1px solid var(--light-border);
}

.feedback-history h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--light-text-primary);
  margin-bottom: var(--light-spacing-md);
}

.reply-content {
  padding: var(--light-spacing-md);
  line-height: 1.6;
  color: var(--light-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--light-spacing-sm);
  }
  
  .el-form-item {
    margin-bottom: var(--light-spacing-md);
  }
  
  .el-form-item__label {
    font-size: 14px;
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