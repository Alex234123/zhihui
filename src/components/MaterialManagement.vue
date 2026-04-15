<template>
  <div class="material-management">
    <div class="page-header">
      <h2>材料进场管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openDialog" class="add-button">
          <el-icon><Plus /></el-icon>
          添加材料
        </el-button>
        <el-button type="success" @click="openUsageDialog" class="usage-button">
          <el-icon><Operation /></el-icon>
          材料使用
        </el-button>
        <el-button 
          v-if="isAdmin"
          type="danger"
          size="small"
          @click="resetMaterialData"
          class="reset-module-button"
        >
          <el-icon><Delete /></el-icon>
          重置材料数据
        </el-button>
      </div>
    </div>
    
    <div class="material-card">
      <div class="card-content">
        <div class="filter-bar">
          <el-select v-model="categoryFilter" placeholder="按分类筛选" class="filter-select">
            <el-option label="全部" value="" />
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索材料名称"
            class="filter-input"
            prefix-icon="Search"
          />
        </div>

        <el-table :data="filteredMaterials" class="material-table">
          <el-table-column prop="id" label="编号" width="120" />
          <el-table-column prop="name" label="材料名称" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="spec" label="规格型号" />
          <el-table-column prop="brand" label="品牌" />
          <el-table-column prop="quantity" label="数量" />
          <el-table-column label="库存状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getInventoryStatusType(row)" size="small">
                {{ getInventoryStatusText(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="batch" label="批次号" />
          <el-table-column prop="supplier" label="供应商" />
          <el-table-column prop="entryDate" label="进场日期" />
          <el-table-column prop="keeper" label="保管员" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editMaterial(row)" class="edit-button">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteMaterial(row)" class="delete-button">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑材料' : '添加材料'"
      width="550px"
      class="material-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="material-form">
        <el-form-item label="编号" prop="id" class="form-item">
          <el-input v-model="form.id" placeholder="请输入编号" :disabled="isEdit" class="form-input" />
        </el-form-item>
        <el-form-item label="材料名称" prop="name" class="form-item">
          <el-input v-model="form.name" placeholder="请输入材料名称" class="form-input" />
        </el-form-item>
        <el-form-item label="分类" prop="category" class="form-item">
          <el-select v-model="form.category" placeholder="请选择分类" class="form-input">
            <el-option label="钢材" value="钢材" />
            <el-option label="水泥" value="水泥" />
            <el-option label="砂石" value="砂石" />
            <el-option label="木材" value="木材" />
            <el-option label="防水材料" value="防水材料" />
            <el-option label="电气材料" value="电气材料" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="spec" class="form-item">
          <el-input v-model="form.spec" placeholder="请输入规格型号" class="form-input" />
        </el-form-item>
        <el-form-item label="品牌" prop="brand" class="form-item">
          <el-input v-model="form.brand" placeholder="请输入品牌" class="form-input" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity" class="form-item">
          <el-input-number v-model="form.quantity" :min="0" class="form-input" style="width: 100%" />
        </el-form-item>
        <el-form-item label="批次号" prop="batch" class="form-item">
          <el-input v-model="form.batch" placeholder="请输入批次号" class="form-input" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplier" class="form-item">
          <el-input v-model="form.supplier" placeholder="请输入供应商" class="form-input" />
        </el-form-item>
        <el-form-item label="进场日期" prop="entryDate" class="form-item">
          <el-date-picker
            v-model="form.entryDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="保管员" prop="keeper" class="form-item">
          <el-select v-model="form.keeper" placeholder="请选择保管员" class="form-input">
            <el-option v-for="person in personnelList" :key="person.id" :label="person.name" :value="person.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存预警阈值" prop="warningThreshold" class="form-item">
          <el-input-number v-model="form.warningThreshold" :min="0" class="form-input" style="width: 100%" placeholder="请输入预警阈值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="submitForm" class="confirm-button">确定</el-button>
      </template>
    </el-dialog>

    <!-- 材料使用对话框 -->
    <el-dialog
      v-model="usageDialogVisible"
      title="材料使用记录"
      width="550px"
      class="material-dialog"
    >
      <el-form :model="usageForm" :rules="usageRules" ref="usageFormRef" label-width="100px" class="material-form">
        <el-form-item label="材料" prop="materialId" class="form-item">
          <el-select v-model="usageForm.materialId" placeholder="请选择材料" class="form-input">
            <el-option v-for="material in materialList" :key="material.id" :label="material.name" :value="material.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用数量" prop="quantity" class="form-item">
          <el-input-number v-model="usageForm.quantity" :min="1" class="form-input" style="width: 100%" />
        </el-form-item>
        <el-form-item label="使用日期" prop="usageDate" class="form-item">
          <el-date-picker
            v-model="usageForm.usageDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="form-input"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="使用人" prop="user" class="form-item">
          <el-input v-model="usageForm.user" placeholder="请输入使用人" class="form-input" />
        </el-form-item>
        <el-form-item label="使用用途" prop="purpose" class="form-item">
          <el-input v-model="usageForm.purpose" placeholder="请输入使用用途" class="form-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="usageDialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="submitUsageForm" class="confirm-button">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dataService from '../services/dataService'

const materialList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const categoryFilter = ref('')
const searchKeyword = ref('')
const personnelList = ref([])
const usageDialogVisible = ref(false)
const usageFormRef = ref(null)
const usageRecords = ref([])

const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

const currentUser = computed(() => {
  return {
    id: localStorage.getItem('zhihui_site_userid'),
    name: localStorage.getItem('zhihui_site_username')
  }
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

const form = reactive({
  id: '',
  name: '',
  category: '',
  spec: '',
  brand: '',
  quantity: 0,
  batch: '',
  supplier: '',
  entryDate: '',
  keeper: '',
  warningThreshold: 0
})

const rules = {
  id: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入材料名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'change' }],
  batch: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  warningThreshold: [{ required: true, message: '请输入库存预警阈值', trigger: 'change' }]
}

const usageForm = reactive({
  materialId: '',
  quantity: 1,
  usageDate: '',
  user: '',
  purpose: ''
})

const usageRules = {
  materialId: [{ required: true, message: '请选择材料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入使用数量', trigger: 'change' }],
  usageDate: [{ required: true, message: '请选择使用日期', trigger: 'change' }],
  user: [{ required: true, message: '请输入使用人', trigger: 'blur' }],
  purpose: [{ required: true, message: '请输入使用用途', trigger: 'blur' }]
}

const categories = computed(() => {
  const cats = new Set()
  materialList.value.forEach(item => {
    if (item.category) cats.add(item.category)
  })
  return Array.from(cats)
})

const filteredMaterials = computed(() => {
  let result = [...materialList.value]
  
  if (categoryFilter.value) {
    result = result.filter(item => item.category === categoryFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.spec.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

const getInventoryStatusType = (row) => {
  if (!row.warningThreshold) return 'info'
  if (row.quantity <= 0) return 'danger'
  if (row.quantity < row.warningThreshold) return 'warning'
  return 'success'
}

const getInventoryStatusText = (row) => {
  if (!row.warningThreshold) return '未设置预警'
  if (row.quantity <= 0) return '库存为零'
  if (row.quantity < row.warningThreshold) return '库存不足'
  return '库存正常'
}

const loadData = async () => {
  materialList.value = await dataService.get('materials', [])
  personnelList.value = await dataService.get('personnel', [])
}

const openDialog = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, {
    id: '',
    name: '',
    category: '',
    spec: '',
    unit: '',
    quantity: 0,
    batch: '',
    supplier: '',
    entryDate: '',
    keeper: '',
    warningThreshold: 0
  })
  dialogVisible.value = true
}

const openUsageDialog = () => {
  Object.assign(usageForm, {
    materialId: '',
    quantity: 1,
    usageDate: '',
    user: '',
    purpose: ''
  })
  usageDialogVisible.value = true
}

const resetMaterialData = async () => {
  if (!isAdmin.value) {
    ElMessage.error('您没有执行此操作的权限')
    return
  }

  ElMessageBox.confirm(
    '此操作将清空所有材料数据，且不可恢复！确定要继续吗？',
    '⚠️ 确认重置材料数据',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await dataService.set('materials', [])
      materialList.value = []
      
      const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
      await dataService.addLog('info', `${currentUserName} 重置了所有材料数据`)
      
      ElMessage.success('材料数据已成功重置')
    } catch (error) {
      console.error('重置材料数据失败:', error)
      ElMessage.error('重置失败，请稍后重试')
    }
  }).catch(() => {})
}

const loadUsageRecords = async () => {
  usageRecords.value = await dataService.get('materialUsage', [])
}

const submitUsageForm = async () => {
  usageFormRef.value.validate(async (valid) => {
    if (valid) {
      const material = materialList.value.find(m => m.id === usageForm.materialId)
      if (!material) {
        ElMessage.error('选择的材料不存在')
        return
      }
      
      if (material.quantity < usageForm.quantity) {
        ElMessage.error('库存不足，无法完成使用记录')
        return
      }
      
      if (isAdmin.value) {
        await processMaterialUsage(material)
      } else {
        await submitMaterialUsageRequest(material)
      }
    }
  })
}

const processMaterialUsage = async (material) => {
  try {
    material.quantity -= usageForm.quantity
    await dataService.set('materials', materialList.value)
    
    const newUsageRecord = {
      id: dataService.generateId(),
      materialId: usageForm.materialId,
      materialName: material.name,
      quantity: usageForm.quantity,
      usageDate: usageForm.usageDate,
      user: usageForm.user,
      purpose: usageForm.purpose,
      createdAt: new Date().toLocaleString('zh-CN')
    }
    
    usageRecords.value.push(newUsageRecord)
    await dataService.set('materialUsage', usageRecords.value)
    
    usageDialogVisible.value = false
    ElMessage.success('材料使用记录添加成功')
  } catch (error) {
    console.error('处理材料使用失败:', error)
    ElMessage.error('处理材料使用失败，请稍后重试')
  }
}

const submitMaterialUsageRequest = async (material) => {
  try {
    await checkPendingApplication()
    if (hasPendingApplication.value) {
      ElMessage.warning('您有未处理的申请，请等待管理员处理后再提交新的申请')
      return
    }
    
    const newWorkflow = {
      id: 'WF' + Date.now().toString(36).toUpperCase(),
      submitter: currentUser.value.id,
      submitterName: currentUser.value.name,
      submitTime: new Date().toLocaleString('zh-CN'),
      type: '材料使用申请',
      status: '待处理',
      targetId: material.id,
      targetName: material.name,
      estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN'),
      remark: `申请使用材料: ${material.name}，数量: ${usageForm.quantity}，用途: ${usageForm.purpose}`,
      usageDetails: {
        quantity: usageForm.quantity,
        usageDate: usageForm.usageDate,
        user: usageForm.user,
        purpose: usageForm.purpose
      }
    }
    
    const workflows = await dataService.get('workflow', [])
    workflows.push(newWorkflow)
    await dataService.set('workflow', workflows)
    
    usageDialogVisible.value = false
    ElMessage.success('申请提交成功，请等待管理员处理')
  } catch (error) {
    console.error('提交材料使用申请失败:', error)
    ElMessage.error('提交申请失败，请稍后重试')
  }
}

const editMaterial = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const deleteMaterial = async (row) => {
  if (isAdmin.value) {
    ElMessageBox.confirm('确定要删除该材料信息吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      const index = materialList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        materialList.value.splice(index, 1)
        dataService.set('materials', materialList.value)
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
        type: '材料删除申请',
        status: '待处理',
        targetId: row.id,
        targetName: row.name,
        estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN'),
        remark: `申请删除材料: ${row.name} (${row.category})`
      }
      
      const workflows = await dataService.get('workflow', [])
      workflows.push(newWorkflow)
      await dataService.set('workflow', workflows)
      
      ElMessage.success('申请提交成功，请等待管理员处理')
    }).catch(() => {})
  }
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = materialList.value.findIndex(item => item.id === currentId.value)
        if (index > -1) {
          materialList.value[index] = { ...form }
        }
      } else {
        form.id = dataService.generateId()
        materialList.value.push({ ...form })
      }
      await dataService.set('materials', materialList.value)
      dialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '添加成功')
    }
  })
}

const subscribeToDataChanges = () => {
  dataService.subscribe('personnel', (data) => {
    if (data) {
      personnelList.value = data
    }
  })
  
  dataService.subscribe('materials', (data) => {
    if (data) {
      materialList.value = data
    }
  })
}

onMounted(async () => {
  loadData()
  await loadUsageRecords()
  await checkPendingApplication()
  subscribeToDataChanges()
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
.material-management {
  padding: 0;
  position: relative;
  z-index: 1;
}

.reset-module-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid var(--future-danger);
  background: transparent;
  color: var(--future-danger);
  border-radius: var(--future-radius-md);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.reset-module-button:hover:not(:disabled) {
  background: var(--future-danger);
  border-color: var(--future-danger);
  color: #ffffff;
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

.add-button,
.usage-button {
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

.add-button:hover,
.usage-button:hover {
  background: rgba(102, 0, 153, 0.2);
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.3);
  transform: scale(1.05);
}

.material-card {
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(245, 247, 250, 0.9);
  border: 1px solid rgba(77, 20, 140, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.filter-bar:hover {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.15);
}

.filter-select {
  width: 200px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.15);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.filter-select:hover {
  border-color: rgba(102, 0, 153, 0.3);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.filter-select:focus {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
}

.filter-input {
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(77, 20, 140, 0.15);
  border-radius: 8px;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.filter-input:hover {
  border-color: rgba(102, 0, 153, 0.3);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.1);
}

.filter-input:focus {
  border-color: #660099;
  box-shadow: 0 0 15px rgba(102, 0, 153, 0.2);
}

.material-table {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.material-table th {
  background: rgba(245, 247, 250, 0.95) !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
  border-radius: 0 !important;
}

.material-table td {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  border-bottom: 1px solid rgba(77, 20, 140, 0.08) !important;
  transition: all 0.2s ease;
  border-radius: 0 !important;
}

.material-table tr:hover td {
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

.material-dialog {
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

.material-dialog .el-dialog__title {
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.material-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(102, 0, 153, 0.1) !important;
  padding: 24px;
  background: rgba(245, 247, 250, 0.95);
}

.material-dialog .el-dialog__body {
  padding: 24px;
  background: rgba(255, 255, 255, 0.98);
}

.material-dialog .el-dialog__footer {
  border-top: 1px solid rgba(102, 0, 153, 0.1) !important;
  padding: 16px 24px 24px;
  background: rgba(245, 247, 250, 0.95);
}

.material-form {
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

.form-input .el-select__wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 8px !important;
}

.form-input .el-select__placeholder {
  color: #4E5969 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.form-input .el-select__caret {
  color: #660099 !important;
}

.form-input .el-date-picker__input {
  background: transparent !important;
  border: none !important;
  color: #1D2129 !important;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.form-input .el-date-picker__icon {
  color: #660099 !important;
}

.form-input .el-input-number__decrease,
.form-input .el-input-number__increase {
  background: rgba(245, 247, 250, 0.95) !important;
  border: 1px solid rgba(102, 0, 153, 0.2) !important;
  color: #660099 !important;
  border-radius: 8px !important;
}

.form-input .el-input-number__decrease:hover,
.form-input .el-input-number__increase:hover {
  background: rgba(102, 0, 153, 0.1) !important;
  border-color: #660099 !important;
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.15) !important;
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
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select,
  .filter-input {
    width: 100%;
  }
  
  .material-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .material-table {
    font-size: 12px;
  }
  
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
</style>
