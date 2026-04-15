<template>
  <div class="major-events-page" :class="{ 'fade-in': isMounted }">
    <div class="page-header">
      <div class="header-left">
        <h2>工地大事件</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddEventDialog">
          <el-icon><Plus /></el-icon>
          记录事件
        </el-button>
      </div>
    </div>

    <div class="events-container">
      <div class="events-stats">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ events.length }}</div>
            <div class="stat-label">总事件数</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ todayCount }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ weekCount }}</div>
            <div class="stat-label">本周新增</div>
          </div>
        </el-card>
      </div>

      <el-card class="events-card">
        <div class="events-list" v-if="events.length > 0">
          <el-timeline>
            <el-timeline-item
              v-for="(event, index) in events"
              :key="event.id"
              :timestamp="event.date"
              :type="getEventTypeColor(event.typeName)"
              :hollow="true"
            >
              <el-card class="event-card" shadow="hover">
                <template #header>
                  <div class="event-header">
                    <el-tag :type="getEventTypeColor(event.typeName)" size="small">{{ event.typeName || '其他' }}</el-tag>
                    <span class="event-title">{{ event.title }}</span>
                    <el-button type="danger" size="small" circle @click.stop="deleteEvent(event.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
                <div class="event-content">
                  <p>{{ event.description }}</p>
                  <div class="event-meta">
                    <span class="event-author"><el-icon><User /></el-icon> {{ event.author || '系统' }}</span>
                    <span class="event-block" v-if="event.block"><el-icon><Location /></el-icon> 区块{{ event.block }}</span>
                    <span class="event-time"><el-icon><Clock /></el-icon> {{ event.createdAt ? formatTime(event.createdAt) : '' }}</span>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        <el-empty v-else description="暂无大事件记录，点击右上角按钮添加" />
      </el-card>
    </div>

    <el-dialog
      v-model="addEventDialogVisible"
      title="记录大事件"
      width="550px"
      class="custom-dialog"
    >
      <el-form :model="eventForm" label-width="90px" class="custom-form">
        <el-form-item label="事件标题">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" class="custom-input" />
        </el-form-item>
        <el-form-item label="事件类型">
          <el-input v-model="eventForm.typeName" placeholder="请输入事件类型" class="custom-input" />
        </el-form-item>
        <el-form-item label="关联区块">
          <el-select v-model="eventForm.block" placeholder="请选择关联区块（可选）" clearable style="width: 100%">
            <el-option label="区块 A" value="A" />
            <el-option label="区块 B" value="B" />
            <el-option label="区块 C" value="C" />
            <el-option label="区块 D" value="D" />
            <el-option label="不关联" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件日期">
          <el-date-picker
            v-model="eventForm.date"
            type="date"
            placeholder="选择日期"
            class="custom-input"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="事件描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述事件内容"
            class="custom-input"
          />
        </el-form-item>
        <el-form-item label="添加照片">
          <div class="photo-upload-area" @click="triggerPhotoUpload" @dragover.prevent @drop.prevent="handlePhotoDrop">
            <input
              type="file"
              ref="photoInputRef"
              accept="image/*"
              multiple
              style="display: none"
              @change="handlePhotoSelect"
            />
            <div v-if="eventForm.photos.length === 0" class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <span>点击或拖拽照片到此处</span>
            </div>
            <div v-else class="photo-preview-list">
              <div v-for="(photo, index) in eventForm.photos" :key="index" class="photo-preview-item">
                <img :src="photo.url" alt="照片" />
                <el-icon class="photo-remove" @click.stop="removePhoto(index)"><CircleClose /></el-icon>
              </div>
              <div class="photo-add-more" @click.stop="triggerPhotoUpload">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cancel-button" @click="addEventDialogVisible = false">取消</el-button>
        <el-button type="primary" class="confirm-button" @click="saveEvent">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, User, Location, Clock, CircleClose } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const isMounted = ref(false)
const events = ref([])
const addEventDialogVisible = ref(false)
const photoInputRef = ref(null)
const eventForm = reactive({
  title: '',
  typeName: '',
  block: '',
  date: new Date(),
  description: '',
  author: '',
  photos: []
})

const todayCount = computed(() => {
  const today = new Date().toLocaleDateString('zh-CN')
  return events.value.filter(e => e.date === today).length
})

const weekCount = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return events.value.filter(e => {
    if (!e.createdAt) return false
    return new Date(e.createdAt) >= weekAgo
  }).length
})

const getEventTypeColor = (type) => {
  const colorMap = {
    '安全检查': 'danger',
    '质量验收': 'warning',
    '进度节点': 'primary',
    '人员变动': 'success',
    '设备进场': 'info',
    '材料进场': 'warning',
    '天气影响': 'info',
    '其他': ''
  }
  return colorMap[type] || ''
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showAddEventDialog = () => {
  eventForm.title = ''
  eventForm.typeName = ''
  eventForm.block = ''
  eventForm.date = new Date()
  eventForm.description = ''
  eventForm.author = localStorage.getItem('zhihui_site_username') || '管理员'
  eventForm.photos = []
  addEventDialogVisible.value = true
}

const triggerPhotoUpload = () => {
  photoInputRef.value.click()
}

const handlePhotoSelect = (e) => {
  const files = e.target.files
  if (files) {
    processFiles(files)
  }
}

const handlePhotoDrop = (e) => {
  const files = e.dataTransfer.files
  if (files) {
    processFiles(files)
  }
}

const processFiles = (files) => {
  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        eventForm.photos.push({
          name: file.name,
          url: e.target.result
        })
      }
      reader.readAsDataURL(file)
    }
  })
}

const removePhoto = (index) => {
  eventForm.photos.splice(index, 1)
}

const saveEvent = async () => {
  if (!eventForm.title || !eventForm.description) {
    ElMessage.warning('请填写事件标题和描述')
    return
  }

  const event = {
    id: 'evt' + Date.now(),
    title: eventForm.title,
    typeName: eventForm.typeName || '其他',
    block: eventForm.block,
    date: eventForm.date ? new Date(eventForm.date).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
    description: eventForm.description,
    author: eventForm.author,
    photos: eventForm.photos,
    createdAt: new Date().toISOString()
  }

  try {
    const allEvents = await dataService.get('events', [])
    allEvents.unshift(event)
    await dataService.set('events', allEvents)
    events.value = allEvents
    addEventDialogVisible.value = false
    ElMessage.success('大事件记录成功')
  } catch (error) {
    console.error('保存大事件失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const deleteEvent = async (eventId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条事件记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const allEvents = await dataService.get('events', [])
    const filtered = allEvents.filter(e => e.id !== eventId)
    await dataService.set('events', filtered)
    events.value = filtered
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除大事件失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const loadEvents = async () => {
  try {
    const allEvents = await dataService.get('events', [])
    events.value = allEvents
  } catch (error) {
    console.error('加载大事件失败:', error)
  }
}

onMounted(async () => {
  isMounted.value = true
  await loadEvents()
})
</script>

<style scoped>
.major-events-page {
  padding: 0;
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  margin: 16px 24px;
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.12);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 2px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.events-container {
  padding: 0 24px 24px;
}

.events-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.events-stats .stat-card {
  flex: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.12);
}

.stat-content {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #660099 0%, #FF6600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.events-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.12);
}

.el-timeline {
  padding: 0 0 0 20px;
}

.events-list {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
  padding-right: 10px;
}

.event-card {
  margin-bottom: 8px;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-title {
  flex: 1;
  font-weight: 600;
  font-size: 15px;
}

.event-content p {
  margin: 8px 0;
  color: #4E5969;
  line-height: 1.6;
}

.event-meta {
  display: flex;
  gap: 16px;
  color: #86909C;
  font-size: 13px;
  flex-wrap: wrap;
}

.event-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.custom-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
  padding: 24px;
  background: rgba(245, 247, 250, 0.95);
}

.custom-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.custom-dialog .el-dialog__body {
  padding: 24px;
  background: rgba(255, 255, 255, 0.98);
}

.custom-form .el-form-item {
  margin-bottom: 20px;
}

.custom-form .el-form-item__label {
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 500;
}

.custom-input {
  background: rgba(245, 247, 250, 0.95);
  border-radius: 8px;
}

.cancel-button,
.confirm-button {
  border-radius: 8px;
  padding: 10px 20px;
}

.cancel-button {
  background: transparent;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.cancel-button:hover {
  border-color: #660099;
  color: #660099;
}

.confirm-button {
  background: linear-gradient(135deg, #660099 0%, #9933CC 100%);
  border: none;
  color: white;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #550088 0%, #8822BB 100%);
}

.photo-upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-upload-area:hover {
  border-color: #660099;
  background: rgba(102, 0, 153, 0.05);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #86909C;
}

.upload-icon {
  font-size: 32px;
  color: #C0C4CC;
}

.photo-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.photo-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 18px;
  color: #F56C6C;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.photo-add-more {
  width: 80px;
  height: 80px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C0C4CC;
  font-size: 24px;
  cursor: pointer;
}

.photo-add-more:hover {
  border-color: #660099;
  color: #660099;
}

@media (max-width: 1200px) {
  .events-stats {
    flex-wrap: wrap;
  }

  .stat-card {
    min-width: calc(50% - 8px);
  }

  .page-header h2 {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .events-stats {
    flex-direction: column;
  }

  .stat-card {
    min-width: 100%;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .event-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .event-title {
    width: 100%;
    font-size: 14px;
  }

  .event-meta {
    flex-wrap: wrap;
    gap: 8px;
  }

  .photo-preview-item,
  .photo-add-more {
    width: 60px;
    height: 60px;
  }

  .custom-dialog {
    width: 95% !important;
  }
}

@media (max-width: 480px) {
  .page-header h2 {
    font-size: 18px;
  }

  .events-container {
    padding: 0 12px 12px;
  }

  .events-list {
    padding-right: 0;
  }

  .el-timeline-item__content {
    padding-left: 8px;
  }
}
</style>
