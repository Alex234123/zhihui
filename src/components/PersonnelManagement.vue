<template>
  <div class="personnel-management">
    <div class="page-header">
      <h2>人员管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openDialog" class="add-button">
          <el-icon><Plus /></el-icon>
          添加人员
        </el-button>
        <el-button v-if="isAdmin" @click="batchDelete" class="batch-delete-button" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-dropdown>
          <el-button class="import-export-button">
            导入导出
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportPersonnel">导出人员数据</el-dropdown-item>
              <el-dropdown-item @click="showImportDialog = true">导入人员数据</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button 
          v-if="isAdmin"
          type="danger" 
          size="small"
          @click="resetPersonnelData"
          class="reset-module-button"
        >
          <el-icon><Delete /></el-icon>
          重置人员数据
        </el-button>
      </div>
    </div>
    
    <!-- 三个责任主体并排容器 -->
    <div class="personnel-cards-container">
    <!-- 建设单位板块 -->
    <div class="personnel-card">
      <div class="card-header">
        <h3 class="section-title">建设单位</h3>
        <el-input
          v-model="searchQuery"
          placeholder="搜索人员姓名或编号"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="card-content">
        <el-table 
          :data="constructionUnitPersonnel" 
          class="personnel-table"
          :row-key="row => row.id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="编号" width="100" sortable />
          <el-table-column prop="name" label="姓名" sortable />
          <el-table-column prop="position" label="岗位" />
          <el-table-column prop="team" label="班组" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewPersonnel(row)" class="view-button">详情</el-button>
              <el-button size="small" @click="editPersonnel(row)" class="edit-button">编辑</el-button>
              <el-button 
                v-if="isAdmin" 
                size="small" 
                type="danger" 
                @click="deletePersonnel(row)" 
                class="delete-button"
              >
                删除
              </el-button>
              <el-button 
                v-else 
                size="small" 
                type="warning" 
                @click="requestDeletePermission(row)" 
                class="request-button"
              >
                申请删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="constructionUnitPersonnel.length === 0" class="empty-state">
          <el-empty description="暂无建设单位人员数据" />
        </div>
      </div>
    </div>

    <!-- 监理单位板块 -->
    <div class="personnel-card">
      <div class="card-header">
        <h3 class="section-title">监理单位</h3>
        <el-input
          v-model="searchQuery"
          placeholder="搜索人员姓名或编号"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="card-content">
        <el-table 
          :data="supervisionUnitPersonnel" 
          class="personnel-table"
          :row-key="row => row.id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="编号" width="100" sortable />
          <el-table-column prop="name" label="姓名" sortable />
          <el-table-column prop="position" label="岗位" />
          <el-table-column prop="team" label="班组" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewPersonnel(row)" class="view-button">详情</el-button>
              <el-button size="small" @click="editPersonnel(row)" class="edit-button">编辑</el-button>
              <el-button 
                v-if="isAdmin" 
                size="small" 
                type="danger" 
                @click="deletePersonnel(row)" 
                class="delete-button"
              >
                删除
              </el-button>
              <el-button 
                v-else 
                size="small" 
                type="warning" 
                @click="requestDeletePermission(row)" 
                class="request-button"
              >
                申请删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="supervisionUnitPersonnel.length === 0" class="empty-state">
          <el-empty description="暂无监理单位人员数据" />
        </div>
      </div>
    </div>

    <!-- 施工单位板块 -->
    <div class="personnel-card">
      <div class="card-header">
        <h3 class="section-title">施工单位</h3>
        <el-input
          v-model="searchQuery"
          placeholder="搜索人员姓名或编号"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="card-content">
        <el-table
          :data="builderUnitPersonnel"
          class="personnel-table"
          :row-key="row => row.id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="编号" width="100" sortable />
          <el-table-column prop="name" label="姓名" sortable />
          <el-table-column prop="position" label="岗位" />
          <el-table-column prop="supervisor" label="负责人" />
          <el-table-column prop="block" label="负责区块" width="100" />
          <el-table-column prop="team" label="班组" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewPersonnel(row)" class="view-button">详情</el-button>
              <el-button size="small" @click="editPersonnel(row)" class="edit-button">编辑</el-button>
              <el-button
                v-if="isAdmin"
                size="small"
                type="danger"
                @click="deletePersonnel(row)"
                class="delete-button"
              >
                删除
              </el-button>
              <el-button
                v-else
                size="small"
                type="warning"
                @click="requestDeletePermission(row)"
                class="request-button"
              >
                申请删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="builderUnitPersonnel.length === 0" class="empty-state">
          <el-empty description="暂无施工单位人员数据" />
        </div>
      </div>
    </div>
    </div>

    <!-- 评分排名系统 -->
    <div class="ranking-section">
      <div class="ranking-header">
        <h3 class="section-title">施工单位评分排名</h3>
        <div class="ranking-stats">
          <span class="stat-item">基准分：100分</span>
          <span class="stat-item">满分人数：{{ perfectCount }}人</span>
          <span class="stat-item">平均分：{{ averageScore }}分</span>
        </div>
      </div>

      <div class="rules-card">
        <div class="rules-title">
          <el-icon><InfoFilled /></el-icon>
          <span>评分规则</span>
        </div>
        <div class="rules-content">
          <div class="rule-item">
            <span class="rule-icon negative">-1</span>
            <span class="rule-text">进度超时一次</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon negative">-1</span>
            <span class="rule-text">质量不合格一次</span>
          </div>
          <div class="rule-item">
            <span class="rule-icon leader">连带</span>
            <span class="rule-text">下属扣分时直系领导同步扣分</span>
          </div>
        </div>
      </div>

      <div class="ranking-list">
        <el-table :data="rankedPersonnel" class="ranking-table" row-key="id">
          <el-table-column prop="rank" label="排名" width="80" align="center">
            <template #default="{ row, $index }">
              <div :class="['rank-badge', getRankClass($index + 1)]">
                {{ $index + 1 }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" min-width="120">
            <template #default="{ row }">
              <div class="person-info">
                <el-avatar :size="32" class="person-avatar">{{ row.name?.charAt(0) }}</el-avatar>
                <div class="person-details">
                  <span class="person-name">{{ row.name }}</span>
                  <span class="person-position">{{ row.position }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="block" label="负责区块" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.block" :type="getBlockTagType(row.block)" size="small">
                区块{{ row.block }}
              </el-tag>
              <span v-else class="no-data">未分配</span>
            </template>
          </el-table-column>
          <el-table-column prop="supervisor" label="负责人" width="120" align="center">
            <template #default="{ row }">
              <span v-if="row.supervisor" class="supervisor-name">{{ row.supervisor }}</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="baseScore" label="基础分" width="80" align="center">
            <template #default="{ row }">
              <span class="base-score">100</span>
            </template>
          </el-table-column>
          <el-table-column prop="penalty" label="累计扣分" width="100" align="center">
            <template #default="{ row }">
              <span :class="['penalty-score', row.penalty > 0 ? 'has-penalty' : '']">
                {{ row.penalty > 0 ? '-' + row.penalty : '0' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="finalScore" label="当前评分" min-width="120" align="center">
            <template #default="{ row }">
              <div class="score-display">
                <el-progress
                  :percentage="row.finalScore"
                  :stroke-width="10"
                  :color="getScoreColor(row.finalScore)"
                  :show-text="false"
                  class="score-progress"
                />
                <span :class="['score-value', getScoreClass(row.finalScore)]">
                  {{ row.finalScore }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="penaltyRecords" label="扣分记录" min-width="200">
            <template #default="{ row }">
              <div v-if="row.penaltyRecords && row.penaltyRecords.length > 0" class="penalty-records">
                <el-tag
                  v-for="(record, idx) in row.penaltyRecords.slice(0, 3)"
                  :key="idx"
                  :type="record.type === 'progress' ? 'warning' : 'danger'"
                  size="small"
                  class="penalty-tag"
                >
                  {{ record.type === 'progress' ? '进度' : '质量' }}-{{ record.count }}次
                </el-tag>
                <el-tag v-if="row.penaltyRecords.length > 3" size="small" type="info">
                  +{{ row.penaltyRecords.length - 3 }}
                </el-tag>
              </div>
              <span v-else class="no-penalty">无扣分</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑人员' : '添加人员'"
      width="500px"
      class="personnel-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" class="personnel-form">
        <el-form-item v-if="isEdit" label="编号" prop="id" class="form-item">
          <el-input v-model="form.id" disabled class="form-input" />
        </el-form-item>
        <el-form-item label="姓名" prop="name" class="form-item">
          <el-input v-model="form.name" placeholder="请输入姓名" class="form-input" />
        </el-form-item>
        <el-form-item label="岗位" prop="position" class="form-item">
          <el-input v-model="form.position" placeholder="请输入岗位" class="form-input" />
        </el-form-item>
        <el-form-item label="责任主体" prop="responsibility" class="form-item">
          <el-select v-model="form.responsibility" placeholder="请选择责任主体" class="form-input">
            <el-option label="建设单位" value="建设单位" />
            <el-option label="监理单位" value="监理单位" />
            <el-option label="施工单位" value="施工单位" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.responsibility === '施工单位'" label="负责人" prop="supervisor" class="form-item">
          <el-select
            v-model="form.supervisor"
            placeholder="请选择负责人或所属负责人"
            class="form-input"
            filterable
            @change="handleSupervisorChange"
          >
            <el-option
              v-for="person in constructionPersonnel"
              :key="person.id"
              :label="person.name"
              :value="person.name"
            >
              <span>{{ person.name }}</span>
              <span style="float: right; color: #999; font-size: 12px;">{{ person.phone }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.responsibility === '施工单位'" label="负责区块" prop="block" class="form-item">
          <el-select v-model="form.block" placeholder="请选择负责区块" class="form-input">
            <el-option label="区块A" value="A" />
            <el-option label="区块B" value="B" />
            <el-option label="区块C" value="C" />
            <el-option label="区块D" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.responsibility === '施工单位'" label="班组" prop="team" class="form-item">
          <el-input v-model="form.team" placeholder="请输入班组" class="form-input" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone" class="form-item">
          <el-input v-model="form.phone" placeholder="请输入联系电话" class="form-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="submitForm" class="confirm-button">确定</el-button>
      </template>
    </el-dialog>

    <!-- 人员详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="人员详情"
      width="600px"
      class="personnel-dialog"
    >
      <div class="personnel-details">
        <div class="detail-row">
          <span class="detail-label">编号:</span>
          <span class="detail-value">{{ viewForm.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">姓名:</span>
          <span class="detail-value">{{ viewForm.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">岗位:</span>
          <span class="detail-value">{{ viewForm.position }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">责任主体:</span>
          <span class="detail-value">{{ viewForm.responsibility }}</span>
        </div>
        <div v-if="viewForm.responsibility === '施工单位'" class="detail-row">
          <span class="detail-label">负责人:</span>
          <span class="detail-value">{{ viewForm.supervisor || '未设置' }}</span>
        </div>
        <div v-if="viewForm.responsibility === '施工单位'" class="detail-row">
          <span class="detail-label">负责区块:</span>
          <span class="detail-value">{{ viewForm.block ? '区块' + viewForm.block : '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">班组:</span>
          <span class="detail-value">{{ viewForm.team || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">联系电话:</span>
          <span class="detail-value">{{ viewForm.phone }}</span>
        </div>
        <div v-if="viewForm.responsibility === '施工单位' && viewForm.managerChain && viewForm.managerChain.length > 0" class="detail-section">
          <h3 class="section-title">责任追溯链</h3>
          <div class="responsibility-chain">
            <div 
              v-for="(personId, index) in viewForm.managerChain" 
              :key="personId"
              class="chain-item"
            >
              <div class="chain-person">
                <div class="chain-avatar">{{ getPersonById(personId)?.name?.charAt(0) || '?' }}</div>
                <div class="chain-info">
                  <div class="chain-name">{{ getPersonById(personId)?.name || '未知人员' }}</div>
                  <div class="chain-position">{{ getPersonById(personId)?.position || '' }}</div>
                </div>
                <el-tag v-if="index === 0" type="primary" size="small">本人</el-tag>
                <el-tag v-else type="warning" size="small">连带责任</el-tag>
              </div>
              <el-icon v-if="index < viewForm.managerChain.length - 1" class="chain-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h3 class="section-title">相关设备</h3>
          <div v-if="relatedEquipment.length > 0" class="related-items-list">
            <el-table :data="relatedEquipment" class="related-items-table">
              <el-table-column prop="id" label="设备编号" width="120" />
              <el-table-column prop="name" label="设备名称" />
              <el-table-column prop="status" label="设备状态" />
            </el-table>
          </div>
          <div v-else class="no-related-items">
            暂无相关设备
          </div>
        </div>
        <div class="detail-section">
          <h3 class="section-title">相关巡检记录</h3>
          <div v-if="relatedSafetyInspections.length > 0" class="related-items-list">
            <el-table :data="relatedSafetyInspections" class="related-items-table">
              <el-table-column prop="id" label="巡检编号" width="120" />
              <el-table-column prop="inspector" label="巡检人" />
              <el-table-column prop="area" label="巡检区域" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :class="getStatusClass(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="no-related-items">
            暂无相关巡检记录
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false" class="cancel-button">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入人员数据对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入人员数据"
      width="500px"
      class="personnel-dialog"
    >
      <div class="import-section">
        <el-upload
          class="upload-demo"
          :action="''"
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          accept=".xlsx,.xls,.csv"
        >
          <el-button type="primary" class="upload-button">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              请上传 Excel 或 CSV 文件，支持 .xlsx, .xls, .csv 格式
            </div>
          </template>
        </el-upload>
        <div v-if="importPreview.length > 0" class="import-preview">
          <h3 class="preview-title">数据预览</h3>
          <el-table :data="importPreview" max-height="300">
            <el-table-column prop="id" label="编号" width="100" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="position" label="岗位" />
            <el-table-column prop="responsibility" label="责任主体" width="120" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false" class="cancel-button">取消</el-button>
        <el-button type="primary" @click="importPersonnel" :disabled="!importPreview.length" class="confirm-button">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search, ArrowDown, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const personnelList = ref([])
const equipmentList = ref([])
const safetyList = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const showImportDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)
const filterResponsibility = ref('')
const searchQuery = ref('')
const selectedRows = ref([])
const viewForm = reactive({})
const fileList = ref([])
const importPreview = ref([])

// 相关设备列表
const relatedEquipment = computed(() => {
  if (!viewForm.id) return []
  return equipmentList.value.filter(item => item.operator === viewForm.name)
})

// 相关巡检记录
const relatedSafetyInspections = computed(() => {
  if (!viewForm.id) return []
  return safetyList.value.filter(item => {
    if (item.inspector === viewForm.name) return true
    if (item.personnels) {
      return item.personnels.some(personnel => personnel.id === viewForm.id || personnel.name === viewForm.name)
    }
    return false
  })
})

// 获取状态样式类
const getStatusClass = (status) => {
  return status === '正常' ? 'status-tag success-tag' : 'status-tag danger-tag'
}

const form = reactive({
  id: '',
  name: '',
  position: '',
  responsibility: '',
  supervisor: '',
  block: '',
  team: '',
  phone: ''
})

const rules = {
  id: [],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  position: [
    { required: true, message: '请输入岗位', trigger: 'blur' },
    { min: 2, max: 50, message: '岗位长度应在2-50个字符之间', trigger: 'blur' }
  ],
  responsibility: [
    { required: true, message: '请选择责任主体', trigger: 'blur' }
  ],
  supervisor: [
    { required: false, message: '请输入负责人', trigger: 'blur' },
    { min: 0, max: 50, message: '负责人长度不能超过50个字符', trigger: 'blur' }
  ],
  block: [
    { required: false, message: '请选择负责区块', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  team: [
    { min: 0, max: 50, message: '班组长度不能超过50个字符', trigger: 'blur' }
  ]
}

// 检查当前用户是否为管理员
const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

// 筛选后的人员列表
const filteredPersonnelList = computed(() => {
  let filtered = personnelList.value
  
  // 按责任主体筛选
  if (filterResponsibility.value) {
    filtered = filtered.filter(item => item.responsibility === filterResponsibility.value)
  }
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 建设单位人员列表
const constructionUnitPersonnel = computed(() => {
  let filtered = personnelList.value.filter(item => item.responsibility === '建设单位')
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 监理单位人员列表
const supervisionUnitPersonnel = computed(() => {
  let filtered = personnelList.value.filter(item => item.responsibility === '监理单位')
  
  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// 施工单位人员列表
const builderUnitPersonnel = computed(() => {
  let filtered = personnelList.value.filter(item => item.responsibility === '施工单位')

  // 按搜索关键词筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 加载进度和质检数据
const progressList = ref([])
const qualityList = ref([])

const loadProgressAndQuality = async () => {
  try {
    progressList.value = await dataService.get('progress', [])
    qualityList.value = await dataService.get('quality', [])
  } catch (error) {
    console.error('加载进度和质检数据失败:', error)
  }
}

// 计算人员评分
const calculatePersonnelScore = (person) => {
  const BASE_SCORE = 100
  const penaltyRecords = []
  let totalPenalty = 0

  // 检查该人员负责区块的进度超时情况
  if (person.block) {
    const blockProgress = progressList.value.find(p => p.block === person.block)
    if (blockProgress && blockProgress.status === '超时') {
      const count = blockProgress.timeoutCount || 1
      totalPenalty += count
      penaltyRecords.push({ type: 'progress', count })
    }
  }

  // 检查该人员的质量不合格记录
  const personQualityIssues = qualityList.value.filter(q =>
    q.personId === person.id || q.personName === person.name
  )
  if (personQualityIssues.length > 0) {
    totalPenalty += personQualityIssues.length
    penaltyRecords.push({ type: 'quality', count: personQualityIssues.length })
  }

  // 检查是否是负责人，计算下属扣分连带
  const subordinates = personnelList.value.filter(p =>
    p.supervisor === person.name && p.id !== person.id
  )
  if (subordinates.length > 0) {
    let subordinatePenalty = 0
    subordinates.forEach(sub => {
      const subScore = calculatePersonnelScore(sub)
      if (subScore.penalty > 0) {
        subordinatePenalty += subScore.penalty
      }
    })
    if (subordinatePenalty > 0) {
      totalPenalty += subordinatePenalty
      penaltyRecords.push({ type: 'leader', count: subordinatePenalty })
    }
  }

  return {
    ...person,
    baseScore: BASE_SCORE,
    penalty: totalPenalty,
    finalScore: Math.max(BASE_SCORE - totalPenalty, 0),
    penaltyRecords
  }
}

// 评分排名列表
const rankedPersonnel = computed(() => {
  const scores = builderUnitPersonnel.value.map(person => calculatePersonnelScore(person))
  return scores.sort((a, b) => b.finalScore - a.finalScore)
})

// 满分人数
const perfectCount = computed(() => {
  return rankedPersonnel.value.filter(p => p.finalScore === 100).length
})

// 平均分
const averageScore = computed(() => {
  if (rankedPersonnel.value.length === 0) return 100
  const total = rankedPersonnel.value.reduce((sum, p) => sum + p.finalScore, 0)
  return Math.round(total / rankedPersonnel.value.length)
})

// 获取排名样式类
const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-default'
}

// 获取评分颜色
const getScoreColor = (score) => {
  if (score >= 90) return '#00B42A'
  if (score >= 70) return '#FF6600'
  if (score >= 50) return '#FF7D00'
  return '#F53F3F'
}

// 获取评分文字样式类
const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 70) return 'score-good'
  if (score >= 50) return 'score-warning'
  return 'score-danger'
}

// 获取区块标签类型
const getBlockTagType = (block) => {
  const types = { A: '', B: 'success', C: 'warning', D: 'danger' }
  return types[block] || ''
}

const loadData = async () => {
  try {
    personnelList.value = await dataService.get('personnel', [])
    equipmentList.value = await dataService.get('equipment', [])
    safetyList.value = await dataService.get('safety', [])
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  }
}

let unsubscribePersonnel = null

const subscribeToDataChanges = () => {
  unsubscribePersonnel = dataService.subscribe('personnel', (data) => {
    if (data) {
      personnelList.value = data
    }
  })
}

onMounted(() => {
  subscribeToDataChanges()
  loadData()
  loadProgressAndQuality()
})

onUnmounted(() => {
  if (unsubscribePersonnel) {
    unsubscribePersonnel()
  }
})

// 查看人员详情
const viewPersonnel = (row) => {
  Object.assign(viewForm, row)
  viewDialogVisible.value = true
}

const constructionPersonnel = computed(() => {
  return personnelList.value.filter(item => item.responsibility === '施工单位')
})

const handleSupervisorChange = (selectedName) => {
  // 可以在这里添加额外的逻辑，比如自动填充其他字段
  console.log('选择负责人:', selectedName)
}

// 检查编号是否重复
const checkIdUnique = (id) => {
  return !personnelList.value.some(item => item.id === id && item.id !== currentId.value)
}

// 验证编号唯一性的自定义验证规则
const validateIdUnique = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  if (!checkIdUnique(value)) {
    callback(new Error('编号已存在，请使用其他编号'))
  } else {
    callback()
  }
}

// 检查循环关联
const checkCircularAssociation = (personId, supervisorName) => {
  if (!supervisorName) return false
  
  const supervisor = personnelList.value.find(p => p.name === supervisorName)
  if (!supervisor) return false
  
  let current = supervisor
  const visited = new Set()
  visited.add(current.id)
  
  while (current && current.supervisor && current.supervisor !== current.name) {
    if (current.id === personId) {
      return true
    }
    if (visited.has(current.id)) {
      return true
    }
    visited.add(current.id)
    current = personnelList.value.find(p => p.name === current.supervisor)
  }
  
  return false
}

// 负责人自定义验证规则
const validateSupervisor = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  
  if (form.responsibility !== '施工单位') {
    callback()
    return
  }
  
  if (value === form.name) {
    callback()
    return
  }
  
  const supervisorExists = personnelList.value.some(p => p.name === value && p.id !== currentId.value)
  
  if (!supervisorExists) {
    callback(new Error('该负责人未在系统中登记，请先录入该负责人信息'))
    return
  }
  
  if (checkCircularAssociation(currentId.value, value)) {
    callback(new Error('存在循环关联，请检查负责人设置'))
    return
  }
  
  callback()
}

// 添加编号唯一性验证规则
rules.id.push({ validator: validateIdUnique, trigger: 'blur' })

// 添加负责人验证规则
rules.supervisor.push({ validator: validateSupervisor, trigger: 'blur' })

// 打开添加表单
const openDialog = () => {
  isEdit.value = false
  currentId.value = null
  Object.assign(form, {
    id: '',
    name: '',
    gender: '男',
    age: 30,
    position: '',
    responsibility: '',
    supervisor: '',
    block: '',
    team: '',
    phone: ''
  })
  dialogVisible.value = true
}

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

const editPersonnel = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const deletePersonnel = (row) => {
  ElMessageBox.confirm('确定要删除该人员信息吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const index = personnelList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        const deletedPerson = personnelList.value[index]
        personnelList.value.splice(index, 1)
        await dataService.set('personnel', personnelList.value)
        
        // 记录删除操作到系统日志
        const currentUser = dataService.get('currentUser')
        const logMessage = `${currentUser.username} 删除了人员: ${deletedPerson.name} (${deletedPerson.id})`
        dataService.addLog('info', logMessage)
        
        ElMessage.success('删除成功')
      }
    } catch (error) {
      console.error('删除人员失败:', error)
      ElMessage.error('删除人员失败，请稍后重试')
    }
  }).catch(() => {})
}

// 批量删除
const batchDelete = () => {
  if (selectedRows.value.length === 0) return
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条人员信息吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const deletedNames = selectedRows.value.map(row => row.name).join(', ')
      selectedRows.value.forEach(row => {
        const index = personnelList.value.findIndex(item => item.id === row.id)
        if (index > -1) {
          personnelList.value.splice(index, 1)
        }
      })
      await dataService.set('personnel', personnelList.value)
      
      // 记录批量删除操作到系统日志
      const currentUser = dataService.get('currentUser')
      const logMessage = `${currentUser.username} 批量删除了人员: ${deletedNames}`
      dataService.addLog('info', logMessage)
      
      ElMessage.success('批量删除成功')
      selectedRows.value = []
    } catch (error) {
      console.error('批量删除人员失败:', error)
      ElMessage.error('批量删除人员失败，请稍后重试')
    }
  }).catch(() => {})
}

// 处理选择变化
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 申请删除权限
const requestDeletePermission = (row) => {
  ElMessageBox.confirm('您需要管理员批准才能删除人员，是否提交申请?', '权限申请', {
    confirmButtonText: '提交申请',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      // 获取当前用户
      const currentUser = dataService.get('currentUser')
      
      // 创建申请
      const application = {
        id: dataService.generateId(),
        type: 'delete_personnel',
        requester: currentUser.username,
        requesterId: currentUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        data: {
          personnelId: row.id,
          personnelName: row.name
        },
        description: `申请删除人员: ${row.name} (${row.id})`
      }
      
      // 保存申请到工作流
      const applications = await dataService.get('workflowApplications', [])
      applications.unshift(application)
      await dataService.set('workflowApplications', applications)
      
      // 记录申请操作到系统日志
      const logMessage = `${currentUser.username} 申请删除人员: ${row.name} (${row.id})`
      dataService.addLog('info', logMessage)
      
      ElMessage.success('申请已提交，请等待管理员批准')
    } catch (error) {
      console.error('提交删除申请失败:', error)
      ElMessage.error('提交删除申请失败，请稍后重试')
    }
  }).catch(() => {})
}

const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const currentUser = dataService.get('currentUser')
        if (!currentUser) {
          ElMessage.error('用户未登录，请重新登录')
          return
        }
        
        let logMessage = ''
        
        if (isEdit.value) {
          const index = personnelList.value.findIndex(item => item.id === currentId.value)
          if (index > -1) {
            const oldPerson = { ...personnelList.value[index] }
            personnelList.value[index] = { ...form }
            logMessage = `${currentUser.username} 编辑了人员: ${form.name} (${form.id})`
          } else {
            ElMessage.error('编辑的人员不存在，请刷新页面重试')
            return
          }
        } else {
          const generatePersonnelId = () => {
            const prefixMap = {
              '建设单位': 'JS',
              '监理单位': 'JL',
              '施工单位': 'SG'
            }
            const prefix = prefixMap[form.responsibility] || 'RY'
            const date = new Date()
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
            
            const samePrefixIds = personnelList.value
              .filter(p => p.id && p.id.startsWith(prefix))
              .map(p => parseInt(p.id.split('-').pop()) || 0)
            
            const nextNum = samePrefixIds.length > 0 ? Math.max(...samePrefixIds) + 1 : 1
            const numStr = String(nextNum).padStart(3, '0')
            
            return `${prefix}-${dateStr}-${numStr}`
          }
          
          form.id = generatePersonnelId()
          
          const users = await dataService.get('users', [])
          const existingUser = users.find(u => u.phone === form.phone)
          
          if (!existingUser && form.phone) {
            try {
              const newUser = {
                id: form.id,
                name: form.name,
                phone: form.phone,
                password: '123456',
                responsibility: form.responsibility,
                age: form.age,
                createdAt: new Date().toISOString()
              }
              users.push(newUser)
              await dataService.set('users', users)
              logMessage = `${currentUser.username} 添加了人员: ${form.name} (${form.id})，并创建了登录账号（默认密码：123456）`
            } catch (userError) {
              console.error('创建用户账号失败:', userError)
              logMessage = `${currentUser.username} 添加了人员: ${form.name} (${form.id})，但创建登录账号失败`
            }
          } else if (existingUser) {
            logMessage = `${currentUser.username} 添加了人员: ${form.name} (${form.id})，该手机号已有登录账号`
          } else {
            logMessage = `${currentUser.username} 添加了人员: ${form.name} (${form.id})`
          }
          
          if (form.responsibility === '施工单位') {
            if (form.supervisor && form.supervisor === form.name) {
              form.isTopManager = true
              form.managerChain = [form.id]
            } else if (form.supervisor) {
              form.isTopManager = false
              const supervisor = personnelList.value.find(p => p.name === form.supervisor)
              if (supervisor) {
                form.managerChain = supervisor.managerChain ? [...supervisor.managerChain, form.id] : [supervisor.id, form.id]
              } else {
                form.managerChain = [form.id]
              }
            } else {
              form.isTopManager = false
              form.managerChain = [form.id]
            }
          }
          
          personnelList.value.push({ ...form })
          if (!logMessage) {
            logMessage = `${currentUser.username} 添加了人员: ${form.name} (${form.id})`
          }
        }
        
        await dataService.set('personnel', personnelList.value)
        
        if (logMessage) {
          try {
            await dataService.addLog('info', logMessage)
          } catch (logError) {
            console.error('记录日志失败:', logError)
          }
        }
        
        dialogVisible.value = false
        ElMessage.success(isEdit.value ? '编辑成功' : '添加成功，已自动创建登录账号（默认密码：123456）')
      } catch (error) {
        console.error('保存人员信息失败:', error)
        ElMessage.error('保存人员信息失败，请稍后重试')
        if (isEdit.value) {
          await loadData()
        }
      }
    }
  })
}

// 获取责任链（递归获取上级负责人）
const getResponsibilityChain = (personId) => {
  const person = personnelList.value.find(p => p.id === personId)
  if (!person) return []
  
  const chain = [person]
  
  if (person.supervisor && person.supervisor !== person.name) {
    const supervisor = personnelList.value.find(p => p.name === person.supervisor)
    if (supervisor) {
      const supervisorChain = getResponsibilityChain(supervisor.id)
      chain.push(...supervisorChain)
    }
  }
  
  return chain
}

// 获取所有连带责任的人员
const getResponsiblePersons = (personId) => {
  const chain = getResponsibilityChain(personId)
  return chain.filter(p => p.id !== personId)
}

const getPersonById = (personId) => {
  return personnelList.value.find(p => p.id === personId)
}

// 导出人员数据
const exportPersonnel = () => {
  try {
    const data = personnelList.value
    if (data.length === 0) {
      ElMessage.warning('没有人员数据可导出')
      return
    }
    
    // 转换为CSV格式
    const headers = ['编号', '姓名', '岗位', '责任主体', '班组', '联系电话']
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.id,
        `"${item.name}"`,
        `"${item.position}"`,
        `"${item.responsibility}"`,
        `"${item.team || ''}"`,
        item.phone
      ].join(','))
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `人员数据_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 记录导出操作
    const currentUser = dataService.get('currentUser')
    if (currentUser) {
      dataService.addLog('info', `${currentUser.username} 导出了人员数据`, { count: data.length })
    }
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出人员数据失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 处理文件选择
const handleFileChange = (file) => {
  fileList.value = [file]
  importPreview.value = []
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      // 简单解析CSV文件
      const lines = text.split('\n')
      if (lines.length < 2) {
        ElMessage.warning('文件格式不正确，缺少数据')
        return
      }
      
      // 解析表头
      const headers = lines[0].split(',').map(h => h.trim())
      
      // 解析数据行
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const item = {}
        
        // 映射字段
        headers.forEach((header, index) => {
          switch (header) {
            case '编号':
            case 'id':
              item.id = values[index] || dataService.generateId()
              break
            case '姓名':
            case 'name':
              item.name = values[index]
              break
            case '岗位':
            case 'position':
              item.position = values[index]
              break
            case '责任主体':
            case 'responsibility':
              item.responsibility = values[index]
              break
            case '班组':
            case 'team':
              item.team = values[index]
              break
            case '联系电话':
            case 'phone':
              item.phone = values[index]
              break
          }
        })
        
        // 验证必要字段
        if (item.name && item.position && item.responsibility) {
          importPreview.value.push(item)
        }
      }
      
      if (importPreview.value.length === 0) {
        ElMessage.warning('未找到有效的人员数据')
      }
    } catch (error) {
      console.error('解析文件失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  
  reader.readAsText(file.raw, 'UTF-8')
}

// 导入人员数据
const importPersonnel = async () => {
  try {
    if (importPreview.value.length === 0) {
      ElMessage.warning('没有可导入的数据')
      return
    }
    
    // 检查重复编号
    const existingIds = new Set(personnelList.value.map(item => item.id))
    const newPersonnel = importPreview.value.map(item => {
      // 生成新编号如果重复
      if (existingIds.has(item.id)) {
        item.id = dataService.generateId()
      }
      existingIds.add(item.id)
      return item
    })
    
    // 添加到现有列表
    personnelList.value = [...personnelList.value, ...newPersonnel]
    await dataService.set('personnel', personnelList.value)
    
    // 记录导入操作
    const currentUser = dataService.get('currentUser')
    if (currentUser) {
      dataService.addLog('info', `${currentUser.username} 导入了 ${newPersonnel.length} 条人员数据`)
    }
    
    ElMessage.success(`成功导入 ${newPersonnel.length} 条人员数据`)
    showImportDialog.value = false
    fileList.value = []
    importPreview.value = []
  } catch (error) {
    console.error('导入人员数据失败:', error)
    ElMessage.error('导入失败，请稍后重试')
  }
}

const resetPersonnelData = async () => {
  if (!isAdmin.value) {
    ElMessage.error('您没有执行此操作的权限')
    return
  }

  ElMessageBox.confirm(
    '此操作将清空所有人员数据，且不可恢复！确定要继续吗？',
    '⚠️ 确认重置人员数据',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await dataService.set('personnel', [])
      personnelList.value = []
      
      const currentUser = dataService.get('currentUser')
      if (currentUser) {
        dataService.addLog('info', `${currentUser.username} 重置了所有人员数据`)
      }
      
      ElMessage.success('人员数据已成功重置')
    } catch (error) {
      console.error('重置人员数据失败:', error)
      ElMessage.error('重置失败，请稍后重试')
    }
  }).catch(() => {})
}
</script>

<style scoped>
/* YTO Brand Personnel Management */
.personnel-management {
  padding: 0;
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}



/* Three Responsibility Bodies Side by Side */
.personnel-cards-container {
  display: flex;
  gap: var(--future-spacing-lg);
  padding: 8px 24px var(--future-spacing-lg) 24px;
  overflow-x: auto;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
}

.personnel-cards-container .personnel-card {
  flex: 1;
  min-width: 400px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.personnel-cards-container .card-content {
  flex: 1;
  overflow: auto;
  min-height: auto;
}

/* Professional Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--future-spacing-lg);
  padding: 24px 24px 0 24px;
  box-sizing: border-box;
  animation: futurismSlideInDown var(--future-transition-normal) var(--future-easing);
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--future-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
  font-family: var(--future-font-family);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.page-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: var(--future-primary);
  border-radius: var(--future-radius-full);
}

@keyframes professionalSlideInDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: var(--future-spacing-sm);
  align-items: center;
}

/* Professional Add Button - YTO Brand */
.add-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  background: var(--future-primary);
  border: 1px solid var(--future-primary);
  color: #ffffff;
  border-radius: var(--future-radius-md);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.add-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}

/* Professional Batch Delete Button - YTO Brand */
.batch-delete-button {
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

.batch-delete-button:hover:not(:disabled) {
  background: var(--future-danger);
  border-color: var(--future-danger);
  color: #ffffff;
}

.batch-delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Professional Personnel Card - Liquid Glass */
.personnel-card {
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
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  will-change: transform, box-shadow;
  position: relative;
  overflow: hidden;
  margin-bottom: var(--future-spacing-lg);
}

.personnel-card:hover {
  transform: translateY(-8px);
  box-shadow:
    0 16px 40px rgba(102, 0, 153, 0.25),
    0 6px 20px rgba(102, 0, 153, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(102, 0, 153, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 板块标题样式 - YTO Brand */
.card-header {
  padding: 20px 24px;
  border-bottom: 2px solid rgba(77, 20, 140, 0.08);
  background: linear-gradient(135deg, 
    rgba(77, 20, 140, 0.05) 0%, 
    rgba(252, 70, 22, 0.03) 50%,
    rgba(77, 20, 140, 0.02) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.card-header::before {
  display: none;
}

/* Search Input - YTO Brand */
.search-input {
  min-width: 220px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: 12px;
  color: var(--future-text-primary);
  font-family: var(--future-font-family-secondary);
  transition: all var(--future-transition-fast) var(--future-easing);
  box-shadow: 0 2px 8px rgba(77, 20, 140, 0.08);
}

.search-input:hover {
  border-color: rgba(77, 20, 140, 0.5);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.15);
  transform: translateY(-1px);
}

.search-input:focus {
  border-color: var(--future-primary);
  box-shadow: 0 0 0 4px rgba(77, 20, 140, 0.15), 0 4px 16px rgba(77, 20, 140, 0.2);
  transform: translateY(-2px);
}

.search-input .el-input__wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: var(--future-radius-md) !important;
}

.search-input .el-input__inner {
  background: transparent !important;
  border: none !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
}

.search-input .el-input__icon {
  color: var(--future-primary) !important;
}

.card-content {
  padding: var(--future-spacing-md);
  position: relative;
  z-index: 1;
  min-height: 400px;
}

/* Empty State - YTO Brand */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: var(--future-text-muted);
}

/* Professional Table - YTO Brand */
.personnel-table {
  width: 100%;
  background: #ffffff;
  border-radius: var(--future-radius-md);
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.personnel-table th {
  background: rgba(77, 20, 140, 0.05) !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
  font-weight: 600;
  border-bottom: 1px solid rgba(77, 20, 140, 0.15) !important;
}

.personnel-table td {
  background: #ffffff !important;
  color: var(--future-text-secondary) !important;
  font-family: var(--future-font-family-secondary);
  border-bottom: 1px solid rgba(77, 20, 140, 0.08) !important;
  transition: all var(--future-transition-fast) var(--future-easing);
}

.personnel-table tr:hover td {
  background: rgba(77, 20, 140, 0.03) !important;
}

.personnel-table .el-table__row.el-table__row--striped td {
  background: rgba(77, 20, 140, 0.02) !important;
}

.personnel-table .el-table__row.el-table__row--striped:hover td {
  background: rgba(77, 20, 140, 0.05) !important;
}



/* Professional Dialog - YTO Brand */
.personnel-dialog {
  background: #ffffff !important;
  border: 1px solid rgba(77, 20, 140, 0.15) !important;
  border-radius: var(--future-radius-lg) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 9999 !important;
  margin: 0 !important;
}

.personnel-dialog .el-dialog__title {
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary) !important;
  font-weight: 600 !important;
}

.personnel-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(77, 20, 140, 0.1) !important;
  padding: var(--future-spacing-lg) var(--future-spacing-lg) var(--future-spacing-md) !important;
}

.personnel-dialog .el-dialog__body {
  padding: var(--future-spacing-lg) !important;
  background: #ffffff !important;
}

.personnel-dialog .el-dialog__footer {
  border-top: 1px solid rgba(77, 20, 140, 0.1) !important;
  padding: var(--future-spacing-md) var(--future-spacing-lg) var(--future-spacing-lg) !important;
  background: #ffffff !important;
}

/* Professional Form - YTO Brand */
.personnel-form {
  padding: 0;
}

.form-item {
  margin-bottom: var(--future-spacing-md);
}

.form-item .el-form-item__label {
  font-weight: 500;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
}

/* Professional Form Inputs - YTO Brand */
.form-input {
  width: 100%;
  background: #ffffff;
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: var(--future-radius-md);
  color: var(--future-text-primary);
  font-family: var(--future-font-family-secondary);
  transition: all var(--future-transition-fast) var(--future-easing);
}

.form-input:hover {
  border-color: rgba(77, 20, 140, 0.4);
}

.form-input:focus {
  border-color: var(--future-primary);
  box-shadow: 0 0 0 3px rgba(77, 20, 140, 0.1);
}

.form-input .el-input__wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: var(--future-radius-md) !important;
}

.form-input .el-input__inner {
  background: transparent !important;
  border: none !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
}

/* Professional Radio Group - YTO Brand */
.radio-group {
  display: flex;
  gap: var(--future-spacing-md);
}

.radio-item {
  font-size: 14px;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
  transition: all var(--future-transition-fast) var(--future-easing);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  border-radius: var(--future-radius-md);
  border: 1px solid rgba(77, 20, 140, 0.2);
  cursor: pointer;
}

.radio-item:hover {
  color: var(--future-primary);
  border-color: var(--future-primary);
}

.radio-item.is-checked {
  background: rgba(77, 20, 140, 0.1);
  color: var(--future-primary);
  border-color: var(--future-primary);
}

/* Professional Table Buttons - YTO Brand */
.view-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid rgba(77, 20, 140, 0.3);
  background: transparent;
  color: var(--future-primary);
  border-radius: var(--future-radius-md);
  margin-right: var(--future-spacing-sm);
  padding: 4px 12px;
  font-size: 12px;
}

.view-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
}

.edit-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid rgba(77, 20, 140, 0.3);
  background: transparent;
  color: var(--future-primary);
  border-radius: var(--future-radius-md);
  margin-right: var(--future-spacing-sm);
  padding: 4px 12px;
  font-size: 12px;
}

.edit-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
}

.delete-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid var(--future-danger);
  background: transparent;
  color: var(--future-danger);
  border-radius: var(--future-radius-md);
  padding: 4px 12px;
  font-size: 12px;
}

.delete-button:hover {
  background: var(--future-danger);
  border-color: var(--future-danger);
  color: #ffffff;
}

/* Professional Request Button - YTO Brand */
.request-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid var(--future-warning);
  background: transparent;
  color: var(--future-warning);
  border-radius: var(--future-radius-md);
  padding: 4px 12px;
  font-size: 12px;
}

.request-button:hover {
  background: var(--future-warning);
  border-color: var(--future-warning);
  color: #ffffff;
}

/* Professional Import Export Button - YTO Brand */
.import-export-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid rgba(77, 20, 140, 0.3);
  background: transparent;
  color: var(--future-primary);
  border-radius: var(--future-radius-md);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.import-export-button:hover {
  background: rgba(77, 20, 140, 0.1);
  border-color: var(--future-primary);
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

/* Professional Import Section */
.import-section {
  padding: var(--future-spacing-md);
}

.upload-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  background: var(--future-primary);
  border: 1px solid var(--future-primary);
  color: #ffffff;
  border-radius: var(--future-radius-md);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
}

.upload-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}

/* Professional Import Preview */
.import-preview {
  margin-top: var(--future-spacing-lg);
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--future-text-primary);
  margin-bottom: var(--future-spacing-md);
  font-family: var(--future-font-family-secondary);
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.preview-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: var(--future-primary);
  border-radius: var(--future-radius-full);
}

/* Professional Dialog Buttons - YTO Brand */
.cancel-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border: 1px solid rgba(77, 20, 140, 0.2);
  background: transparent;
  color: var(--future-text-primary);
  border-radius: var(--future-radius-md);
  margin-right: var(--future-spacing-sm);
  padding: 8px 16px;
}

.cancel-button:hover {
  border-color: var(--future-primary);
  color: var(--future-primary);
}

.confirm-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  background: var(--future-primary);
  border: 1px solid var(--future-primary);
  color: #ffffff;
  border-radius: var(--future-radius-md);
  padding: 8px 16px;
}

.confirm-button:hover {
  background: var(--future-primary-dark);
  border-color: var(--future-primary-dark);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}

/* Professional Date Picker - YTO Brand */
.form-input .el-date-picker__input {
  background: transparent !important;
  border: none !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
}

.form-input .el-date-picker__icon {
  color: var(--future-primary) !important;
}

/* Professional Input Number - YTO Brand */
.form-input .el-input-number__decrease,
.form-input .el-input-number__increase {
  background: #ffffff !important;
  border: 1px solid rgba(77, 20, 140, 0.2) !important;
  color: var(--future-primary) !important;
  border-radius: var(--future-radius-md) !important;
}

.form-input .el-input-number__decrease:hover,
.form-input .el-input-number__increase:hover {
  background: rgba(77, 20, 140, 0.1) !important;
  border-color: var(--future-primary) !important;
}

/* Professional Personnel Details - YTO Brand */
.personnel-details {
  padding: var(--future-spacing-md);
}

.detail-row {
  display: flex;
  margin-bottom: var(--future-spacing-md);
  align-items: center;
}

.detail-label {
  width: 100px;
  font-weight: 500;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
  margin-right: var(--future-spacing-md);
}

.detail-value {
  flex: 1;
  color: var(--future-text-primary);
  font-family: var(--future-font-family-secondary);
  line-height: 1.4;
}

/* Professional Detail Section - YTO Brand */
.detail-section {
  margin-top: var(--future-spacing-lg);
  padding-top: var(--future-spacing-md);
  border-top: 1px solid rgba(77, 20, 140, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--future-text-primary);
  margin: 0;
  font-family: var(--future-font-family-secondary);
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: 2px;
  position: relative;
  padding-left: 16px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  width: 5px;
  height: 24px;
  background: linear-gradient(180deg, var(--future-primary) 0%, var(--future-secondary) 100%);
  border-radius: var(--future-radius-full);
}



.related-items-list {
  margin-top: var(--future-spacing-sm);
}

.related-items-table {
  width: 100%;
  background: #ffffff;
  border-radius: var(--future-radius-md);
  overflow: hidden;
  border: 1px solid rgba(77, 20, 140, 0.1);
}

.related-items-table th {
  background: rgba(77, 20, 140, 0.05) !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
  font-weight: 600;
  border-bottom: 1px solid rgba(77, 20, 140, 0.15) !important;
  border-radius: 0 !important;
  font-size: 12px;
  padding: 8px 12px !important;
}

.related-items-table td {
  background: #ffffff !important;
  color: var(--future-text-secondary) !important;
  font-family: var(--future-font-family-secondary);
  border-bottom: 1px solid rgba(77, 20, 140, 0.08) !important;
  transition: all var(--future-transition-fast) var(--future-easing);
  border-radius: 0 !important;
  font-size: 12px;
  padding: 8px 12px !important;
}

.related-items-table tr:hover td {
  background: rgba(77, 20, 140, 0.03) !important;
}

.no-related-items {
  text-align: center;
  padding: var(--future-spacing-lg);
  color: var(--future-text-muted);
  font-family: var(--future-font-family-secondary);
  font-style: italic;
}

/* Professional Status Tags - YTO Brand */
.status-tag {
  border-radius: var(--future-radius-full) !important;
  padding: 2px 12px !important;
  font-family: var(--future-font-family-secondary) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  border: 1px solid transparent !important;
  transition: all var(--future-transition-fast) var(--future-easing) !important;
}

.success-tag {
  background: rgba(103, 194, 58, 0.1) !important;
  color: #67c23a !important;
  border-color: rgba(103, 194, 58, 0.3) !important;
}

.danger-tag {
  background: rgba(255, 82, 82, 0.1) !important;
  color: #f56c6c !important;
  border-color: rgba(255, 82, 82, 0.3) !important;
}

/* Professional Responsive Design - YTO Brand */
@media (max-width: 1200px) {
  .personnel-cards-container {
    flex-direction: column;
  }
  
  .personnel-cards-container .personnel-card {
    min-width: unset;
    margin-bottom: var(--future-spacing-lg);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--future-spacing-md);
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .personnel-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .card-content {
    padding: var(--future-spacing-md);
  }
  
  .search-input {
    width: 100%;
    min-width: unset;
  }
  
  .radio-group {
    flex-direction: column;
    gap: var(--future-spacing-sm);
  }
  
  .radio-item {
    width: 100%;
    text-align: center;
  }
  
  .personnel-table {
    font-size: 12px;
  }
  
  .view-button,
  .edit-button,
  .delete-button,
  .request-button {
    font-size: 12px;
    padding: 0 8px;
    margin-bottom: 4px;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--future-spacing-xs);
  }
  
  .detail-label {
    width: 100%;
    margin-right: 0;
  }
  
  .detail-value {
    width: 100%;
  }
  
  .related-items-table {
    font-size: 11px;
  }
  
  .related-items-table th,
  .related-items-table td {
    padding: 6px 8px !important;
  }
}

/* 责任追溯链 */
.responsibility-chain {
  display: flex;
  flex-wrap: wrap;
  gap: var(--future-spacing-md);
  align-items: center;
  padding: var(--future-spacing-md);
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.05), rgba(102, 0, 153, 0.02));
  border-radius: 12px;
  border: 1px solid rgba(102, 0, 153, 0.1);
}

.chain-item {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.chain-person {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 0, 153, 0.1);
}

.chain-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #660099, #9933cc);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.chain-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chain-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.chain-position {
  font-size: 12px;
  color: #666;
}

.chain-arrow {
  color: #660099;
  font-size: 20px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .responsibility-chain {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chain-item {
    width: 100%;
  }
  
  .chain-arrow {
    transform: rotate(90deg);
  }
}

/* 评分排名系统 */
.ranking-section {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.12);
  margin: 16px 24px;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ranking-stats {
  display: flex;
  gap: 20px;
}

.ranking-stats .stat-item {
  font-size: 13px;
  color: var(--future-text-secondary);
  padding: 4px 12px;
  background: rgba(102, 0, 153, 0.08);
  border-radius: 20px;
}

.rules-card {
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.08), rgba(102, 0, 153, 0.03));
  border: 1px solid rgba(102, 0, 153, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.rules-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--future-primary);
  margin-bottom: 10px;
}

.rules-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-icon {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.rule-icon.negative {
  background: #F53F3F;
  color: white;
}

.rule-icon.leader {
  background: #FF6600;
  color: white;
}

.rule-text {
  font-size: 13px;
  color: var(--future-text-secondary);
}

.ranking-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.ranking-table {
  font-family: var(--future-font-family-secondary);
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 2px 8px rgba(255, 165, 0, 0.4);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  box-shadow: 0 2px 8px rgba(160, 160, 160, 0.4);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  box-shadow: 0 2px 8px rgba(184, 134, 11, 0.4);
}

.rank-default {
  background: rgba(102, 0, 153, 0.2);
  color: var(--future-primary);
}

.person-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person-avatar {
  background: linear-gradient(135deg, #660099, #9933CC);
  color: white;
  font-weight: 600;
}

.person-details {
  display: flex;
  flex-direction: column;
}

.person-name {
  font-weight: 600;
  color: var(--future-text-primary);
}

.person-position {
  font-size: 12px;
  color: var(--future-text-muted);
}

.no-data {
  color: var(--future-text-muted);
  font-style: italic;
  font-size: 12px;
}

.supervisor-name {
  color: var(--future-text-secondary);
  font-size: 13px;
}

.base-score {
  color: var(--future-text-muted);
}

.penalty-score {
  color: var(--future-text-muted);
}

.penalty-score.has-penalty {
  color: #F53F3F;
  font-weight: 600;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-progress {
  flex: 1;
}

.score-value {
  font-weight: 700;
  font-size: 16px;
  min-width: 36px;
  text-align: right;
}

.score-excellent {
  color: #00B42A;
}

.score-good {
  color: #FF6600;
}

.score-warning {
  color: #FF7D00;
}

.score-danger {
  color: #F53F3F;
}

.penalty-records {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.penalty-tag {
  margin: 2px;
}

.no-penalty {
  color: #00B42A;
  font-size: 12px;
}

</style>
