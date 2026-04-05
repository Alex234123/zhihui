<template>
  <div class="equipment-management">
    <div class="page-header">
      <div class="header-left">
        <h2>设备管理</h2>
      </div>
      <div class="header-actions">
        <el-button 
          v-if="hasEditPermission" 
          type="primary" 
          @click="openDialog" 
          class="add-button"
        >
          <el-icon><Plus /></el-icon>
          添加设备
        </el-button>
        <el-button 
          v-if="hasViewPermission" 
          @click="exportEquipment" 
          class="export-button"
        >
          <el-icon><Download /></el-icon>
          导出设备
        </el-button>
        <el-button 
          v-if="hasEditPermission" 
          @click="openImportDialog" 
          class="import-button"
        >
          <el-icon><Upload /></el-icon>
          导入设备
        </el-button>
      </div>
    </div>
    
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索设备名称、编号或负责人"
        prefix-icon="Search"
        class="search-input"
        @input="handleSearch"
      />
      <div class="filter-row">
        <el-select
          v-model="statusFilter"
          placeholder="按状态筛选"
          class="filter-select"
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="正常" value="正常" />
          <el-option label="维修中" value="维修中" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          class="filter-select"
          @change="handleSort"
        >
          <el-option label="按编号" value="id" />
          <el-option label="按名称" value="name" />
          <el-option label="按采购日期" value="purchaseDate" />
        </el-select>
        <el-select
          v-model="sortOrder"
          placeholder="排序顺序"
          class="filter-select"
          @change="handleSort"
        >
          <el-option label="升序" value="asc" />
          <el-option label="降序" value="desc" />
        </el-select>
      </div>
    </div>
    
    <div class="equipment-card">
      <div class="card-content">
        <el-table :data="filteredEquipmentList" class="equipment-table">
          <el-table-column prop="id" label="设备编号" width="120" />
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="type" label="设备类型" />
          <el-table-column prop="model" label="型号规格" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :class="getTagClass(row.status)">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="负责人" />
          <el-table-column prop="purchaseDate" label="采购日期" />
          <el-table-column prop="entryDate" label="进场日期" />
          <el-table-column prop="exitDate" label="退场日期" />
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewEquipment(row)" class="view-button">详情</el-button>
              <el-button 
                v-if="hasEditPermission" 
                size="small" 
                @click="editEquipment(row)" 
                class="edit-button"
              >编辑</el-button>
              <el-button 
                v-if="isAdmin" 
                size="small" 
                type="danger" 
                @click="deleteEquipment(row)" 
                class="delete-button"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '添加设备'"
      width="600px"
      class="custom-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="custom-form">
        <el-form-item label="设备编号" prop="id" class="form-item">
          <el-input v-model="form.id" placeholder="请输入设备编号" :disabled="isEdit" class="form-input" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name" class="form-item">
          <el-input v-model="form.name" placeholder="请输入设备名称" class="form-input" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type" class="form-item">
          <el-input v-model="form.type" placeholder="请输入设备类型" class="form-input" />
        </el-form-item>
        <el-form-item label="型号规格" prop="model" class="form-item">
          <el-input v-model="form.model" placeholder="请输入型号规格" class="form-input" />
        </el-form-item>
        <el-form-item label="状态" prop="status" class="form-item">
          <el-select v-model="form.status" placeholder="请选择状态" class="form-input">
            <el-option label="正常" value="正常" />
            <el-option label="维修中" value="维修中" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="operator" class="form-item">
          <el-input v-model="form.operator" placeholder="请输入负责人" class="form-input" />
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate" class="form-item">
          <el-date-picker
            v-model="form.purchaseDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="进场日期" prop="entryDate" class="form-item">
          <el-date-picker
            v-model="form.entryDate"
            type="date"
            placeholder="选择进场日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="退场日期" prop="exitDate" class="form-item">
          <el-date-picker
            v-model="form.exitDate"
            type="date"
            placeholder="选择退场日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="设备照片" class="form-item">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handlePhotoUpload"
            :on-remove="handlePhotoRemove"
            accept="image/*"
            multiple
            class="photo-upload"
          >
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              选择照片
            </el-button>
          </el-upload>
          <div v-if="form.photos && form.photos.length > 0" class="photo-preview-list">
            <el-image
              v-for="(photo, idx) in form.photos"
              :key="idx"
              :src="photo.url"
              :preview-src-list="form.photos.map(p => p.url)"
              :initial-index="idx"
              fit="cover"
              class="form-photo"
            />
          </div>
        </el-form-item>
        <el-form-item label="设备描述" prop="description" class="form-item">
          <el-input
            v-model="form.description"
            placeholder="请输入设备描述"
            type="textarea"
            rows="3"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="使用部门" prop="department" class="form-item">
          <el-input v-model="form.department" placeholder="请输入使用部门" class="form-input" />
        </el-form-item>
        <el-form-item label="维护周期(天)" prop="maintenanceCycle" class="form-item">
          <el-input v-model="form.maintenanceCycle" placeholder="请输入维护周期" class="form-input" />
        </el-form-item>
        <el-form-item label="上次维护日期" prop="lastMaintenanceDate" class="form-item">
          <el-date-picker
            v-model="form.lastMaintenanceDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="下次维护日期" prop="nextMaintenanceDate" class="form-item">
          <el-date-picker
            v-model="form.nextMaintenanceDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="submitForm" class="confirm-button">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="viewDialogVisible"
      title="设备详情"
      width="600px"
      class="custom-dialog"
    >
      <div class="equipment-details">
        <div class="detail-row">
          <span class="detail-label">设备编号:</span>
          <span class="detail-value">{{ viewForm.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">设备名称:</span>
          <span class="detail-value">{{ viewForm.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">设备类型:</span>
          <span class="detail-value">{{ viewForm.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">型号规格:</span>
          <span class="detail-value">{{ viewForm.model }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态:</span>
          <el-tag :class="getTagClass(viewForm.status)">{{ viewForm.status }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">负责人:</span>
          <span class="detail-value">{{ viewForm.operator }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">采购日期:</span>
          <span class="detail-value">{{ viewForm.purchaseDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">进场日期:</span>
          <span class="detail-value">{{ viewForm.entryDate || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">退场日期:</span>
          <span class="detail-value">{{ viewForm.exitDate || '未设置' }}</span>
        </div>
        <div v-if="viewForm.photos && viewForm.photos.length > 0" class="detail-row">
          <span class="detail-label">设备照片:</span>
          <div class="detail-photos">
            <el-image
              v-for="(photo, idx) in viewForm.photos"
              :key="idx"
              :src="photo.url"
              :preview-src-list="viewForm.photos.map(p => p.url)"
              :initial-index="idx"
              fit="cover"
              class="detail-photo"
            />
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">使用部门:</span>
          <span class="detail-value">{{ viewForm.department || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">维护周期:</span>
          <span class="detail-value">{{ viewForm.maintenanceCycle || '未设置' }} 天</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">上次维护日期:</span>
          <span class="detail-value">{{ viewForm.lastMaintenanceDate || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">下次维护日期:</span>
          <span class="detail-value">{{ viewForm.nextMaintenanceDate || '未设置' }}</span>
        </div>
        <div class="detail-row detail-description">
          <span class="detail-label">设备描述:</span>
          <span class="detail-value">{{ viewForm.description || '未设置' }}</span>
        </div>
        <div class="detail-section">
          <h3 class="section-title">相关巡检记录</h3>
          <div v-if="relatedSafetyInspections.length > 0" class="safety-inspections-list">
            <el-table :data="relatedSafetyInspections" class="safety-inspections-table">
              <el-table-column prop="id" label="巡检编号" width="120" />
              <el-table-column prop="inspector" label="巡检人" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :class="getSafetyStatusClass(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="inspectionDate" label="巡检日期" />
            </el-table>
          </div>
          <div v-else class="no-inspections">
            暂无相关巡检记录
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false" class="cancel-button">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      title="导入设备"
      width="500px"
      class="custom-dialog"
    >
      <div class="import-section">
        <el-upload
          class="upload-demo"
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".json,.csv"
        >
          <el-button type="primary" class="upload-button">
            <el-icon><Upload /></el-icon>
            选择文件
          </el-button>
        </el-upload>
        <div v-if="importFile" class="file-info">
          <el-icon><Document /></el-icon>
          {{ importFile.name }}
        </div>
        <div class="import-tips">
          <p>支持导入 JSON 或 CSV 格式的设备数据文件</p>
          <p>请确保文件格式正确，包含必要的设备字段</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false" class="cancel-button">取消</el-button>
        <el-button 
          type="primary" 
          @click="importEquipment" 
          :disabled="!importFile" 
          class="confirm-button"
        >
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import dataService from '../services/dataService'
import { uploadApi } from '../api/api'

const safetyList = ref([])

const equipmentList = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const viewForm = reactive({})

const viewEquipment = (row) => {
  Object.assign(viewForm, row)
  viewDialogVisible.value = true
}

// 导入/导出相关
const importDialogVisible = ref(false)
const importFile = ref(null)

// 打开导入对话框
const openImportDialog = () => {
  importFile.value = null
  importDialogVisible.value = true
}

// 处理文件选择
const handleFileChange = (file) => {
  importFile.value = file.raw
}

// 导入设备数据
const importEquipment = async () => {
  if (!importFile.value) return
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let importedData
        const fileExtension = importFile.value.name.split('.').pop().toLowerCase()
        
        if (fileExtension === 'json') {
          importedData = JSON.parse(e.target.result)
        } else if (fileExtension === 'csv') {
          importedData = parseCSV(e.target.result)
        } else {
          ElMessage.error('不支持的文件格式')
          return
        }
        
        if (Array.isArray(importedData)) {
          // 验证导入的数据格式
          const validData = importedData.filter(item => item.id && item.name && item.status)
          
          if (validData.length > 0) {
            // 合并数据
            const existingIds = new Set(equipmentList.value.map(item => item.id))
            const newEquipment = validData.filter(item => !existingIds.has(item.id))
            
            equipmentList.value = [...equipmentList.value, ...newEquipment]
            await dataService.set('equipment', equipmentList.value)
            
            // 记录操作日志
            const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
            await dataService.addLog('info', `${currentUserName}导入了${newEquipment.length}台设备`)
            
            ElMessage.success(`成功导入${newEquipment.length}台设备`)
            importDialogVisible.value = false
          } else {
            ElMessage.error('没有有效的设备数据')
          }
        } else {
          ElMessage.error('无效的数据格式')
        }
      } catch (error) {
        console.error('解析文件失败:', error)
        ElMessage.error('解析文件失败，请检查文件格式')
      }
    }
    reader.onerror = () => {
      ElMessage.error('读取文件失败')
    }
    reader.readAsText(importFile.value)
  } catch (error) {
    console.error('导入设备失败:', error)
    ElMessage.error('导入失败，请重试')
  }
}

// 解析CSV文件
const parseCSV = (csvText) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(header => header.trim())
  const result = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim())
    if (values.length === headers.length) {
      const item = {}
      headers.forEach((header, index) => {
        item[header] = values[index]
      })
      result.push(item)
    }
  }
  
  return result
}

// 导出设备数据
const exportEquipment = async () => {
  try {
    // 准备导出数据
    const exportData = equipmentList.value
    
    // 转换为JSON格式
    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = `equipment_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    
    // 记录操作日志
    const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
    await dataService.addLog('info', `${currentUserName}导出了设备数据`)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出设备失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 获取与当前设备相关的安全巡检记录
const relatedSafetyInspections = computed(() => {
  if (!viewForm.id) return []
  return safetyList.value.filter(item => 
    item.equipmentIds && item.equipmentIds.includes(viewForm.id)
  )
})

// 获取安全巡检状态的样式类
const getSafetyStatusClass = (status) => {
  return status === '正常' ? 'status-tag success-tag' : 'status-tag danger-tag'
}

// 搜索和筛选相关
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('id')
const sortOrder = ref('asc')
const filteredEquipmentList = computed(() => {
  let result = [...equipmentList.value]
  
  // 搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.operator.toLowerCase().includes(query)
    )
  }
  
  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value)
  }
  
  // 排序
  result.sort((a, b) => {
    let aValue = a[sortBy.value]
    let bValue = b[sortBy.value]
    
    // 处理日期类型
    if (sortBy.value === 'purchaseDate') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// 检查当前用户是否是管理员
const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

// 检查当前用户是否有编辑权限
const hasEditPermission = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  const userRole = localStorage.getItem('zhihui_site_role')
  // 管理员或设备管理员有编辑权限
  return isAdmin.value || userRole === 'equipment_admin'
})

// 检查当前用户是否有查看权限
const hasViewPermission = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  // 所有登录用户都有查看权限
  return !!userId
})

// 检查用户是否有未处理的申请
const hasPendingApplication = ref(false)

// 检查未处理的申请
const checkPendingApplication = async () => {
  const currentUserId = localStorage.getItem('zhihui_site_userid')
  const workflows = await dataService.get('workflow', [])
  hasPendingApplication.value = workflows.some(item => 
    item.submitter === currentUserId && 
    (item.status === '待处理' || item.status === '处理中')
  )
}

const tempPhotos = ref([])

const form = reactive({
  id: '',
  name: '',
  type: '',
  model: '',
  status: '正常',
  operator: '',
  purchaseDate: '',
  entryDate: '',
  exitDate: '',
  photos: [],
  description: '',
  department: '',
  maintenanceCycle: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: ''
})

const rules = {
  id: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  maintenanceCycle: [{ pattern: /^\d+$/, message: '请输入数字', trigger: 'blur' }]
}

const loadData = async () => {
  equipmentList.value = await dataService.get('equipment', [])
  safetyList.value = await dataService.get('safety', [])
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const handleFilter = () => {
  // 筛选逻辑已在computed中处理
}

const handleSort = () => {
  // 排序逻辑已在computed中处理
}

const handlePhotoUpload = async (file) => {
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const filename = file.name || 'photo.jpg'
        const uploadResult = await uploadApi.uploadImage(e.target.result, filename)
        tempPhotos.value.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          url: uploadResult.url,
          name: filename
        })
        form.photos = [...tempPhotos.value]
      } catch (error) {
        console.error('上传照片失败:', error)
        ElMessage.error('上传照片失败，请重试')
      }
    }
    reader.readAsDataURL(file.raw)
  } catch (error) {
    console.error('处理照片失败:', error)
    ElMessage.error('处理照片失败，请重试')
  }
}

const handlePhotoRemove = (file) => {
  tempPhotos.value = tempPhotos.value.filter(p => p.name !== file.name)
  form.photos = [...tempPhotos.value]
}

const openDialog = () => {
  isEdit.value = false
  currentId.value = null
  tempPhotos.value = []
  Object.assign(form, {
    id: '',
    name: '',
    type: '',
    model: '',
    status: '正常',
    operator: '',
    purchaseDate: '',
    entryDate: '',
    exitDate: '',
    photos: [],
    description: '',
    department: '',
    maintenanceCycle: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: ''
  })
  dialogVisible.value = true
}

const editEquipment = (row) => {
  isEdit.value = true
  currentId.value = row.id
  tempPhotos.value = row.photos ? [...row.photos] : []
  Object.assign(form, row)
  dialogVisible.value = true
}

const deleteEquipment = async (row) => {
  if (isAdmin.value) {
    // 管理员直接删除
    ElMessageBox.confirm('确定要删除该设备信息吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const index = equipmentList.value.findIndex(item => item.id === row.id)
        if (index > -1) {
          equipmentList.value.splice(index, 1)
          await dataService.set('equipment', equipmentList.value)
          // 记录操作日志
          await dataService.addLog('info', `管理员删除了设备: ${row.name} (编号: ${row.id})`)
          ElMessage.success('删除成功')
        }
      } catch (error) {
        console.error('删除设备失败:', error)
        ElMessage.error('删除失败，请重试')
      }
    }).catch(() => {})
  } else {
    // 普通用户和设备管理员提交申请
    await checkPendingApplication()
    if (hasPendingApplication.value) {
      ElMessage.warning('您有未处理的申请，请等待管理员处理后再提交新的申请')
      return
    }
    
    ElMessageBox.confirm('确定要提交删除申请吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const currentUserId = localStorage.getItem('zhihui_site_userid')
        const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
        
        // 创建工作流申请
        const newWorkflow = {
          id: 'WF' + Date.now().toString(36).toUpperCase(),
          submitter: currentUserId,
          submitterName: currentUserName,
          submitTime: new Date().toLocaleString('zh-CN'),
          type: '设备删除申请',
          status: '待处理',
          targetId: row.id,
          targetName: row.name,
          estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN'), // 30分钟后
          remark: `申请删除设备: ${row.name} (编号: ${row.id})`
        }
        
        // 保存到工作流
        const workflows = await dataService.get('workflow', [])
        workflows.push(newWorkflow)
        await dataService.set('workflow', workflows)
        
        // 记录操作日志
        await dataService.addLog('info', `${currentUserName}提交了设备删除申请: ${row.name} (编号: ${row.id})`)
        
        ElMessage.success('申请提交成功，请等待管理员处理')
      } catch (error) {
        console.error('提交删除申请失败:', error)
        ElMessage.error('提交申请失败，请重试')
      }
    }).catch(() => {})
  }
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        form.photos = [...tempPhotos.value]
        
        if (isEdit.value) {
          const index = equipmentList.value.findIndex(item => item.id === currentId.value)
          if (index > -1) {
            const oldEquipment = { ...equipmentList.value[index] }
            equipmentList.value[index] = { ...form }
            await dataService.set('equipment', equipmentList.value)
            // 记录操作日志
            const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
            await dataService.addLog('info', `${currentUserName}编辑了设备: ${form.name} (编号: ${form.id})`)
            dialogVisible.value = false
            ElMessage.success('编辑成功')
          }
        } else {
          form.id = dataService.generateId()
          equipmentList.value.push({ ...form })
          await dataService.set('equipment', equipmentList.value)
          // 记录操作日志
          const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
          await dataService.addLog('info', `${currentUserName}添加了新设备: ${form.name} (编号: ${form.id})`)
          dialogVisible.value = false
          ElMessage.success('添加成功')
        }
      } catch (error) {
        console.error('保存设备失败:', error)
        ElMessage.error('保存失败，请重试')
      }
    }
  })
}

const getTagClass = (status) => {
  switch (status) {
    case '正常':
      return 'status-tag success-tag'
    case '维修中':
      return 'status-tag warning-tag'
    case '停用':
      return 'status-tag danger-tag'
    default:
      return 'status-tag'
  }
}

onMounted(async () => {
  loadData()
  await checkPendingApplication()
})

// 接收action参数
const props = defineProps({
  action: {
    type: String,
    default: ''
  }
})

// 监听action变化，自动打开添加表单
watch(() => props.action, (newAction) => {
  if (newAction === 'add') {
    openDialog()
  }
}, { immediate: true })
</script>

<style scoped>
.equipment-management {
  padding: 0;
  position: relative;
  width: 100%;
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1D2129;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.page-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: var(--future-primary);
  border-radius: 9999px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-filter-section {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
}

.equipment-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.12),
    0 2px 12px rgba(102, 0, 153, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.card-content {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.equipment-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  overflow: hidden;
}

.equipment-table th {
  background: rgba(245, 247, 250, 0.9) !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
}

.equipment-table td {
  background: rgba(255, 255, 255, 0.7) !important;
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-bottom: 1px solid rgba(77, 20, 140, 0.05) !important;
  transition: all 0.2s ease;
}

.equipment-table tr:hover td {
  background: rgba(245, 247, 250, 0.9) !important;
  color: #1D2129 !important;
  border-bottom-color: var(--future-primary) !important;
}

.status-tag {
  border-radius: 9999px !important;
  padding: 2px 12px !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease !important;
}

.success-tag {
  background: rgba(103, 194, 58, 0.1) !important;
  color: #00B42A !important;
  border-color: rgba(103, 194, 58, 0.3) !important;
}

.warning-tag {
  background: rgba(230, 162, 60, 0.1) !important;
  color: #FF7D00 !important;
  border-color: rgba(230, 162, 60, 0.3) !important;
}

.danger-tag {
  background: rgba(255, 82, 82, 0.1) !important;
  color: #F53F3F !important;
  border-color: rgba(255, 82, 82, 0.3) !important;
}

.view-button,
.edit-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  border: 1px solid rgba(77, 20, 140, 0.2);
  background: rgba(77, 20, 140, 0.05);
  color: var(--future-primary);
  border-radius: 8px;
  margin-right: 8px;
  padding: 4px 12px;
  font-size: 12px;
}

.view-button:hover,
.edit-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
  color: var(--future-primary);
  box-shadow: 0 0 10px rgba(77, 20, 140, 0.2);
}

.delete-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  border: 1px solid rgba(245, 63, 63, 0.2);
  background: rgba(245, 63, 63, 0.05);
  color: #F53F3F;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
}

.delete-button:hover {
  background: rgba(245, 63, 63, 0.1);
  border-color: #F53F3F;
  box-shadow: 0 0 10px rgba(245, 63, 63, 0.2);
}

.add-button,
.export-button,
.import-button,
.upload-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  background: rgba(77, 20, 140, 0.1);
  border: 1px solid rgba(77, 20, 140, 0.3);
  color: var(--future-primary);
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-button:hover,
.export-button:hover,
.import-button:hover,
.upload-button:hover {
  background: rgba(77, 20, 140, 0.2);
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.3);
  transform: scale(1.05);
}

.add-button {
  background: var(--future-primary);
  color: white;
  border-color: var(--future-primary);
}

.add-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
}

.equipment-details {
  padding: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
}

.detail-label {
  width: 120px;
  font-weight: 500;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  margin-right: 12px;
}

.detail-value {
  flex: 1;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  line-height: 1.4;
}

.detail-description {
  align-items: flex-start;
}

.detail-description .detail-value {
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(77, 20, 140, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 16px;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: var(--future-primary);
  border-radius: 9999px;
}

.safety-inspections-list {
  margin-top: 8px;
}

.safety-inspections-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.safety-inspections-table th {
  background: rgba(245, 247, 250, 0.9) !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
  font-size: 12px;
  padding: 8px 12px !important;
}

.safety-inspections-table td {
  background: rgba(255, 255, 255, 0.7) !important;
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-bottom: 1px solid rgba(77, 20, 140, 0.05) !important;
  transition: all 0.2s ease;
  font-size: 12px;
  padding: 8px 12px !important;
}

.safety-inspections-table tr:hover td {
  background: rgba(245, 247, 250, 0.9) !important;
  color: #1D2129 !important;
  border-bottom-color: var(--future-primary) !important;
}

.no-inspections {
  text-align: center;
  padding: 24px;
  color: #86909C;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-style: italic;
}

.import-section {
  padding: 16px;
}

.file-info {
  margin-top: 16px;
  padding: 8px 12px;
  background: rgba(245, 247, 250, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.1);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-tips {
  margin-top: 16px;
  padding: 8px 12px;
  background: rgba(245, 247, 250, 0.95);
  border: 1px solid rgba(230, 162, 60, 0.3);
  border-radius: 8px;
  color: #86909C;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

.import-tips p {
  margin: 0 0 4px 0;
}

.import-tips p:last-child {
  margin-bottom: 0;
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

.custom-form {
  padding: 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item .el-form-item__label {
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 500;
}

.form-input {
  width: 100%;
  background: rgba(245, 247, 250, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: 8px;
  color: #1D2129;
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.form-input:hover {
  border-color: rgba(77, 20, 140, 0.4);
  box-shadow: 0 0 10px rgba(77, 20, 140, 0.1);
}

.form-input:focus {
  border-color: var(--future-primary);
  box-shadow: 0 0 15px rgba(77, 20, 140, 0.3);
  background: rgba(255, 255, 255, 1);
}

.form-input .el-input__wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 8px !important;
}

.form-input .el-input__inner {
  background: transparent !important;
  border: none !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.cancel-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  border: 1px solid rgba(77, 20, 140, 0.2);
  background: rgba(245, 247, 250, 0.95);
  color: #4E5969;
  border-radius: 8px;
  margin-right: 8px;
  padding: 8px 16px;
}

.cancel-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
  color: var(--future-primary);
  box-shadow: 0 0 10px rgba(77, 20, 140, 0.2);
}

.confirm-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
  background: var(--future-primary);
  border: 1px solid var(--future-primary);
  color: white;
  border-radius: 8px;
  padding: 8px 16px;
}

.confirm-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
  box-shadow: 0 0 20px rgba(77, 20, 140, 0.4);
  transform: scale(1.05);
}

@media (max-width: 1200px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .custom-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .equipment-table {
    font-size: 12px;
  }
  
  .view-button,
  .edit-button,
  .delete-button {
    font-size: 11px;
    padding: 2px 8px;
  }
  
  .form-item .el-form-item__label {
    font-size: 12px;
  }
  
  .form-input {
    font-size: 12px;
  }
  
  .cancel-button,
  .confirm-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}

/* 设备照片相关样式 */
.photo-upload {
  width: 100%;
}

.photo-preview-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.form-photo {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid rgba(77, 20, 140, 0.2);
  transition: all 0.2s ease;
}

.form-photo:hover {
  transform: scale(1.05);
  border-color: rgba(77, 20, 140, 0.5);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}

.detail-photos {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-photo {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid rgba(77, 20, 140, 0.2);
  transition: all 0.2s ease;
}

.detail-photo:hover {
  transform: scale(1.05);
  border-color: rgba(77, 20, 140, 0.5);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}
</style>
