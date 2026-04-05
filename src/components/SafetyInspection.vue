<template>
  <div class="safety-inspection">
    <div class="page-header">
      <h2>安全巡检</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openDialog" class="add-button">
          <el-icon><Plus /></el-icon>
          添加巡检记录
        </el-button>
        <el-button type="danger" @click="batchDelete" :disabled="selectedRows.length === 0" class="batch-delete-button">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>
    
    <div class="safety-card">
      <div class="card-header">
        <div class="filters">
          <el-input v-model="searchKeyword" placeholder="搜索巡检记录" class="search-input" prefix-icon="Search" />
          <el-select v-model="statusFilter" placeholder="按状态筛选" class="status-filter">
            <el-option label="全部" value="" />
            <el-option label="正常" value="正常" />
            <el-option label="异常" value="异常" />
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
            <el-option label="巡检日期" value="inspectionDate" />
            <el-option label="巡检编号" value="id" />
            <el-option label="巡检区域" value="area" />
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
          class="safety-table"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="巡检编号" width="120" />
          <el-table-column prop="inspector" label="巡检人" />
          <el-table-column prop="area" label="巡检区域" />
          <el-table-column label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="issue" label="问题描述" show-overflow-tooltip />
          <el-table-column prop="inspectionDate" label="巡检日期" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editSafety(row)" class="edit-button">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteSafety(row)" class="delete-button">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑巡检记录' : '添加巡检记录'"
      width="500px"
      class="safety-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="safety-form">
        <el-form-item label="巡检编号" prop="id" class="form-item">
          <el-input v-model="form.id" placeholder="请输入巡检编号" :disabled="isEdit" class="form-input" />
        </el-form-item>
        <el-form-item label="巡检人" prop="inspector" class="form-item">
          <el-input v-model="form.inspector" placeholder="请输入巡检人" class="form-input" />
        </el-form-item>
        <el-form-item label="巡检区域" prop="area" class="form-item">
          <el-input v-model="form.area" placeholder="请输入巡检区域" class="form-input" />
        </el-form-item>
        <el-form-item label="状态" prop="status" class="form-item">
          <el-radio-group v-model="form.status" class="radio-group">
            <el-radio label="正常" class="radio-item">正常</el-radio>
            <el-radio label="异常" class="radio-item">异常</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述" prop="issue" class="form-item">
          <el-input
            v-model="form.issue"
            type="textarea"
            :rows="3"
            placeholder="请描述发现的问题"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="巡检日期" prop="inspectionDate" class="form-item">
          <el-date-picker
            v-model="form.inspectionDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="相关设备" class="form-item">
          <div class="related-items">
            <el-input v-model="form.equipmentNames" placeholder="选择相关设备" readonly class="form-input equipment-input" />
            <el-button type="primary" @click="openEquipmentDialog" class="select-button">选择设备</el-button>
          </div>
          <div v-if="form.equipments && form.equipments.length > 0" class="selected-items">
            <el-tag v-for="equipment in form.equipments" :key="equipment.id" class="selected-tag" closable @close="removeEquipment(equipment)">
              {{ equipment.name }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="相关人员" class="form-item">
          <div class="related-items">
            <el-input v-model="form.personnelNames" placeholder="选择相关人员" readonly class="form-input personnel-input" />
            <el-button type="primary" @click="openPersonnelDialog" class="select-button">选择人员</el-button>
          </div>
          <div v-if="form.personnels && form.personnels.length > 0" class="selected-items">
            <el-tag v-for="personnel in form.personnels" :key="personnel.id" class="selected-tag" closable @close="removePersonnel(personnel)">
              {{ personnel.name }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <!-- 设备选择对话框 -->
      <el-dialog
        v-model="showEquipmentDialog"
        title="选择相关设备"
        width="600px"
        class="safety-dialog"
      >
        <el-table 
          :data="equipmentList" 
          class="equipment-table"
          @selection-change="handleEquipmentSelection"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="设备编号" width="120" />
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="status" label="设备状态" />
        </el-table>
        <template #footer>
          <el-button @click="showEquipmentDialog = false" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="confirmEquipmentSelection" class="confirm-button">确定</el-button>
        </template>
      </el-dialog>

      <!-- 人员选择对话框 -->
      <el-dialog
        v-model="showPersonnelDialog"
        title="选择相关人员"
        width="600px"
        class="safety-dialog"
      >
        <el-table 
          :data="personnelList" 
          class="personnel-table"
          @selection-change="handlePersonnelSelection"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="人员编号" width="120" />
          <el-table-column prop="name" label="人员姓名" />
          <el-table-column prop="position" label="职位" />
        </el-table>
        <template #footer>
          <el-button @click="showPersonnelDialog = false" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="confirmPersonnelSelection" class="confirm-button">确定</el-button>
        </template>
      </el-dialog>
      <template #footer>
        <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="submitForm" class="confirm-button">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dataService from '../services/dataService'

const safetyList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const selectedRows = ref([])
const searchKeyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const sortField = ref('inspectionDate')
const sortOrder = ref('desc')
const equipmentList = ref([])
const personnelList = ref([])
const showEquipmentDialog = ref(false)
const showPersonnelDialog = ref(false)
const selectedEquipments = ref([])
const selectedPersonnels = ref([])

const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

const hasPendingApplication = ref(false)

const checkPendingApplication = async () => {
  const currentUserId = localStorage.getItem('zhihui_site_userid')
  const workflows = await dataService.get('workflow', [])
  hasPendingApplication.value = workflows.some(item => 
    item.submitter === currentUserId && 
    (item.status === '待处理' || item.status === '处理中')
  )
}

const filteredAndSortedList = computed(() => {
  let result = [...safetyList.value]
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.id.toLowerCase().includes(keyword) ||
      item.inspector.toLowerCase().includes(keyword) ||
      item.area.toLowerCase().includes(keyword) ||
      (item.issue && item.issue.toLowerCase().includes(keyword))
    )
  }
  
  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    result = result.filter(item => {
      const itemDate = item.inspectionDate
      return itemDate >= startDate && itemDate <= endDate
    })
  }
  
  if (sortField.value) {
    result.sort((a, b) => {
      const aValue = a[sortField.value]
      const bValue = b[sortField.value]
      
      if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  
  return result
})

const form = reactive({
  id: '',
  inspector: '',
  area: '',
  status: '正常',
  equipments: [],
  equipmentNames: '',
  personnels: [],
  personnelNames: '',
  issue: '',
  inspectionDate: ''
})

const rules = {
  id: [{ required: true, message: '请输入巡检编号', trigger: 'blur' }],
  inspector: [{ required: true, message: '请输入巡检人', trigger: 'blur' }],
  area: [{ required: true, message: '请输入巡检区域', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const loadData = async () => {
  safetyList.value = await dataService.get('safety', [])
  equipmentList.value = await dataService.get('equipment', [])
  personnelList.value = await dataService.get('personnel', [])
}

const openDialog = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, {
    id: '',
    inspector: '',
    area: '',
    status: '正常',
    equipments: [],
    equipmentNames: '',
    personnels: [],
    personnelNames: '',
    issue: '',
    inspectionDate: ''
  })
  dialogVisible.value = true
}

const openEquipmentDialog = () => {
  selectedEquipments.value = [...form.equipments]
  showEquipmentDialog.value = true
}

const openPersonnelDialog = () => {
  selectedPersonnels.value = [...form.personnels]
  showPersonnelDialog.value = true
}

const handleEquipmentSelection = (val) => {
  selectedEquipments.value = val
}

const handlePersonnelSelection = (val) => {
  selectedPersonnels.value = val
}

const confirmEquipmentSelection = () => {
  form.equipments = selectedEquipments.value
  form.equipmentNames = selectedEquipments.value.map(item => item.name).join(', ')
  showEquipmentDialog.value = false
}

const confirmPersonnelSelection = () => {
  form.personnels = selectedPersonnels.value
  form.personnelNames = selectedPersonnels.value.map(item => item.name).join(', ')
  showPersonnelDialog.value = false
}

const removeEquipment = (equipment) => {
  form.equipments = form.equipments.filter(item => item.id !== equipment.id)
  form.equipmentNames = form.equipments.map(item => item.name).join(', ')
}

const removePersonnel = (personnel) => {
  form.personnels = form.personnels.filter(item => item.id !== personnel.id)
  form.personnelNames = form.personnels.map(item => item.name).join(', ')
}

const editSafety = (row) => {
  isEdit.value = true
  currentId.value = row.id
  const rowData = {
    ...row,
    equipments: row.equipments || [],
    equipmentNames: row.equipments ? row.equipments.map(item => item.name).join(', ') : '',
    personnels: row.personnels || [],
    personnelNames: row.personnels ? row.personnels.map(item => item.name).join(', ') : ''
  }
  Object.assign(form, rowData)
  dialogVisible.value = true
}

const deleteSafety = async (row) => {
  if (isAdmin.value) {
    ElMessageBox.confirm('确定要删除该巡检记录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      const index = safetyList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        safetyList.value.splice(index, 1)
        dataService.set('safety', safetyList.value)
        ElMessage.success('删除成功')
      }
    }).catch(() => {})
  } else {
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
      const currentUserId = localStorage.getItem('zhihui_site_userid')
      const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
      
      const newWorkflow = {
        id: 'WF' + Date.now().toString(36).toUpperCase(),
        submitter: currentUserId,
        submitterName: currentUserName,
        submitTime: new Date().toLocaleString('zh-CN'),
        type: '巡检记录删除申请',
        status: '待处理',
        targetId: row.id,
        targetName: row.area,
        estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN'),
        remark: `申请删除巡检记录: ${row.area} (编号: ${row.id})`
      }
      
      const workflows = await dataService.get('workflow', [])
      workflows.push(newWorkflow)
      await dataService.set('workflow', workflows)
      
      ElMessage.success('申请提交成功，请等待管理员处理')
    }).catch(() => {})
  }
}

const batchDelete = async () => {
  if (selectedRows.value.length === 0) return
  
  if (isAdmin.value) {
    ElMessageBox.confirm(`确定要删除选中的${selectedRows.value.length}条巡检记录吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      const selectedIds = selectedRows.value.map(row => row.id)
      safetyList.value = safetyList.value.filter(item => !selectedIds.includes(item.id))
      dataService.set('safety', safetyList.value)
      selectedRows.value = []
      ElMessage.success('批量删除成功')
    }).catch(() => {})
  } else {
    await checkPendingApplication()
    if (hasPendingApplication.value) {
      ElMessage.warning('您有未处理的申请，请等待管理员处理后再提交新的申请')
      return
    }
    
    ElMessageBox.confirm(`确定要提交删除${selectedRows.value.length}条巡检记录的申请吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      const currentUserId = localStorage.getItem('zhihui_site_userid')
      const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
      
      const newWorkflow = {
        id: 'WF' + Date.now().toString(36).toUpperCase(),
        submitter: currentUserId,
        submitterName: currentUserName,
        submitTime: new Date().toLocaleString('zh-CN'),
        type: '批量巡检记录删除申请',
        status: '待处理',
        targetId: selectedRows.value.map(row => row.id).join(','),
        targetName: `批量删除${selectedRows.value.length}条记录`,
        estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN'),
        remark: `申请批量删除${selectedRows.value.length}条巡检记录`
      }
      
      const workflows = await dataService.get('workflow', [])
      workflows.push(newWorkflow)
      await dataService.set('workflow', workflows)
      
      ElMessage.success('批量删除申请提交成功，请等待管理员处理')
    }).catch(() => {})
  }
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = safetyList.value.findIndex(item => item.id === currentId.value)
        if (index > -1) {
          safetyList.value[index] = { ...form }
        }
      } else {
        form.id = dataService.generateId()
        safetyList.value.push({ ...form })
      }
      await dataService.set('safety', safetyList.value)
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
    }
  })
}

onMounted(async () => {
  loadData()
  await checkPendingApplication()
})

const props = defineProps({
  action: {
    type: String,
    default: ''
  }
})

watch(() => props.action, (newAction) => {
  if (newAction === 'add') {
    openDialog()
  }
}, { immediate: true })
</script>

<style scoped>
.safety-inspection {
  padding: 0;
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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
  background: #660099;
  border-radius: 9999px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(102, 0, 153, 0.1);
  border: 1px solid rgba(102, 0, 153, 0.3);
  color: #660099;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-button:hover {
  background: rgba(102, 0, 153, 0.2);
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.3);
  transform: scale(1.05);
}

.batch-delete-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(245, 63, 63, 0.1);
  border: 1px solid rgba(245, 63, 63, 0.3);
  color: #F53F3F;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-delete-button:hover:not(:disabled) {
  background: rgba(245, 63, 63, 0.2);
  border-color: #F53F3F;
  box-shadow: 0 0 15px rgba(245, 63, 63, 0.3);
  transform: scale(1.05);
}

.batch-delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.safety-card {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.08);
  background: transparent;
  flex-wrap: wrap;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 250px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.15);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
}

.search-input:hover {
  border-color: rgba(102, 0, 153, 0.3);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.search-input:focus {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
}

.status-filter,
.date-filter,
.sort-field,
.sort-order {
  min-width: 120px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.15);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
}

.status-filter:hover,
.date-filter:hover,
.sort-field:hover,
.sort-order:hover {
  border-color: rgba(102, 0, 153, 0.3);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.status-filter:focus,
.date-filter:focus,
.sort-field:focus,
.sort-order:focus {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
}

.sorting {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.card-content {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.safety-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.safety-table th {
  background: rgba(245, 247, 250, 0.95) !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
  border-radius: 0 !important;
}

.safety-table td {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-bottom: 1px solid rgba(77, 20, 140, 0.08) !important;
  transition: all 0.2s ease;
  border-radius: 0 !important;
}

.safety-table tr:hover td {
  background: rgba(245, 247, 250, 0.95) !important;
  color: #1D2129 !important;
  border-bottom-color: #660099 !important;
}

.edit-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border: 1px solid rgba(102, 0, 153, 0.2);
  background: rgba(102, 0, 153, 0.05);
  color: #660099;
  border-radius: 6px;
  margin-right: 8px;
  padding: 4px 12px;
  font-size: 12px;
}

.edit-button:hover {
  background: rgba(102, 0, 153, 0.1);
  border-color: #660099;
  color: #660099;
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.15);
}

.delete-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border: 1px solid rgba(245, 63, 63, 0.2);
  background: rgba(245, 63, 63, 0.05);
  color: #F53F3F;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
}

.delete-button:hover {
  background: rgba(245, 63, 63, 0.1);
  border-color: #F53F3F;
  box-shadow: 0 0 10px rgba(245, 63, 63, 0.15);
}

.safety-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.98);
  --el-dialog-border-color: rgba(102, 0, 153, 0.2);
  --el-dialog-header-bg-color: rgba(245, 247, 250, 0.95);
  --el-dialog-title-color: #1D2129;
  border-radius: 12px;
  backdrop-filter: blur(25px);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.35);
  overflow: hidden;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 9999 !important;
  margin: 0 !important;
}

.safety-dialog .el-dialog__title {
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.safety-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(102, 0, 153, 0.1) !important;
  padding: 24px;
  background: rgba(245, 247, 250, 0.95);
}

.safety-dialog .el-dialog__body {
  padding: 24px;
  background: rgba(255, 255, 255, 0.98);
}

.safety-dialog .el-dialog__footer {
  border-top: 1px solid rgba(102, 0, 153, 0.1) !important;
  padding: 16px 24px 24px;
  background: rgba(245, 247, 250, 0.95);
}

.safety-form {
  padding: 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item .el-form-item__label {
  font-weight: 500;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  background: rgba(245, 247, 250, 0.95);
  border: 1px solid rgba(102, 0, 153, 0.2);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.form-input:hover {
  border-color: rgba(102, 0, 153, 0.3);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.form-input:focus {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
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

.form-input .el-textarea__inner {
  background: transparent !important;
  border: none !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-radius: 8px !important;
  resize: vertical !important;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  font-size: 14px;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(102, 0, 153, 0.2);
  cursor: pointer;
}

.radio-item:hover {
  color: #660099;
  border-color: #660099;
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.radio-item.is-checked {
  background: rgba(102, 0, 153, 0.1);
  color: #660099;
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
}

.related-items {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.equipment-input,
.personnel-input {
  flex: 1;
}

.select-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: rgba(102, 0, 153, 0.1);
  border: 1px solid rgba(102, 0, 153, 0.3);
  color: #660099;
  border-radius: 8px;
  padding: 8px 16px;
  white-space: nowrap;
}

.select-button:hover {
  background: rgba(102, 0, 153, 0.2);
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.3);
  transform: scale(1.05);
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.selected-tag {
  background: rgba(102, 0, 153, 0.1) !important;
  color: #660099 !important;
  border: 1px solid rgba(102, 0, 153, 0.3) !important;
  border-radius: 8px !important;
  padding: 4px 12px !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 12px !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: all 0.2s ease !important;
}

.selected-tag:hover {
  background: rgba(102, 0, 153, 0.2) !important;
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.2) !important;
}

.equipment-table,
.personnel-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.equipment-table th,
.personnel-table th {
  background: rgba(245, 247, 250, 0.95) !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
  border-radius: 0 !important;
}

.equipment-table td,
.personnel-table td {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-bottom: 1px solid rgba(77, 20, 140, 0.08) !important;
  transition: all 0.2s ease;
  border-radius: 0 !important;
}

.equipment-table tr:hover td,
.personnel-table tr:hover td {
  background: rgba(245, 247, 250, 0.95) !important;
  color: #1D2129 !important;
  border-bottom-color: #660099 !important;
}

.cancel-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border: 1px solid rgba(102, 0, 153, 0.2);
  background: rgba(245, 247, 250, 0.95);
  color: #4E5969;
  border-radius: 8px;
  margin-right: 8px;
  padding: 8px 16px;
}

.cancel-button:hover {
  background: rgba(245, 247, 250, 1);
  border-color: #660099;
  color: #660099;
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.15);
}

.confirm-button {
  transition: all 0.2s ease;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  background: #660099;
  border: 1px solid #660099;
  color: white;
  border-radius: 8px;
  padding: 8px 16px;
}

.confirm-button:hover {
  background: #550080;
  border-color: #550080;
  box-shadow: 0 0 20px rgba(102, 0, 153, 0.4);
  transform: scale(1.05);
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
  
  .add-button,
  .batch-delete-button {
    flex: 1;
    justify-content: center;
    font-size: 12px;
    padding: 8px 12px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .filters,
  .sorting {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-input,
  .status-filter,
  .date-filter,
  .sort-field,
  .sort-order {
    width: 100%;
  }
  
  .safety-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .safety-table {
    font-size: 12px;
  }
  
  .edit-button,
  .delete-button {
    font-size: 11px;
    padding: 2px 8px;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .radio-item {
    width: 100%;
    text-align: center;
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
</style>
