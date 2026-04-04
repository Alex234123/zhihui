<template>
  <div class="quality-management">
    <div class="page-header">
      <h2>工程质量</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openDialog" class="add-button">
          <el-icon><Plus /></el-icon>
          添加质量记录
        </el-button>
        <el-button type="danger" @click="batchDelete" :disabled="selectedRows.length === 0" class="batch-delete-button">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>
    
    <div class="quality-card">
      <div class="card-header">
        <div class="filters">
          <el-input v-model="searchKeyword" placeholder="搜索质量记录" class="search-input" prefix-icon="Search" />
          <el-select v-model="statusFilter" placeholder="按状态筛选" class="status-filter">
            <el-option label="全部" value="" />
            <el-option label="优秀" value="优秀" />
            <el-option label="合格" value="合格" />
            <el-option label="不合格" value="不合格" />
            <el-option label="已整改" value="已整改" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="按类型筛选" class="type-filter">
            <el-option label="全部" value="" />
            <el-option label="优秀案例" value="优秀案例" />
            <el-option label="问题记录" value="问题记录" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-filter"
          />
        </div>
        <div class="sorting">
          <el-select v-model="sortField" placeholder="排序字段" class="sort-field">
            <el-option label="记录日期" value="recordDate" />
            <el-option label="记录编号" value="id" />
            <el-option label="负责人" value="person" />
          </el-select>
          <el-select v-model="sortOrder" placeholder="排序方式" class="sort-order">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </div>
      </div>
      <div class="card-content">
        <el-table 
          :data="filteredAndSortedList" 
          class="quality-table"
          @selection-change="handleSelectionChange"
          row-key="id"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="记录编号" width="120" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.type === '优秀案例' ? 'success' : 'warning'" size="small">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="person" label="负责人" width="120" />
          <el-table-column prop="department" label="所属部门" width="150" />
          <el-table-column prop="task" label="任务/事项" show-overflow-tooltip />
          <el-table-column prop="result" label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="getResultTagType(row.result)" size="small">
                {{ row.result }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="recordDate" label="记录日期" width="120" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row)" class="view-button">详情</el-button>
              <el-button size="small" @click="editQuality(row)" class="edit-button">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteQuality(row)" class="delete-button">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑质量记录' : '添加质量记录'"
      width="700px"
      class="quality-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="quality-form">
        <el-form-item label="记录编号" prop="id" class="form-item">
          <el-input v-model="form.id" placeholder="自动生成或手动输入" :disabled="isEdit" class="form-input" />
        </el-form-item>
        <el-form-item label="类型" prop="type" class="form-item">
          <el-radio-group v-model="form.type" class="radio-group">
            <el-radio label="优秀案例" class="radio-item">优秀案例</el-radio>
            <el-radio label="问题记录" class="radio-item">问题记录</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="负责人" prop="person" class="form-item">
          <el-input v-model="form.person" placeholder="请输入负责人姓名" class="form-input" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department" class="form-item">
          <el-input v-model="form.department" placeholder="请输入所属部门" class="form-input" />
        </el-form-item>
        <el-form-item label="任务/事项" prop="task" class="form-item">
          <el-input
            v-model="form.task"
            type="textarea"
            :rows="3"
            placeholder="请描述任务或事项的具体内容"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="结果" prop="result" class="form-item">
          <el-radio-group v-model="form.result" class="radio-group">
            <el-radio label="优秀" class="radio-item">优秀</el-radio>
            <el-radio label="合格" class="radio-item">合格</el-radio>
            <el-radio label="不合格" class="radio-item">不合格</el-radio>
            <el-radio label="已整改" class="radio-item">已整改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理/整改措施" prop="treatment" class="form-item">
          <el-input
            v-model="form.treatment"
            type="textarea"
            :rows="3"
            placeholder="如果结果不合格，请描述处理或整改措施"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="记录日期" prop="recordDate" class="form-item">
          <el-date-picker
            v-model="form.recordDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="上传照片" class="form-item">
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
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="confirm-button" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="质量记录详情"
      width="700px"
      class="detail-dialog"
    >
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-item">
          <span class="detail-label">记录编号：</span>
          <span class="detail-value">{{ currentRecord.id }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">类型：</span>
          <el-tag :type="currentRecord.type === '优秀案例' ? 'success' : 'warning'" size="small">
            {{ currentRecord.type }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="detail-label">负责人：</span>
          <span class="detail-value">{{ currentRecord.person }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">所属部门：</span>
          <span class="detail-value">{{ currentRecord.department }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">任务/事项：</span>
          <div class="detail-text">{{ currentRecord.task }}</div>
        </div>
        <div class="detail-item">
          <span class="detail-label">结果：</span>
          <el-tag :type="getResultTagType(currentRecord.result)" size="small">
            {{ currentRecord.result }}
          </el-tag>
        </div>
        <div v-if="currentRecord.treatment" class="detail-item">
          <span class="detail-label">处理/整改措施：</span>
          <div class="detail-text">{{ currentRecord.treatment }}</div>
        </div>
        <div class="detail-item">
          <span class="detail-label">记录日期：</span>
          <span class="detail-value">{{ currentRecord.recordDate }}</span>
        </div>
        <div v-if="currentRecord.photos && currentRecord.photos.length > 0" class="detail-item">
          <span class="detail-label">照片：</span>
          <div class="detail-photos">
            <el-image
              v-for="(photo, idx) in currentRecord.photos"
              :key="idx"
              :src="photo.url"
              :preview-src-list="currentRecord.photos.map(p => p.url)"
              :initial-index="idx"
              fit="cover"
              class="detail-photo"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button class="cancel-button" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search } from '@element-plus/icons-vue'
import dataService from '../services/dataService'
import { uploadApi } from '../api/api'

const searchKeyword = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const dateRange = ref(null)
const sortField = ref('recordDate')
const sortOrder = ref('desc')
const selectedRows = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentRecord = ref(null)
const tempPhotos = ref([])

const qualityList = ref([])

const form = ref({
  id: '',
  type: '优秀案例',
  person: '',
  department: '',
  task: '',
  result: '合格',
  treatment: '',
  recordDate: '',
  photos: []
})

const rules = {
  id: [{ required: true, message: '请输入记录编号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  person: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
  department: [{ required: true, message: '请输入所属部门', trigger: 'blur' }],
  task: [{ required: true, message: '请输入任务/事项', trigger: 'blur' }],
  result: [{ required: true, message: '请选择结果', trigger: 'change' }],
  recordDate: [{ required: true, message: '请选择记录日期', trigger: 'change' }]
}

const filteredAndSortedList = computed(() => {
  let result = [...qualityList.value]
  
  if (searchKeyword.value) {
    result = result.filter(item => 
      item.id?.includes(searchKeyword.value) ||
      item.person?.includes(searchKeyword.value) ||
      item.department?.includes(searchKeyword.value) ||
      item.task?.includes(searchKeyword.value)
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(item => item.result === statusFilter.value)
  }
  
  if (typeFilter.value) {
    result = result.filter(item => item.type === typeFilter.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(item => {
      if (!item.recordDate) return false
      return item.recordDate >= start && item.recordDate <= end
    })
  }
  
  result.sort((a, b) => {
    const aVal = a[sortField.value] || ''
    const bVal = b[sortField.value] || ''
    const comparison = aVal.localeCompare(bVal)
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const getResultTagType = (result) => {
  switch (result) {
    case '优秀':
      return 'success'
    case '合格':
      return ''
    case '不合格':
      return 'danger'
    case '已整改':
      return 'warning'
    default:
      return ''
  }
}

const openDialog = () => {
  isEdit.value = false
  form.value = {
    id: Date.now().toString(36),
    type: '优秀案例',
    person: '',
    department: '',
    task: '',
    result: '合格',
    treatment: '',
    recordDate: new Date().toISOString().split('T')[0],
    photos: []
  }
  tempPhotos.value = []
  dialogVisible.value = true
}

const editQuality = (row) => {
  isEdit.value = true
  form.value = { ...row }
  tempPhotos.value = row.photos ? [...row.photos] : []
  dialogVisible.value = true
}

const viewDetail = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

const handlePhotoUpload = (file) => {
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
      form.value.photos = [...tempPhotos.value]
    } catch (error) {
      console.error('上传照片失败:', error)
      ElMessage.error('上传照片失败，请重试')
    }
  }
  reader.readAsDataURL(file.raw)
}

const handlePhotoRemove = (file) => {
  tempPhotos.value = tempPhotos.value.filter(p => p.name !== file.name)
  form.value.photos = [...tempPhotos.value]
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    form.value.photos = [...tempPhotos.value]
    
    if (isEdit.value) {
      const index = qualityList.value.findIndex(item => item.id === form.value.id)
      if (index !== -1) {
        qualityList.value[index] = { ...form.value }
      }
      ElMessage.success('更新成功')
    } else {
      qualityList.value.unshift({ ...form.value })
      ElMessage.success('添加成功')
    }
    
    await dataService.set('quality', qualityList.value)
    
    if (form.value.type === '优秀案例' && form.value.photos && form.value.photos.length > 0) {
      const excellentPhotos = await dataService.get('excellentPhotos', [])
      form.value.photos.forEach(photo => {
        excellentPhotos.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: form.value.task.substring(0, 20) + '...',
          url: photo.url,
          createdAt: new Date().toISOString()
        })
      })
      await dataService.set('excellentPhotos', excellentPhotos)
    }
    
    if (form.value.type === '问题记录' && form.value.photos && form.value.photos.length > 0) {
      const problemPhotos = await dataService.get('problemPhotos', [])
      form.value.photos.forEach(photo => {
        problemPhotos.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          title: form.value.task.substring(0, 20) + '...',
          url: photo.url,
          createdAt: new Date().toISOString()
        })
      })
      await dataService.set('problemPhotos', problemPhotos)
    }
    
    dialogVisible.value = false
  } catch (error) {
    if (error !== false) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败，请重试')
    }
  }
}

const deleteQuality = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    qualityList.value = qualityList.value.filter(item => item.id !== row.id)
    await dataService.set('quality', qualityList.value)
    ElMessage.success('删除成功')
  } catch {
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    qualityList.value = qualityList.value.filter(item => !ids.includes(item.id))
    await dataService.set('quality', qualityList.value)
    ElMessage.success('批量删除成功')
  } catch {
  }
}

const loadData = async () => {
  try {
    const data = await dataService.get('quality', [])
    qualityList.value = data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.quality-management {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.add-button,
.batch-delete-button {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  font-weight: 500;
}

.quality-card {
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
  overflow: hidden;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters,
.sorting {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.status-filter,
.type-filter,
.date-filter,
.sort-field,
.sort-order {
  width: 200px;
}

.card-content {
  padding: 20px;
}

.quality-table {
  width: 100%;
}

.view-button,
.edit-button,
.delete-button {
  margin-right: 8px;
}

.quality-dialog,
.detail-dialog {
  border-radius: 16px;
}

.quality-form {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 18px;
}

.form-input {
  width: 100%;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.photo-upload {
  width: 100%;
}

.cancel-button,
.confirm-button {
  border-radius: 8px;
  padding: 8px 24px;
  font-weight: 500;
}

.detail-content {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
  flex-shrink: 0;
}

.detail-value {
  color: #555;
}

.detail-text {
  color: #555;
  line-height: 1.6;
  flex: 1;
}

.detail-photos {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-photo {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid rgba(102, 0, 153, 0.2);
  transition: all 0.2s ease;
}

.detail-photo:hover {
  transform: scale(1.05);
  border-color: rgba(102, 0, 153, 0.5);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.3);
}

:deep(.el-table) {
  background: transparent;
}

:deep(.el-table th),
:deep(.el-table td) {
  background: transparent;
  color: #333;
}

:deep(.el-table tr:hover > td) {
  background: rgba(102, 0, 153, 0.05);
}
</style>