<template>
  <div class="dashboard" :class="{ 'fade-in': isMounted }">
    <!-- Page Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <h2>数据看板</h2>
        <div class="system-status">
          <div class="status-indicator">
            <span class="status-dot online"></span>
            <span class="status-text">系统正常运行</span>
          </div>
        </div>
      </div>
      <div class="header-right-actions">
        <div class="sync-status-container">
          <div v-for="(status, key) in syncStatus" :key="key" :class="getSyncStatusClass(status)" class="sync-status-item">
            <el-icon><component :is="getSyncStatusIcon(status)" /></el-icon>
            <span class="sync-status-label">{{ getSyncStatusLabel(key) }}</span>
            <span class="sync-status-text">{{ getSyncStatusText(status) }}</span>
          </div>
        </div>
        <el-button size="small" @click="checkDataConsistency" class="check-consistency-button">
          <el-icon><WarningIcon /></el-icon>
          检查一致性
        </el-button>
        <el-button size="small" type="primary" @click="forceRefreshData" class="refresh-button">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button 
          v-if="isAdmin"
          type="danger" 
          size="small"
          @click="resetAllData"
          class="reset-button"
        >
          <el-icon><Delete /></el-icon>
          一键重置
        </el-button>
      </div>
    </div>
    
    <!-- Stat Cards -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card class="stat-card" @click="navigateTo('personnel')">
          <div class="stat-content">
            <div class="stat-icon personnel">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ personnelCount }}</div>
              <div class="stat-label">在场人员</div>
              <div class="stat-trend positive">↑ 2 今日</div>
            </div>
            <div class="stat-actions">
              <el-button size="small" type="primary" plain @click.stop="quickAdd('personnel')">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
              <el-button size="small" @click.stop="viewDetails('personnel')">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" @click="navigateTo('equipment')">
          <div class="stat-content">
            <div class="stat-icon equipment">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ equipmentCount }}</div>
              <div class="stat-label">设备数量</div>
              <div class="stat-trend positive">↑ 1 今日</div>
            </div>
            <div class="stat-actions">
              <el-button size="small" type="primary" plain @click.stop="quickAdd('equipment')">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
              <el-button size="small" @click.stop="viewDetails('equipment')">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" @click="navigateTo('safety')">
          <div class="stat-content">
            <div class="stat-icon safety">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ safetyCount }}</div>
              <div class="stat-label">安全巡检</div>
              <div class="stat-trend negative">↓ 1 今日</div>
            </div>
            <div class="stat-actions">
              <el-button size="small" type="primary" plain @click.stop="quickAdd('safety')">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
              <el-button size="small" @click.stop="viewDetails('safety')">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" @click="navigateTo('materials')">
          <div class="stat-content">
            <div class="stat-icon materials">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ materialCount }}</div>
              <div class="stat-label">材料种类</div>
              <div class="stat-trend positive">↑ 3 今日</div>
            </div>
            <div class="stat-actions">
              <el-button size="small" type="primary" plain @click.stop="quickAdd('materials')">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
              <el-button size="small" @click.stop="viewDetails('materials')">
                <el-icon><View /></el-icon> 详情
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Block Container -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="block-container">
          <template #header>
            <div class="card-header">
              <span>各区块施工情况</span>
              <div class="header-actions">
                <el-button size="small" class="refresh-button">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
              </div>
            </div>
          </template>
          <div class="block-grid">
            <el-card class="block-card" shadow="hover" v-for="item in blockProgress" :key="item.block">
              <div class="block-header">
                <span class="block-label" :class="'block-' + item.block">区块 {{ item.block }}</span>
                <span class="block-stage">{{ item.stage || '未开始' }}</span>
                <el-tag v-if="item.currentNode" type="primary" size="small" effect="plain">
                  {{ item.currentNode }}
                </el-tag>
                <el-tag v-if="getWarningLevel(item) === 'danger'" type="danger" size="small" effect="dark">
                  <el-icon><Warning /></el-icon> 紧急预警
                </el-tag>
                <el-tag v-else-if="getWarningLevel(item) === 'warning'" type="warning" size="small" effect="dark">
                  <el-icon><Clock /></el-icon> 即将超时
                </el-tag>
              </div>
              <div class="block-content">
                <div class="progress-circle">
                  <el-progress
                    type="dashboard"
                    :percentage="item.progress"
                    :color="getProgressColor(item.progress)"
                    :stroke-width="12"
                    :format="() => `${item.progress}%`"
                    class="progress-dashboard"
                  />
                </div>
                <div class="block-info">
                  <div class="info-item">
                    <span class="info-label">负责人：</span>
                    <span class="info-value">{{ item.manager || '未设置' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">联系电话：</span>
                    <span class="info-value">{{ getBlockPhone(item.block) }}</span>
                  </div>
                  <div class="info-item" v-if="item.targetDate">
                    <span class="info-label">预计完成：</span>
                    <span class="info-value">{{ item.targetDate }}</span>
                  </div>
                </div>
                <div class="block-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    @click="editBlock(item)"
                    class="edit-button"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="success"
                    plain
                    @click="showAddBlockPhotoDialog(item)"
                    class="add-photo-button"
                  >
                    <el-icon><Camera /></el-icon>
                    添加照片
                  </el-button>
                </div>
                <div v-if="getBlockPhotos(item.block).length > 0" class="block-photos">
                  <div class="photo-list">
                    <div 
                      v-for="(photo, idx) in getBlockPhotos(item.block)" 
                      :key="idx" 
                      class="block-photo-item"
                    >
                      <el-image
                        :src="photo.url"
                        :preview-src-list="getBlockPhotos(item.block).map(p => p.url)"
                        :initial-index="idx"
                        fit="cover"
                        class="block-photo"
                      />
                      <el-button
                        v-if="isAdmin"
                        type="danger"
                        size="small"
                        circle
                        class="block-photo-delete-btn"
                        @click.stop="deleteBlockPhoto(item.block, photo.id)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Photo Gallery Cards -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>优秀案例展示</span>
              <div class="header-actions">
                <el-button size="small" type="primary" class="add-button" @click="showAddPhotoDialog('excellent')">
                  <el-icon><Plus /></el-icon>
                  添加照片
                </el-button>
              </div>
            </div>
          </template>
          <div class="photo-gallery">
            <div v-if="excellentPhotos.length > 0" class="photo-grid">
              <div v-for="(photo, index) in excellentPhotos" :key="photo.id" class="photo-item">
                <el-image
                  :src="photo.url"
                  :preview-src-list="excellentPhotos.map(p => p.url)"
                  :initial-index="index"
                  fit="cover"
                  class="photo-image"
                />
                <div class="photo-overlay">
                  <span class="photo-title">{{ photo.title || '优秀案例' }}</span>
                  <el-button
                    v-if="isAdmin"
                    type="danger"
                    size="small"
                    circle
                    @click.stop="deletePhoto('excellent', photo.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无照片，点击上方按钮添加" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>存在问题优化</span>
              <div class="header-actions">
                <el-button size="small" type="primary" class="add-button" @click="showAddPhotoDialog('problem')">
                  <el-icon><Plus /></el-icon>
                  添加照片
                </el-button>
              </div>
            </div>
          </template>
          <div class="photo-gallery">
            <div v-if="problemPhotos.length > 0" class="photo-grid">
              <div v-for="(photo, index) in problemPhotos" :key="photo.id" class="photo-item">
                <el-image
                  :src="photo.url"
                  :preview-src-list="problemPhotos.map(p => p.url)"
                  :initial-index="index"
                  fit="cover"
                  class="photo-image"
                />
                <div class="photo-overlay">
                  <span class="photo-title">{{ photo.title || '问题优化' }}</span>
                  <el-button
                    v-if="isAdmin"
                    type="danger"
                    size="small"
                    circle
                    @click.stop="deletePhoto('problem', photo.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无照片，点击上方按钮添加" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Progress Comparison Chart -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="progress-comparison-card">
          <template #header>
            <div class="card-header">
              <span>进度对比 - 计划进度 vs 实际进度</span>
              <div class="header-actions">
                <el-button size="small" class="refresh-button" @click="forceRefreshData">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <div class="progress-comparison-content">
            <div class="comparison-legend">
              <div class="legend-item">
                <span class="legend-color planned"></span>
                <span class="legend-label">计划进度</span>
              </div>
              <div class="legend-item">
                <span class="legend-color actual" :style="{ background: getOverallProgressGradient() }"></span>
                <span class="legend-label">实际进度</span>
              </div>
            </div>
            <div class="comparison-bars">
              <div v-for="item in blockProgress" :key="item.block" class="comparison-item">
                <div class="comparison-info">
                  <div class="comparison-block-label">区块 {{ item.block }}</div>
                  <div v-if="item.currentNode" class="comparison-current-node">{{ item.currentNode }}</div>
                </div>
                <div class="comparison-bar-container">
                  <div class="comparison-bar-wrapper">
                    <div class="comparison-bar planned" :style="{ width: getPlannedProgress(item) + '%' }">
                      <span class="bar-value">{{ getPlannedProgress(item) }}%</span>
                    </div>
                  </div>
                  <div class="comparison-bar-wrapper">
                    <div
                      class="comparison-bar actual"
                      :style="{
                        width: item.progress + '%',
                        background: getActualProgressGradient(item)
                      }"
                    >
                      <span class="bar-value">{{ item.progress }}%</span>
                    </div>
                  </div>
                </div>
                <div class="comparison-status" :class="getComparisonStatusClass(item)">
                  <span v-if="item.progress >= getPlannedProgress(item)" class="status-ahead">
                    <el-icon><Top /></el-icon> 超前
                  </span>
                  <span v-else-if="item.progress >= getPlannedProgress(item) - 5" class="status-ontrack">
                    <el-icon><Check /></el-icon> 正常
                  </span>
                  <span v-else class="status-delay">
                    <el-icon><Warning /></el-icon> 滞后
                  </span>
                </div>
              </div>
            </div>
            <div class="comparison-summary">
              <div class="summary-item">
                <span class="summary-label">总体计划进度：</span>
                <span class="summary-value planned">{{ getOverallPlannedProgress() }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">总体实际进度：</span>
                <span class="summary-value actual">{{ getOverallActualProgress() }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">进度偏差：</span>
                <span class="summary-value" :class="getDeviationClass()">
                  {{ getProgressDeviation() > 0 ? '+' : '' }}{{ getProgressDeviation() }}%
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Add Photo Dialog -->
    <el-dialog
      v-model="addPhotoDialogVisible"
      :title="currentPhotoType === 'excellent' ? '添加优秀案例照片' : (currentPhotoType === 'problem' ? '添加问题优化照片' : '添加区块照片')"
      width="500px"
      class="custom-dialog"
    >
      <el-form :model="photoForm" label-width="80px" class="custom-form">
        <el-form-item label="照片标题">
          <el-input v-model="photoForm.title" placeholder="请输入照片标题" class="custom-input" />
        </el-form-item>
        <el-form-item label="上传照片">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handlePhotoUpload"
            accept="image/*"
          >
            <div v-if="photoForm.previewUrl" class="photo-preview">
              <el-image :src="photoForm.previewUrl" fit="cover" class="preview-image" />
            </div>
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <span>点击上传照片</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cancel-button" @click="closeAddPhotoDialog">取消</el-button>
        <el-button type="primary" class="confirm-button" @click="savePhoto" :disabled="!photoForm.file">确定</el-button>
      </template>
    </el-dialog>

    <!-- Edit Block Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="'编辑区块 ' + form.block + ' 进度'"
      width="550px"
      class="custom-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="custom-form">
        <el-form-item label="区块" prop="block">
          <el-select v-model="form.block" placeholder="请选择区块" disabled class="custom-input">
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="manager">
          <el-input v-model="form.manager" placeholder="请输入负责人姓名" class="custom-input" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" class="custom-input" />
        </el-form-item>
        <el-form-item label="施工阶段" prop="stage">
          <el-select v-model="form.stage" placeholder="请选择施工阶段" class="custom-input">
            <el-option label="场地平整" value="场地平整" />
            <el-option label="基础施工" value="基础施工" />
            <el-option label="主体结构" value="主体结构" />
            <el-option label="屋面工程" value="屋面工程" />
            <el-option label="装饰装修" value="装饰装修" />
            <el-option label="设备安装" value="设备安装" />
            <el-option label="竣工验收" value="竣工验收" />
          </el-select>
        </el-form-item>
        <el-form-item label="施工进度" prop="progress">
          <el-slider v-model="form.progress" :min="0" :max="100" show-input class="custom-slider" />
        </el-form-item>
        <el-form-item label="预计完成日期" prop="targetDate">
          <el-date-picker
            v-model="form.targetDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="custom-input"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            class="custom-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="confirm-button" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, Plus, Delete, Download, View, Edit, Refresh, User, Tools, Warning, Goods, Loading, CircleCheck, Warning as WarningIcon, CircleClose, Camera, Clock, Top, Check } from '@element-plus/icons-vue'
import dataService from '../services/dataService'
import { uploadApi } from '../api/api'

const emit = defineEmits(['navigate'])
const isMounted = ref(false)

const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

const navigateTo = (menu) => {
  emit('navigate', menu)
}

const navigateWithFilter = (menu, filter = {}) => {
  emit('navigate', { menu, filter })
}

const viewDetails = (type) => {
  switch (type) {
    case 'personnel':
      navigateTo('personnel')
      break
    case 'equipment':
      navigateTo('equipment')
      break
    case 'safety':
      navigateTo('safety')
      break
    case 'materials':
      navigateTo('materials')
      break
    case 'progress':
      navigateTo('progress')
      break
    case 'workflow':
      navigateTo('workflow')
      break
    default:
      break
  }
}

const quickAdd = (type) => {
  emit('navigate', { menu: type, action: 'add' })
}

const isLoggedIn = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return !!userId
})

const validateData = (data, type) => {
  if (!data || !Array.isArray(data)) return true;
  
  if (data.length === 0) return true;
  
  switch (type) {
    case 'personnel':
      return data.every(item => item && (item.id || item.name));
    case 'equipment':
      return data.every(item => item && (item.id || item.name));
    case 'safety':
      return data.every(item => item && (item.id || item.inspector));
    case 'materials':
      return data.every(item => item && (item.id || item.name));
    case 'progress':
      return data.every(item => item && (item.block || item.id));
    default:
      return true;
  }
}

const handleDataError = (error, type) => {
  console.error(`Error with ${type} data:`, error);
}

const personnelList = ref([])
const equipmentList = ref([])
const safetyList = ref([])
const progressList = ref([])
const materialList = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)
const workflowList = ref([])

const excellentPhotos = ref([])
const problemPhotos = ref([])
const blockPhotos = ref({
  A: [],
  B: [],
  C: [],
  D: []
})
const addPhotoDialogVisible = ref(false)
const currentPhotoType = ref('')
const currentBlock = ref('')
const photoForm = reactive({
  title: '',
  file: null,
  previewUrl: ''
})

const syncStatus = reactive({
  personnel: 'idle',
  equipment: 'idle',
  safety: 'idle',
  progress: 'idle',
  materials: 'idle'
})

const getSyncStatusLabel = (key) => {
  const labels = {
    personnel: '人员',
    equipment: '设备',
    safety: '安全',
    progress: '进度',
    materials: '材料'
  }
  return labels[key] || key
}

let syncStatusUnsubscribers = []

const subscribeToSyncStatus = () => {
  const keys = ['personnel', 'equipment', 'safety', 'progress', 'materials']
  keys.forEach(key => {
    const unsubscribe = dataService.subscribeSyncStatus(key, (status) => {
      syncStatus[key] = status
    })
    syncStatusUnsubscribers.push(unsubscribe)
  })
}

const getSyncStatusIcon = (status) => {
  switch (status) {
    case 'loading':
      return Loading
    case 'saving':
      return Loading
    case 'synced':
      return CircleCheck
    case 'error':
      return CircleClose
    default:
      return WarningIcon
  }
}

const getSyncStatusText = (status) => {
  switch (status) {
    case 'loading':
      return '加载中'
    case 'saving':
      return '保存中'
    case 'synced':
      return '已同步'
    case 'error':
      return '同步失败'
    default:
      return '待同步'
  }
}

const getSyncStatusClass = (status) => {
  switch (status) {
    case 'loading':
      return 'sync-status loading'
    case 'saving':
      return 'sync-status saving'
    case 'synced':
      return 'sync-status synced'
    case 'error':
      return 'sync-status error'
    default:
      return 'sync-status idle'
  }
}

const forceRefreshData = async () => {
  try {
    ElMessage.info('正在刷新所有数据...')
    await dataService.forceRefreshAll()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('数据刷新失败，请稍后重试')
  }
}

const checkDataConsistency = async () => {
  try {
    ElMessage.info('正在检查数据一致性...')
    const results = await dataService.checkDataConsistency()
    let hasInconsistency = false
    for (const [key, result] of Object.entries(results)) {
      if (!result.isConsistent) {
        hasInconsistency = true
        break
      }
    }
    if (hasInconsistency) {
      ElMessage.warning('检测到数据不一致，请尝试刷新数据')
    } else {
      ElMessage.success('数据一致性检查通过')
    }
  } catch (error) {
    console.error('检查数据一致性失败:', error)
    ElMessage.error('检查数据一致性失败，请稍后重试')
  }
}

const exportData = async () => {
  try {
    const exportData = {
      personnel: personnelList.value,
      equipment: equipmentList.value,
      safety: safetyList.value,
      progress: progressList.value,
      materials: materialList.value,
      workflow: workflowList.value,
      exportTime: new Date().toLocaleString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('Error exporting data:', error)
    ElMessage.error('数据导出失败')
  }
}

const loadWorkflows = async () => {
  const currentUserId = localStorage.getItem('zhihui_site_userid')
  try {
    const workflows = await dataService.get('workflow', [])
    
    if (currentUserId === 'admin') {
      workflowList.value = workflows.filter(item => item.status === '待处理' || item.status === '处理中')
    } else {
      workflowList.value = workflows.filter(item => item.submitter === currentUserId && (item.status === '待处理' || item.status === '处理中'))
    }
    
    if (workflowList.value.length === 0) {
      workflowList.value = []
    }
  } catch (error) {
    console.error('Error loading workflows:', error)
    workflowList.value = []
  }
}

const refreshWorkflows = () => {
  loadWorkflows()
  ElMessage.success('工作流数据已刷新')
}

const getStatusType = (status) => {
  switch (status) {
    case '待处理':
      return 'warning'
    case '处理中':
      return 'primary'
    case '已完成':
      return 'success'
    case '已拒绝':
      return 'danger'
    default:
      return ''
  }
}

const viewWorkflowDetail = (row) => {
  workflowForm.value = { ...row }
  workflowDialogVisible.value = true
}

const approveWorkflow = async (row) => {
  const index = workflowList.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    workflowList.value.splice(index, 1)
    const logMessage = `管理员同意了工作流申请: ${row.id} - ${row.type} (提交人: ${row.submitterName || row.submitter})`
    dataService.addLog('info', logMessage)
    
    if (row.type.includes('设备')) {
      const equipmentList = await dataService.get('equipment', [])
      const updatedEquipment = equipmentList.filter(item => item.id !== row.targetId)
      await dataService.set('equipment', updatedEquipment)
    } else if (row.type.includes('巡检')) {
      const safetyList = await dataService.get('safety', [])
      const updatedSafety = safetyList.filter(item => item.id !== row.targetId)
      await dataService.set('safety', updatedSafety)
    } else if (row.type.includes('进度')) {
      const progressList = await dataService.get('progress', [])
      const updatedProgress = progressList.filter(item => item.id !== row.targetId)
      await dataService.set('progress', updatedProgress)
    } else if (row.type.includes('材料')) {
      const materialsList = await dataService.get('materials', [])
      const updatedMaterials = materialsList.filter(item => item.id !== row.targetId)
      await dataService.set('materials', updatedMaterials)
    } else if (row.type.includes('人员')) {
      const personnelList = await dataService.get('personnel', [])
      const updatedPersonnel = personnelList.filter(item => item.id !== row.targetId)
      await dataService.set('personnel', updatedPersonnel)
    }
    
    const workflows = await dataService.get('workflow', [])
    const workflowIndex = workflows.findIndex(item => item.id === row.id)
    if (workflowIndex > -1) {
      workflows[workflowIndex] = {
        ...row,
        status: '已完成'
      }
      await dataService.set('workflow', workflows)
    }
  }
  ElMessage.success('工作流处理成功')
}

const rejectWorkflow = async (row) => {
  const index = workflowList.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    workflowList.value.splice(index, 1)
    const logMessage = `管理员拒绝了工作流申请: ${row.id} - ${row.type} (提交人: ${row.submitterName || row.submitter})`
    dataService.addLog('info', logMessage)
    
    const workflows = await dataService.get('workflow', [])
    const workflowIndex = workflows.findIndex(item => item.id === row.id)
    if (workflowIndex > -1) {
      workflows[workflowIndex] = {
        ...row,
        status: '已拒绝'
      }
      await dataService.set('workflow', workflows)
    }
  }
  ElMessage.success('工作流处理成功')
}

const form = ref({
  id: '',
  block: '',
  manager: '',
  phone: '',
  stage: '',
  progress: 0,
  targetDate: '',
  remark: '',
  photos: []
})

const rules = {
  block: [{ required: true, message: '请选择区块', trigger: 'change' }],
  manager: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择施工阶段', trigger: 'change' }],
  progress: [{ required: true, message: '请设置施工进度', trigger: 'change' }]
}

const personnelCount = computed(() => personnelList.value.length)
const equipmentCount = computed(() => equipmentList.value.length)
const safetyCount = computed(() => safetyList.value.length)
const materialCount = computed(() => materialList.value.length)

const blockProgress = computed(() => {
  const blocks = ['A', 'B', 'C', 'D']
  return blocks.map(block => {
    const found = progressList.value.find(item => item.block === block)
    return found || {
      block,
      manager: '',
      phone: '',
      stage: '',
      progress: 0,
      targetDate: '',
      photos: []
    }
  })
})

const getWarningLevel = (item) => {
  if (!item.targetDate || item.targetDate === '未设定') return 'none'
  if (item.stage === '已完成') return 'none'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(item.targetDate)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'danger'
  if (diffDays <= 3) return 'warning'
  return 'none'
}

const getProgressColor = (progress) => {
  if (progress < 30) return '#660099'
  if (progress < 70) return '#FF6600'
  return '#00B42A'
}

const getBlockPhone = (block) => {
  const found = progressList.value.find(item => item.block === block)
  if (found && found.phone) {
    return found.phone
  }
  const phoneMap = {
    A: '139-1234-5678',
    B: '138-8765-4321',
    C: '137-6543-2109',
    D: '136-9876-5432'
  }
  return phoneMap[block] || '未设置'
}

const getPlannedProgress = (item) => {
  if (item.targetDate) {
    const today = new Date()
    const startDate = item.startDate ? new Date(item.startDate) : new Date(today.getFullYear(), 0, 1)
    const targetDate = new Date(item.targetDate)
    const totalDays = Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24))
    if (totalDays > 0) {
      return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
    }
  }
  return item.progress || 0
}

const getOverallPlannedProgress = () => {
  const blocks = blockProgress.value
  if (blocks.length === 0) return 0
  const total = blocks.reduce((sum, item) => sum + (item.targetDate ? getPlannedProgress(item) : item.progress || 0), 0)
  return Math.round(total / blocks.length)
}

const getOverallActualProgress = () => {
  const blocks = blockProgress.value
  if (blocks.length === 0) return 0
  const total = blocks.reduce((sum, item) => sum + (item.progress || 0), 0)
  return Math.round(total / blocks.length)
}

const getProgressDeviation = () => {
  return getOverallActualProgress() - getOverallPlannedProgress()
}

const getDeviationClass = () => {
  const deviation = getProgressDeviation()
  if (deviation > 0) return 'positive'
  if (deviation < 0) return 'negative'
  return ''
}

const getOverallProgressGradient = () => {
  const planned = getOverallPlannedProgress()
  const actual = getOverallActualProgress()
  const deviation = actual - planned
  const maxDeviation = 20
  const ratio = Math.max(-1, Math.min(1, deviation / maxDeviation))
  if (ratio >= 0) {
    const purple = [102, 0, 153]
    const green = [0, 180, 42]
    const r = Math.round(purple[0] + (green[0] - purple[0]) * ratio)
    const g = Math.round(purple[1] + (green[1] - purple[1]) * ratio)
    const b = Math.round(purple[2] + (green[2] - purple[2]) * ratio)
    return `linear-gradient(90deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(r * 1.1)}, ${Math.round(g * 1.1)}, ${Math.round(b * 1.1)}) 100%)`
  } else {
    const purple = [102, 0, 153]
    const darkPurple = [60, 0, 90]
    const r = Math.round(purple[0] + (darkPurple[0] - purple[0]) * (-ratio))
    const g = Math.round(purple[1] + (darkPurple[1] - purple[1]) * (-ratio))
    const b = Math.round(purple[2] + (darkPurple[2] - purple[2]) * (-ratio))
    return `linear-gradient(90deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(r * 1.1)}, ${Math.round(g * 1.1)}, ${Math.round(b * 1.1)}) 100%)`
  }
}

const getComparisonStatusClass = (item) => {
  const planned = getPlannedProgress(item)
  if (item.progress >= planned) return 'status-ahead'
  if (item.progress >= planned - 5) return 'status-ontrack'
  return 'status-delay'
}

const getActualProgressGradient = (item) => {
  const planned = getPlannedProgress(item)
  const deviation = item.progress - planned
  const maxDeviation = 20
  const ratio = Math.max(-1, Math.min(1, deviation / maxDeviation))
  if (ratio >= 0) {
    const purple = [102, 0, 153]
    const green = [0, 180, 42]
    const r = Math.round(purple[0] + (green[0] - purple[0]) * ratio)
    const g = Math.round(purple[1] + (green[1] - purple[1]) * ratio)
    const b = Math.round(purple[2] + (green[2] - purple[2]) * ratio)
    return `linear-gradient(90deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(r * 1.1)}, ${Math.round(g * 1.1)}, ${Math.round(b * 1.1)}) 100%)`
  } else {
    const purple = [102, 0, 153]
    const darkPurple = [60, 0, 90]
    const r = Math.round(purple[0] + (darkPurple[0] - purple[0]) * (-ratio))
    const g = Math.round(purple[1] + (darkPurple[1] - purple[1]) * (-ratio))
    const b = Math.round(purple[2] + (darkPurple[2] - purple[2]) * (-ratio))
    return `linear-gradient(90deg, rgb(${r}, ${g}, ${b}) 0%, rgb(${Math.round(r * 1.1)}, ${Math.round(g * 1.1)}, ${Math.round(b * 1.1)}) 100%)`
  }
}

const editBlock = (item) => {
  emit('navigate', 'progress')
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      const index = progressList.value.findIndex(item => item.block === form.value.block)
      if (index > -1) {
        progressList.value[index] = { ...form.value }
      } else {
        progressList.value.push({ ...form.value })
      }
      await dataService.set('progress', progressList.value)
      dialogVisible.value = false
      ElMessage.success('编辑成功')
    }
  })
}

const resetAllData = async () => {
  ElMessageBox.confirm('确定要重置所有数据吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
    dangerouslyUseHTMLString: true,
    message: '<div style="padding: 20px;"><p>此操作将清空所有数据：</p><ul><li>人员信息</li><li>设备信息</li><li>安全巡检记录</li><li>各区块施工进度</li><li>材料进场记录</li></ul><p style="color: #f56c6c; margin-top: 10px;">请确认是否执行此操作？</p></div>'
  }).then(async () => {
    await dataService.set('personnel', [])
    await dataService.set('equipment', [])
    await dataService.set('safety', [])
    await dataService.set('progress', [])
    await dataService.set('materials', [])
    personnelList.value = []
    equipmentList.value = []
    safetyList.value = []
    progressList.value = []
    materialList.value = []
    ElMessage.success('所有数据已重置')
  }).catch(() => {
  })
}

const loadInitialData = async () => {
  try {
    const [personnel, equipment, safety, progress, materials, excellentPhotosData, problemPhotosData, blockPhotosData] = await Promise.all([
      dataService.get('personnel', []),
      dataService.get('equipment', []),
      dataService.get('safety', []),
      dataService.get('progress', []),
      dataService.get('materials', []),
      dataService.get('excellentPhotos', []),
      dataService.get('problemPhotos', []),
      dataService.get('blockPhotos', { A: [], B: [], C: [], D: [] })
    ]);
    
    personnelList.value = personnel;
    equipmentList.value = equipment;
    safetyList.value = safety;
    progressList.value = progress;
    materialList.value = materials;
    excellentPhotos.value = excellentPhotosData;
    problemPhotos.value = problemPhotosData;
    blockPhotos.value = blockPhotosData;
  } catch (error) {
    console.error('Error loading initial data:', error);
    ElMessage.error('数据加载失败，请刷新页面重试');
  }
}

const showAddPhotoDialog = (type) => {
  currentPhotoType.value = type
  currentBlock.value = ''
  photoForm.title = ''
  photoForm.file = null
  photoForm.previewUrl = ''
  addPhotoDialogVisible.value = true
}

const showAddBlockPhotoDialog = (item) => {
  currentPhotoType.value = 'block'
  currentBlock.value = item.block
  photoForm.title = ''
  photoForm.file = null
  photoForm.previewUrl = ''
  addPhotoDialogVisible.value = true
}

const getBlockPhotos = (block) => {
  return blockPhotos.value[block] || []
}

const closeAddPhotoDialog = () => {
  addPhotoDialogVisible.value = false
  photoForm.title = ''
  photoForm.file = null
  photoForm.previewUrl = ''
}

const handlePhotoUpload = (file) => {
  photoForm.file = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    photoForm.previewUrl = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const savePhoto = async () => {
  if (!photoForm.file) {
    ElMessage.warning('请上传照片')
    return
  }
  
  try {
    const filename = photoForm.file.name || 'photo.jpg'
    const uploadResult = await uploadApi.uploadImage(photoForm.previewUrl, filename)
    
    const newPhoto = {
      id: Date.now().toString(36),
      title: photoForm.title || (currentPhotoType.value === 'excellent' ? '优秀案例' : (currentPhotoType.value === 'problem' ? '问题优化' : '区块照片')),
      url: uploadResult.url,
      createdAt: new Date().toISOString()
    }
    
    if (currentPhotoType.value === 'excellent') {
      excellentPhotos.value.push(newPhoto)
      await dataService.set('excellentPhotos', excellentPhotos.value)
    } else if (currentPhotoType.value === 'problem') {
      problemPhotos.value.push(newPhoto)
      await dataService.set('problemPhotos', problemPhotos.value)
    } else if (currentPhotoType.value === 'block' && currentBlock.value) {
      if (!blockPhotos.value[currentBlock.value]) {
        blockPhotos.value[currentBlock.value] = []
      }
      blockPhotos.value[currentBlock.value].push(newPhoto)
      await dataService.set('blockPhotos', blockPhotos.value)
    }
    
    ElMessage.success('照片添加成功')
    closeAddPhotoDialog()
  } catch (error) {
    console.error('上传照片失败:', error)
    ElMessage.error('上传照片失败，请重试')
  }
}

const deletePhoto = async (type, photoId) => {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以删除照片')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这张照片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    let photosList = type === 'excellent' ? excellentPhotos.value : problemPhotos.value
    const photo = photosList.find(p => p.id === photoId)
    
    if (!photo) {
      ElMessage.error('照片不存在')
      return
    }
    
    if (photo.url) {
      try {
        const urlParts = photo.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        await uploadApi.deleteImage(filename)
        console.log(`[Dashboard] Server file deleted: ${filename}`)
      } catch (deleteError) {
        console.warn('[Dashboard] Server file deletion failed:', deleteError)
      }
    }
    
    if (type === 'excellent') {
      excellentPhotos.value = excellentPhotos.value.filter(p => p.id !== photoId)
      await dataService.set('excellentPhotos', excellentPhotos.value)
    } else {
      problemPhotos.value = problemPhotos.value.filter(p => p.id !== photoId)
      await dataService.set('problemPhotos', problemPhotos.value)
    }
    
    ElMessage.success('照片已删除')
    console.log(`[Dashboard] Photo deleted: ${type}/${photoId}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[Dashboard] Delete photo error:', error)
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const deleteBlockPhoto = async (block, photoId) => {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以删除照片')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这张区块照片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const photos = blockPhotos.value[block]
    if (!photos) {
      ElMessage.error('区块数据不存在')
      return
    }
    
    const photo = photos.find(p => p.id === photoId)
    if (!photo) {
      ElMessage.error('照片不存在')
      return
    }
    
    if (photo.url) {
      try {
        const urlParts = photo.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        await uploadApi.deleteImage(filename)
        console.log(`[Dashboard] Block photo server file deleted: ${filename}`)
      } catch (deleteError) {
        console.warn('[Dashboard] Block photo server file deletion failed:', deleteError)
      }
    }
    
    blockPhotos.value[block] = blockPhotos.value[block].filter(p => p.id !== photoId)
    await dataService.set('blockPhotos', blockPhotos.value)
    
    ElMessage.success('区块照片已删除')
    console.log(`[Dashboard] Block photo deleted: ${block}/${photoId}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[Dashboard] Delete block photo error:', error)
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const subscribeToDataChanges = () => {
  dataService.subscribe('personnel', (data) => {
    if (data) {
      if (validateData(data, 'personnel')) {
        personnelList.value = data
      } else {
        handleDataError(new Error('Invalid personnel data'), 'personnel')
      }
    }
  })
  
  dataService.subscribe('equipment', (data) => {
    if (data) {
      if (validateData(data, 'equipment')) {
        equipmentList.value = data
      } else {
        handleDataError(new Error('Invalid equipment data'), 'equipment')
      }
    }
  })
  
  dataService.subscribe('safety', (data) => {
    if (data) {
      if (validateData(data, 'safety')) {
        safetyList.value = data
      } else {
        handleDataError(new Error('Invalid safety data'), 'safety')
      }
    }
  })
  
  dataService.subscribe('progress', (data) => {
    if (data) {
      if (validateData(data, 'progress')) {
        progressList.value = data
      } else {
        handleDataError(new Error('Invalid progress data'), 'progress')
      }
    }
  })
  
  dataService.subscribe('materials', (data) => {
    if (data) {
      if (validateData(data, 'materials')) {
        materialList.value = data
      } else {
        handleDataError(new Error('Invalid materials data'), 'materials')
      }
    }
  })
}

onMounted(async () => {
  subscribeToDataChanges();
  subscribeToSyncStatus();
  
  await nextTick();
  isMounted.value = true;
  
  Promise.all([
    loadInitialData(),
    loadWorkflows()
  ]);
  
  setTimeout(() => {
    checkAndCleanInvalidFiles();
  }, 2000);
})

const checkAndCleanInvalidFiles = async () => {
  console.log('[Dashboard] Starting file integrity check...')
  
  try {
    const urlsToCheck = []
    
    excellentPhotos.value.forEach(photo => {
      if (photo.url) urlsToCheck.push(photo.url)
    })
    
    problemPhotos.value.forEach(photo => {
      if (photo.url) urlsToCheck.push(photo.url)
    })
    
    Object.values(blockPhotos.value).forEach(photos => {
      if (Array.isArray(photos)) {
        photos.forEach(photo => {
          if (photo.url) urlsToCheck.push(photo.url)
        })
      }
    })
    
    if (urlsToCheck.length === 0) {
      console.log('[Dashboard] No files to check')
      return
    }
    
    const token = localStorage.getItem('zhihui_site_token')
    const response = await fetch('/api/check-files-exist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ urls: urlsToCheck })
    })
    
    if (!response.ok) {
      console.warn('[Dashboard] File check API failed:', response.status)
      return
    }
    
    const result = await response.json()
    
    if (!result.success || !result.results) {
      return
    }
    
    const invalidUrls = Object.entries(result.results)
      .filter(([url, data]) => !data.exists)
      .map(([url]) => url)
    
    if (invalidUrls.length > 0) {
      console.warn(`[Dashboard] Found ${invalidUrls.length} invalid files, cleaning up...`)
      
      const validExcellent = excellentPhotos.value.filter(photo => 
        !invalidUrls.includes(photo.url)
      )
      if (validExcellent.length !== excellentPhotos.value.length) {
        excellentPhotos.value = validExcellent
        await dataService.set('excellentPhotos', excellentPhotos.value)
        console.log(`[Dashboard] Cleaned ${excellentPhotos.value.length - validExcellent.length} invalid excellent photos`)
      }
      
      const validProblem = problemPhotos.value.filter(photo => 
        !invalidUrls.includes(photo.url)
      )
      if (validProblem.length !== problemPhotos.value.length) {
        problemPhotos.value = validProblem
        await dataService.set('problemPhotos', problemPhotos.value)
        console.log(`[Dashboard] Cleaned ${problemPhotos.value.length - validProblem.length} invalid problem photos`)
      }
      
      let blockPhotosChanged = false
      const newBlockPhotos = { ...blockPhotos.value }
      
      for (const block of Object.keys(newBlockPhotos)) {
        if (Array.isArray(newBlockPhotos[block])) {
          const originalLength = newBlockPhotos[block].length
          newBlockPhotos[block] = newBlockPhotos[block].filter(photo => 
            !invalidUrls.includes(photo.url)
          )
          if (newBlockPhotos[block].length !== originalLength) {
            blockPhotosChanged = true
          }
        }
      }
      
      if (blockPhotosChanged) {
        blockPhotos.value = newBlockPhotos
        await dataService.set('blockPhotos', blockPhotos.value)
        console.log('[Dashboard] Cleaned invalid block photos')
      }
      
      if (invalidUrls.length > 0) {
        ElMessage.warning(`已自动清理 ${invalidUrls.length} 个失效文件记录`)
      }
    } else {
      console.log('[Dashboard] All files are valid ✓')
    }
  } catch (error) {
    console.error('[Dashboard] File integrity check error:', error)
  }
}

onUnmounted(() => {
  syncStatusUnsubscribers.forEach(unsubscribe => {
    if (typeof unsubscribe === 'function') {
      unsubscribe()
    }
  })
  syncStatusUnsubscribers = []
})
</script>

<style scoped>
.dashboard {
  padding: 0;
  position: relative;
  width: 100%;
  max-width: 100%;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease-out;
}

.dashboard.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-status-container {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.sync-status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s ease;
}

.sync-status.idle {
  background: rgba(150, 150, 150, 0.1);
  color: #666;
}

.sync-status.loading,
.sync-status.saving {
  background: rgba(77, 20, 140, 0.1);
  color: var(--future-primary);
  animation: pulse 1.5s ease-in-out infinite;
}

.sync-status.synced {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.sync-status.error {
  background: rgba(245, 63, 63, 0.1);
  color: #F53F3F;
}

.sync-status-label {
  font-weight: 500;
}

.sync-status-text {
  font-weight: 400;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.check-consistency-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(230, 162, 60, 0.1);
  border: 1px solid rgba(230, 162, 60, 0.3);
  color: #E6A23C;
  border-radius: 8px;
}

.check-consistency-button:hover {
  background: rgba(230, 162, 60, 0.2);
  border-color: #E6A23C;
  box-shadow: 0 0 15px rgba(230, 162, 60, 0.3);
  transform: scale(1.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1D2129;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.dashboard-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: var(--future-primary);
  border-radius: 9999px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  backdrop-filter: blur(10px);
  width: fit-content;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #00B42A;
  box-shadow: 0 0 10px rgba(0, 180, 42, 0.4);
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 180, 42, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 20px rgba(0, 180, 42, 0.6);
  }
}

.status-text {
  font-size: 14px;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.reset-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(245, 63, 63, 0.1);
  border: 1px solid rgba(245, 63, 63, 0.3);
  color: #F53F3F;
  border-radius: 8px;
}

.reset-button:hover {
  background: rgba(245, 63, 63, 0.2);
  border-color: #F53F3F;
  box-shadow: 0 0 15px rgba(245, 63, 63, 0.3);
  transform: scale(1.05);
}

.stat-card {
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.15),
    0 2px 12px rgba(102, 0, 153, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(102, 0, 153, 0.05);
  transform-style: preserve-3d;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.35s ease;
  will-change: transform, box-shadow;
  cursor: pointer;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 255, 255, 0.12) 45deg,
    transparent 90deg,
    rgba(255, 255, 255, 0.08) 135deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.06) 225deg,
    transparent 270deg,
    rgba(255, 255, 255, 0.1) 315deg,
    transparent 360deg
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: liquidShimmer 8s linear infinite;
}

@keyframes liquidShimmer {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.stat-card:hover {
  transform:
    translateY(-12px)
    rotateX(6deg)
    rotateY(-3deg)
    scale(1.02);
  box-shadow:
    0 20px 48px rgba(102, 0, 153, 0.25),
    0 8px 24px rgba(102, 0, 153, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(102, 0, 153, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.stat-icon.personnel {
  background: linear-gradient(135deg, #660099 0%, #9933CC 100%);
}

.stat-icon.equipment {
  background: linear-gradient(135deg, #FF6600 0%, #FF8533 100%);
}

.stat-icon.safety {
  background: linear-gradient(135deg, #660099 0%, #9D4EDD 100%);
}

.stat-icon.materials {
  background: linear-gradient(135deg, #00B42A 0%, #23C343 100%);
}

.stat-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(102, 0, 153, 0.35);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1D2129;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.stat-label {
  font-size: 14px;
  color: #4E5969;
  font-weight: 500;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.stat-trend.positive {
  color: #00B42A;
}

.stat-trend.negative {
  color: #F53F3F;
}

.stat-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(77, 20, 140, 0.1);
}

.stat-actions .el-button {
  font-size: 11px;
  padding: 4px 8px;
  transition: all 0.2s ease;
}

.stat-card:hover .stat-value {
  color: var(--future-primary);
  transform: scale(1.05);
}

.progress-comparison-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.2),
    0 2px 12px rgba(102, 0, 153, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(102, 0, 153, 0.05);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-comparison-content {
  padding: 20px;
}

.comparison-legend {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.planned {
  background: linear-gradient(135deg, #909399 0%, #C0C4CC 100%);
}

.legend-color.actual {
}

.legend-label {
  font-size: 14px;
  color: #4E5969;
  font-weight: 500;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.comparison-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-item {
  display: grid;
  grid-template-columns: 90px 1fr 80px;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  transition: all 0.2s ease;
}

.comparison-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(77, 20, 140, 0.2);
  box-shadow: 0 4px 16px rgba(102, 0, 153, 0.1);
}

.comparison-block-label {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.comparison-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comparison-current-node {
  font-size: 11px;
  color: #660099;
  font-weight: 500;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.comparison-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comparison-bar-wrapper {
  position: relative;
  height: 20px;
  background: rgba(245, 247, 250, 0.8);
  border-radius: 10px;
  overflow: hidden;
}

.comparison-bar {
  height: 100%;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  min-width: 40px;
  transition: width 0.5s ease;
}

.comparison-bar.planned {
  background: linear-gradient(90deg, #909399 0%, #C0C4CC 100%);
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.comparison-status {
  display: flex;
  justify-content: center;
  align-items: center;
}

.comparison-status span {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.status-ahead {
  background: rgba(0, 180, 42, 0.15);
  color: #00B42A;
}

.status-ontrack {
  background: rgba(77, 20, 140, 0.1);
  color: var(--future-primary);
}

.status-delay {
  background: rgba(245, 63, 63, 0.1);
  color: #F53F3F;
}

.comparison-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px dashed rgba(77, 20, 140, 0.15);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #1D2129;
  font-weight: 600;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.summary-value.planned {
  color: #909399;
}

.summary-value.actual {
  color: #00B42A;
}

.summary-value.positive {
  color: #00B42A;
}

.summary-value.negative {
  color: #F53F3F;
}

@media (max-width: 768px) {
  .comparison-item {
    grid-template-columns: 70px 1fr 60px;
    gap: 8px;
    padding: 8px 12px;
  }

  .comparison-block-label {
    font-size: 12px;
  }

  .comparison-current-node {
    font-size: 10px;
  }

  .comparison-summary {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .summary-item {
    width: 100%;
    justify-content: space-between;
  }
}

.card-header {
  font-weight: 600;
  font-size: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  position: relative;
}

.card-header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--future-primary);
  border-radius: 9999px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(77, 20, 140, 0.1);
  border: 1px solid rgba(77, 20, 140, 0.3);
  color: var(--future-primary);
  border-radius: 8px;
}

.refresh-button:hover {
  background: rgba(77, 20, 140, 0.2);
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.3);
  transform: scale(1.05);
}

.block-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.2),
    0 2px 12px rgba(102, 0, 153, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(102, 0, 153, 0.05);
  position: relative;
  overflow: visible;
  transform-style: preserve-3d;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 30px;
  margin: 20px 0;
}

.block-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}

.block-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 255, 255, 0.15) 45deg,
    transparent 90deg,
    rgba(255, 255, 255, 0.1) 135deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.08) 225deg,
    transparent 270deg,
    rgba(255, 255, 255, 0.12) 315deg,
    transparent 360deg
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: liquidShimmer 10s linear infinite;
}

.block-container:hover::after {
  opacity: 1;
}

.block-card {
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(35px) saturate(180%);
  -webkit-backdrop-filter: blur(35px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  box-shadow:
    0 12px 48px rgba(102, 0, 153, 0.2),
    0 4px 24px rgba(102, 0, 153, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(102, 0, 153, 0.08);
  transform-style: preserve-3d;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.4s ease;
  will-change: transform, box-shadow;
  position: relative;
}

.block-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.15) 30%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}

.block-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 255, 255, 0.2) 45deg,
    transparent 90deg,
    rgba(255, 255, 255, 0.15) 135deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.1) 225deg,
    transparent 270deg,
    rgba(255, 255, 255, 0.18) 315deg,
    transparent 360deg
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: liquidShimmer 8s linear infinite;
}

.block-card:hover {
  transform:
    translateY(-15px)
    rotateX(8deg)
    rotateY(-4deg)
    scale(1.05);
  box-shadow:
    0 24px 64px rgba(102, 0, 153, 0.3),
    0 12px 32px rgba(102, 0, 153, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    inset 0 -1px 0 rgba(102, 0, 153, 0.12);
  border-color: rgba(255, 255, 255, 0.6);
}

.block-card:hover::after {
  opacity: 1;
}

.block-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  position: relative;
}

.block-label {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 9999px;
  color: white;
  display: inline-block;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.25);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.block-label:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(102, 0, 153, 0.35);
}

.block-stage {
  font-size: 12px;
  color: #86909C;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
}

.block-stage:hover {
  border-color: var(--future-primary);
  box-shadow: 0 0 10px rgba(77, 20, 140, 0.2);
}

.block-A {
  background: linear-gradient(135deg, #660099 0%, #9933CC 100%);
}

.block-B {
  background: linear-gradient(135deg, #FF6600 0%, #FF8533 100%);
}

.block-C {
  background: linear-gradient(135deg, #165DFF 0%, #4080FF 100%);
}

.block-D {
  background: linear-gradient(135deg, #00B42A 0%, #23C343 100%);
}

.block-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px 16px;
  position: relative;
  z-index: 2;
}

.progress-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}

.progress-dashboard .el-progress__text {
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
}

.block-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.info-item:hover {
  background: rgba(255, 255, 255, 1);
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.2);
}

.edit-button {
  align-self: center;
  margin-top: 12px;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border: 1px solid rgba(77, 20, 140, 0.3);
  background: rgba(77, 20, 140, 0.1);
  color: var(--future-primary);
  border-radius: 8px;
}

.edit-button:hover {
  background: rgba(77, 20, 140, 0.2);
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.3);
  transform: scale(1.05);
}

.info-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.15),
    0 2px 12px rgba(102, 0, 153, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(102, 0, 153, 0.05);
  transform-style: preserve-3d;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.35s ease;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.info-card:hover {
  transform:
    translateY(-12px)
    rotateX(6deg)
    rotateY(-3deg)
    scale(1.02);
  box-shadow:
    0 20px 48px rgba(102, 0, 153, 0.25),
    0 8px 24px rgba(102, 0, 153, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(102, 0, 153, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

.info-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.workflow-overview {
  flex: 1;
}

.data-table {
  border-radius: 8px;
  overflow: hidden;
}

.no-workflows {
  padding: 40px 0;
}

.monitor-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 24px;
  position: relative;
  align-content: center;
}

.monitor-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(245, 247, 250, 0.9);
  border: 1px solid rgba(77, 20, 140, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
}

.monitor-item:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--future-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.25);
}

.monitor-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  color: white;
}

.monitor-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(102, 0, 153, 0.35);
}

.monitor-icon.personnel {
  background: linear-gradient(135deg, #660099 0%, #9933CC 100%);
}

.monitor-icon.equipment {
  background: linear-gradient(135deg, #FF6600 0%, #FF8533 100%);
}

.monitor-icon.safety {
  background: linear-gradient(135deg, #660099 0%, #9D4EDD 100%);
}

.monitor-icon.materials {
  background: linear-gradient(135deg, #00B42A 0%, #23C343 100%);
}

.monitor-label {
  font-size: 14px;
  color: #4E5969;
  font-weight: 500;
  margin-bottom: 8px;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.monitor-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--future-primary);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.custom-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.98);
  --el-dialog-border-color: rgba(77, 20, 140, 0.2);
  --el-dialog-header-bg-color: rgba(245, 247, 250, 0.95);
  --el-dialog-title-color: #1D2129;
  border-radius: 12px;
  backdrop-filter: blur(25px);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.35);
  overflow: hidden;
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
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: 8px;
  color: #1D2129;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.custom-input:focus {
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.3);
  background: rgba(255, 255, 255, 1);
}

.custom-slider .el-slider__bar {
  background: var(--future-primary);
}

.custom-slider .el-slider__button {
  border-color: var(--future-primary);
}

.cancel-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(245, 247, 250, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.2);
  color: #4E5969;
  border-radius: 8px;
}

.cancel-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
  color: var(--future-primary);
}

.confirm-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: var(--future-primary);
  border: 1px solid var(--future-primary);
  color: white;
  border-radius: 8px;
}

.confirm-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
  box-shadow: 0 0 20px rgba(77, 20, 140, 0.4);
  transform: scale(1.05);
}

.dashboard-header {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@media (max-width: 1200px) {
  .dashboard-header {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin: 0;
    border-width: 0;
  }

  .monitor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }

  .stat-value {
    font-size: 24px;
  }

  .monitor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .monitor-item {
    padding: 16px;
  }

  .monitor-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .monitor-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .dashboard-header h2 {
    font-size: 20px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .monitor-grid {
    grid-template-columns: 1fr;
  }

  .monitor-item {
    padding: 12px;
  }

  .monitor-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .monitor-value {
    font-size: 18px;
  }
}

.photo-gallery {
  min-height: 200px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.block-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1400px) {
  .block-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1100px) {
  .block-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .block-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .block-grid {
    grid-template-columns: 1fr;
  }
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.photo-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(102, 0, 153, 0.2);
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 50%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-top: auto;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(245, 247, 250, 0.8);
}

.upload-placeholder:hover {
  border-color: var(--future-primary);
  background: rgba(102, 0, 153, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: #ccc;
  transition: color 0.3s ease;
}

.upload-placeholder:hover .upload-icon {
  color: var(--future-primary);
}

.photo-preview {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
}

@media (max-width: 1200px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.block-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.add-photo-button {
  flex: 1;
}

.block-photos {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.photo-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.photo-list::-webkit-scrollbar {
  height: 4px;
}

.photo-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.photo-list::-webkit-scrollbar-thumb {
  background: rgba(102, 0, 153, 0.3);
  border-radius: 2px;
}

.block-photo {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.block-photo:hover {
  transform: scale(1.1);
  border-color: rgba(102, 0, 153, 0.6);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.3);
}

.block-photo-item {
  position: relative;
  display: inline-block;
}

.block-photo-delete-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px !important;
  height: 20px !important;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.block-photo-item:hover .block-photo-delete-btn {
  opacity: 1;
}

@media (max-width: 480px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>