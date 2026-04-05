<template>
  <div class="progress-management-pro">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon class="title-icon"><TrendCharts /></el-icon>
        施工进度管理（专业版）
      </h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCopyDialog">
          <el-icon><DocumentCopy /></el-icon>
          复制模板
        </el-button>
        <el-button @click="showBatchDialog">
          <el-icon><List /></el-icon>
          批量修改
        </el-button>
        <el-button @click="toggleView">
          <el-icon><Switch /></el-icon>
          {{ viewMode === 'tree' ? '甘特图' : '树形图' }}
        </el-button>
        <el-button type="success" @click="saveAllData">
          <el-icon><DocumentAdd /></el-icon>
          保存所有数据
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-sidebar">
        <div
          v-for="block in blockNames"
          :key="block"
          :class="['area-card', { active: activeArea === block }]"
          @click="switchArea(block)"
        >
          <div class="area-header">
            <h3 class="area-name">{{ block }} 区块</h3>
            <el-tag :type="getAreaStatus(block)" size="small">
              {{ getAreaStatusText(block) }}
            </el-tag>
          </div>
          
          <div class="progress-section">
            <div class="progress-ring-container">
              <svg class="progress-ring" viewBox="0 0 100 100">
                <circle class="progress-ring-bg" cx="50" cy="50" r="40"></circle>
                <circle 
                  class="progress-ring-progress" 
                  cx="50" 
                  cy="50" 
                  r="40"
                  :stroke-dasharray="251.2"
                  :stroke-dashoffset="251.2 - (251.2 * getAreaProgress(block) / 100)"
                ></circle>
              </svg>
              <div class="progress-text">
                <span class="progress-value">{{ getAreaProgress(block) }}%</span>
                <span class="progress-label">进度</span>
              </div>
            </div>
          </div>

          <div class="area-stats">
            <div class="stat-item">
              <el-icon class="stat-icon"><Check /></el-icon>
              <span class="stat-text">{{ getCompletedTasks(block) }}/{{ getTotalTasks(block) }}</span>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon warning"><Warning /></el-icon>
              <span class="stat-text">{{ getDelayedTasks(block) }}</span>
            </div>
          </div>

          <div class="area-footer">
            <div class="date-item">
              <el-icon><Calendar /></el-icon>
              <span>预计竣工: {{ getEstimatedEndDate(block) || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-content">
        <div v-if="viewMode === 'tree'" class="tree-container">
          <div class="search-bar">
            <el-input 
              v-model="searchKeyword"
              placeholder="搜索节点..."
              clearable
              prefix-icon="Search"
              @input="filterTree"
            />
            <el-button @click="expandAll">{{ expandedAll ? '全部收起' : '全部展开' }}</el-button>
          </div>
          
          <div class="tree-wrapper">
            <el-tree
              ref="treeRef"
              :data="filteredTreeData"
              :props="treeProps"
              node-key="id"
              :default-expanded-keys="defaultExpandedKeys"
              :highlight-current="true"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span class="node-name">{{ node.label }}</span>
                  <el-tag 
                    v-if="isLeafNode(data)" 
                    size="small" 
                    :type="getStatusType(data.status)"
                  >
                    {{ getStatusText(data.status) }}
                  </el-tag>
                  <el-icon 
                    v-if="data.files && data.files.length > 0"
                    class="file-icon"
                  >
                    <Paperclip />
                  </el-icon>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <div v-else class="gantt-container">
          <div class="gantt-header">
            <h3>甘特图视图</h3>
            <div class="gantt-controls">
              <el-button-group>
                <el-button size="small" @click="zoomGantt(-0.1)">-</el-button>
                <el-button size="small" @click="resetGanttZoom">重置</el-button>
                <el-button size="small" @click="zoomGantt(0.1)">+</el-button>
              </el-button-group>
            </div>
          </div>
          <div class="gantt-content" ref="ganttRef">
            <div v-if="ganttData.length === 0" class="empty-gantt">
              <el-empty description="暂无数据，请先设置开始结束日期" />
            </div>
            <div v-else class="gantt-chart">
              <div class="gantt-sidebar">
                <div class="gantt-header-cell">任务名称</div>
                <div v-for="item in ganttData" :key="item.id" class="gantt-row-label">
                  {{ item.name }}
                </div>
              </div>
              <div class="gantt-timeline" :style="{ width: ganttWidth + 'px' }">
                <div class="gantt-timeline-header">
                  <div 
                    v-for="(date, index) in ganttDates" 
                    :key="index"
                    class="gantt-date-cell"
                    :style="{ width: ganttCellWidth + 'px' }"
                  >
                    {{ formatGanttDate(date) }}
                  </div>
                </div>
                <div class="gantt-timeline-body">
                  <div v-for="item in ganttData" :key="item.id" class="gantt-row">
                    <div
                      v-if="item.startDate && item.endDate"
                      class="gantt-bar"
                      :class="getStatusType(item.status)"
                      :style="{
                        left: getGanttBarLeft(item) + 'px',
                        width: getGanttBarWidth(item) + 'px'
                      }"
                      @click="handleGanttBarClick(item)"
                    >
                      <span class="gantt-bar-text">{{ item.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="nodeDialogVisible"
      :title="editForm?.name || '节点详情'"
      width="700px"
    >
      <div v-if="editForm" class="node-detail">
        <el-form label-width="100px">
          <el-form-item label="节点名称">
            <el-input v-model="editForm.name" disabled />
          </el-form-item>
          
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="editForm.startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button size="small" @click="setToday('startDate')">今天</el-button>
          </el-form-item>

          <el-form-item label="结束日期">
            <el-date-picker
              v-model="editForm.endDate"
              type="date"
              placeholder="选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button size="small" @click="setToday('endDate')">今天</el-button>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="editForm.status">
              <el-option label="未开始" value="not_started" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="暂停" value="paused" />
              <el-option label="延误" value="delayed" />
            </el-select>
          </el-form-item>

          <el-form-item label="照片/文件">
            <el-upload
              :auto-upload="false"
              :on-change="handleFileUpload"
              multiple
              list-type="picture-card"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="file-list">
              <div v-for="(file, index) in editForm.files" :key="index" class="file-item">
                <el-image 
                  v-if="isImageFile(file)"
                  :src="file.url"
                  fit="cover"
                  class="file-thumbnail"
                  preview-src-list="[file.url]"
                />
                <el-icon v-else class="file-icon-large"><Document /></el-icon>
                <span class="file-name">{{ file.name }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  link
                  @click="removeFile(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="editForm.remark"
              type="textarea"
              :rows="4"
              placeholder="添加备注信息..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNode">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyDialogVisible" title="复制模板" width="500px">
      <el-form label-width="120px">
        <el-form-item label="源区块">
          <el-select v-model="copySource">
            <el-option v-for="block in blockNames" :key="block" :label="block + ' 区块'" :value="block" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标区块">
          <el-checkbox-group v-model="copyTargets">
            <el-checkbox v-for="block in blockNames" :key="block" :label="block" :disabled="block === copySource" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeCopy">复制</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量修改" width="600px">
      <el-form label-width="120px">
        <el-form-item label="选择节点">
          <el-tree
            ref="batchTreeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            show-checkbox
            :default-checked-keys="batchSelectedNodes"
          />
        </el-form-item>
        <el-form-item label="修改状态">
          <el-select v-model="batchStatus" clearable placeholder="选择要修改的状态">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="暂停" value="paused" />
            <el-option label="延误" value="delayed" />
          </el-select>
        </el-form-item>
        <el-form-item label="统一设置开始日期">
          <el-date-picker
            v-model="batchStartDate"
            type="date"
            clearable
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="统一设置结束日期">
          <el-date-picker
            v-model="batchEndDate"
            type="date"
            clearable
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBatch">批量修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts,
  DocumentCopy,
  List,
  Switch,
  DocumentAdd,
  Download,
  Calendar,
  Check,
  Warning,
  Search,
  Paperclip,
  Plus,
  Document
} from '@element-plus/icons-vue'
import { setItem, getItem } from '../utils/storage'
import dataService from '../services/dataService'
import { constructionNodes, getLeafNodes } from '../data/constructionNodes'

const props = defineProps({
  action: {
    type: String,
    default: ''
  }
})

const blockNames = ['A', 'B', 'C', 'D']
const activeArea = ref('A')
const viewMode = ref('tree')
const searchKeyword = ref('')
const expandedAll = ref(false)
const defaultExpandedKeys = ref([])
const treeRef = ref(null)
const ganttRef = ref(null)

const nodeDialogVisible = ref(false)
const copyDialogVisible = ref(false)
const batchDialogVisible = ref(false)

const currentNode = ref(null)
const editForm = ref(null)
const copySource = ref('A')
const copyTargets = ref([])
const batchStatus = ref('')
const batchStartDate = ref('')
const batchEndDate = ref('')
const batchSelectedNodes = ref([])

const ganttZoom = ref(1)
const ganttCellWidth = ref(80)

const treeProps = {
  children: 'children',
  label: 'name'
}

function initializeAreaData() {
  const areas = {}
  blockNames.forEach(block => {
    areas[block] = {
      id: block,
      name: block + ' 区块',
      startDate: '',
      endDate: '',
      nodes: deepCloneWithData(constructionNodes)
    }
  })
  return areas
}

function deepCloneWithData(nodes) {
  return nodes.map(node => {
    const newNode = {
      ...node,
      startDate: '',
      endDate: '',
      status: 'not_started',
      files: [],
      remark: ''
    }
    if (node.children && node.children.length > 0) {
      newNode.children = deepCloneWithData(node.children)
    }
    return newNode
  })
}

const areaData = reactive(initializeAreaData())

const treeData = computed(() => {
  return areaData[activeArea.value]?.nodes || []
})

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) return treeData.value
  return filterNodes(treeData.value, searchKeyword.value)
})

const leafNodes = computed(() => {
  return getLeafNodes(treeData.value)
})

const ganttData = computed(() => {
  return leafNodes.value.filter(node => node.startDate && node.endDate)
})

const ganttDates = computed(() => {
  if (ganttData.value.length === 0) return []
  
  const dates = []
  const allDates = ganttData.value.flatMap(node => [node.startDate, node.endDate])
  const minDate = new Date(Math.min(...allDates.map(d => new Date(d))))
  const maxDate = new Date(Math.max(...allDates.map(d => new Date(d))))
  
  let currentDate = new Date(minDate)
  while (currentDate <= maxDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dates
})

const ganttWidth = computed(() => {
  return ganttDates.value.length * ganttCellWidth.value * ganttZoom.value
})

function filterNodes(nodes, keyword) {
  return nodes.reduce((result, node) => {
    const match = node.name.toLowerCase().includes(keyword.toLowerCase())
    let filteredChildren = []
    if (node.children && node.children.length > 0) {
      filteredChildren = filterNodes(node.children, keyword)
    }
    if (match || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren
      })
    }
    return result
  }, [])
}

function isLeafNode(node) {
  return !node.children || node.children.length === 0
}

function getAreaProgress(block) {
  const nodes = getLeafNodes(areaData[block]?.nodes || [])
  if (nodes.length === 0) return 0
  const completed = nodes.filter(n => n.status === 'completed').length
  return Math.round((completed / nodes.length) * 100)
}

function getTotalTasks(block) {
  return getLeafNodes(areaData[block]?.nodes || []).length
}

function getCompletedTasks(block) {
  return getLeafNodes(areaData[block]?.nodes || []).filter(n => n.status === 'completed').length
}

function getDelayedTasks(block) {
  return getLeafNodes(areaData[block]?.nodes || []).filter(n => n.status === 'delayed').length
}

function getAreaStatus(block) {
  const progress = getAreaProgress(block)
  if (progress === 100) return 'success'
  if (progress > 0) return 'warning'
  return 'info'
}

function getAreaStatusText(block) {
  const progress = getAreaProgress(block)
  if (progress === 100) return '已完成'
  if (progress > 0) return '进行中'
  return '未开始'
}

function getEstimatedEndDate(block) {
  const nodes = getLeafNodes(areaData[block]?.nodes || [])
  const endDates = nodes.map(n => n.endDate).filter(d => d)
  if (endDates.length === 0) return ''
  return endDates.sort().pop()
}

function getStatusType(status) {
  const map = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    paused: 'warning',
    delayed: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '暂停',
    delayed: '延误'
  }
  return map[status] || '未开始'
}

function switchArea(block) {
  activeArea.value = block
  defaultExpandedKeys.value = []
  expandedAll.value = false
}

function toggleView() {
  viewMode.value = viewMode.value === 'tree' ? 'gantt' : 'tree'
}

function expandAll() {
  expandedAll.value = !expandedAll.value
  if (expandedAll.value) {
    const allKeys = getAllNodeKeys(treeData.value)
    defaultExpandedKeys.value = allKeys
  } else {
    defaultExpandedKeys.value = []
  }
}

function getAllNodeKeys(nodes, keys = []) {
  nodes.forEach(node => {
    keys.push(node.id)
    if (node.children) {
      getAllNodeKeys(node.children, keys)
    }
  })
  return keys
}

function filterTree() {
  nextTick(() => {
    if (treeRef.value) {
      if (searchKeyword.value) {
        const allKeys = getAllNodeKeys(treeData.value)
        defaultExpandedKeys.value = [...new Set([...defaultExpandedKeys.value, ...allKeys])]
      }
    }
  })
}

function handleNodeClick(data) {
  if (isLeafNode(data)) {
    currentNode.value = data
    editForm.value = JSON.parse(JSON.stringify(data))
    nodeDialogVisible.value = true
  }
}

function handleGanttBarClick(item) {
  currentNode.value = item
  editForm.value = JSON.parse(JSON.stringify(item))
  nodeDialogVisible.value = true
}

function setToday(field) {
  const today = new Date().toISOString().split('T')[0]
  editForm.value[field] = today
}

function handleFileUpload(file) {
  if (!editForm.value.files) {
    editForm.value.files = []
  }
  const url = URL.createObjectURL(file.raw)
  editForm.value.files.push({
    name: file.name,
    url: url,
    type: file.raw.type
  })
}

function removeFile(index) {
  editForm.value.files.splice(index, 1)
}

function isImageFile(file) {
  return file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
}

function saveNode() {
  if (currentNode.value && currentNode.value.id) {
    function updateNode(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === currentNode.value.id) {
          Object.assign(nodes[i], editForm.value)
          return true
        }
        if (nodes[i].children && nodes[i].children.length > 0) {
          if (updateNode(nodes[i].children)) {
            return true
          }
        }
      }
      return false
    }
    updateNode(areaData[activeArea.value].nodes)
    ElMessage.success('节点数据已保存')
  }
  nodeDialogVisible.value = false
}

function showCopyDialog() {
  copySource.value = activeArea.value
  copyTargets.value = []
  copyDialogVisible.value = true
}

function executeCopy() {
  if (copyTargets.value.length === 0) {
    ElMessage.warning('请选择目标区块')
    return
  }
  
  const sourceData = areaData[copySource.value]
  copyTargets.value.forEach(target => {
    areaData[target].nodes = JSON.parse(JSON.stringify(sourceData.nodes))
    areaData[target].startDate = sourceData.startDate
    areaData[target].endDate = sourceData.endDate
  })
  
  ElMessage.success(`已将${copySource.value}区块模板复制到${copyTargets.value.join('、')}区块`)
  copyDialogVisible.value = false
}

function showBatchDialog() {
  batchSelectedNodes.value = []
  batchStatus.value = ''
  batchStartDate.value = ''
  batchEndDate.value = ''
  batchDialogVisible.value = true
}

function executeBatch() {
  const checkedNodes = batchTreeRef.value?.getCheckedKeys() || []
  if (checkedNodes.length === 0) {
    ElMessage.warning('请选择要修改的节点')
    return
  }
  
  let modified = 0
  function updateNodes(nodes) {
    nodes.forEach(node => {
      if (checkedNodes.includes(node.id)) {
        if (batchStatus.value) node.status = batchStatus.value
        if (batchStartDate.value) node.startDate = batchStartDate.value
        if (batchEndDate.value) node.endDate = batchEndDate.value
        modified++
      }
      if (node.children) {
        updateNodes(node.children)
      }
    })
  }
  updateNodes(treeData.value)
  
  ElMessage.success(`已批量修改 ${modified} 个节点`)
  batchDialogVisible.value = false
}

function zoomGantt(delta) {
  ganttZoom.value = Math.max(0.5, Math.min(2, ganttZoom.value + delta))
}

function resetGanttZoom() {
  ganttZoom.value = 1
}

function formatGanttDate(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}-${day}`
}

function getGanttBarLeft(item) {
  if (!item.startDate || ganttDates.value.length === 0) return 0
  const startIndex = ganttDates.value.findIndex(d => 
    d.toISOString().split('T')[0] === item.startDate
  )
  return startIndex * ganttCellWidth.value * ganttZoom.value
}

function getGanttBarWidth(item) {
  if (!item.startDate || !item.endDate) return 0
  const startIndex = ganttDates.value.findIndex(d => 
    d.toISOString().split('T')[0] === item.startDate
  )
  const endIndex = ganttDates.value.findIndex(d => 
    d.toISOString().split('T')[0] === item.endDate
  )
  if (startIndex === -1 || endIndex === -1) return 0
  return (endIndex - startIndex + 1) * ganttCellWidth.value * ganttZoom.value
}

async function saveAllData() {
  try {
    await dataService.set('constructionSchedulePro', JSON.parse(JSON.stringify(areaData)))
    ElMessage.success('所有数据保存成功！')
  } catch (error) {
    ElMessage.error('数据保存失败')
    console.error(error)
  }
}

function exportData() {
  const dataStr = JSON.stringify(areaData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `construction-schedule-pro-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('数据导出成功！')
}

async function loadData() {
  try {
    const savedData = await dataService.get('constructionSchedulePro', null)
    if (savedData) {
      Object.keys(savedData).forEach(block => {
        if (areaData[block]) {
          areaData[block].startDate = savedData[block].startDate || ''
          areaData[block].endDate = savedData[block].endDate || ''
          if (savedData[block].nodes) {
            mergeNodeData(areaData[block].nodes, savedData[block].nodes)
          }
        }
      })
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

function mergeNodeData(targetNodes, sourceNodes) {
  const sourceMap = new Map()
  function buildMap(nodes) {
    nodes.forEach(node => {
      sourceMap.set(node.id, node)
      if (node.children) buildMap(node.children)
    })
  }
  buildMap(sourceNodes)
  
  function merge(targets) {
    targets.forEach(node => {
      const source = sourceMap.get(node.id)
      if (source) {
        node.startDate = source.startDate || ''
        node.endDate = source.endDate || ''
        node.status = source.status || 'not_started'
        node.files = source.files || []
        node.remark = source.remark || ''
      }
      if (node.children) merge(node.children)
    })
  }
  merge(targetNodes)
}

watch(() => props.action, (newAction) => {
  console.log('ProgressManagementPro收到action:', newAction)
})

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
/* YTO Brand Progress Management */
.progress-management-pro {
  padding: 0;
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* Professional Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--future-spacing-lg);
  padding: var(--future-spacing-lg) var(--future-spacing-lg) var(--future-spacing-md);
  animation: futurismSlideInDown var(--future-transition-normal) var(--future-easing);
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
  background: linear-gradient(135deg, rgba(77, 20, 140, 0.03) 0%, rgba(252, 70, 22, 0.03) 100%);
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
  font-size: 24px;
  font-weight: 700;
  color: var(--future-text-primary);
  margin: 0;
  font-family: var(--future-font-family);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.page-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: var(--future-primary);
  border-radius: var(--future-radius-full);
  margin-right: var(--future-spacing-sm);
}

.title-icon {
  font-size: 28px;
  color: var(--future-primary);
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: var(--future-spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.header-actions .el-button {
  transition: all var(--future-transition-fast) var(--future-easing);
  font-family: var(--future-font-family-secondary);
  letter-spacing: 0.3px;
  border-radius: var(--future-radius-md);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
}

.header-actions .el-button:hover {
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.3);
}

/* Main Content */
.main-content {
  display: flex;
  gap: var(--future-spacing-lg);
  flex: 1;
  min-height: 0;
  padding: 0 var(--future-spacing-lg) var(--future-spacing-lg);
}

/* Left Sidebar */
.left-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--future-spacing-md);
  overflow-y: auto;
}

/* Professional Area Card - Liquid Glass */
.area-card {
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
  padding: var(--future-spacing-lg);
  cursor: pointer;
}

.area-card:hover {
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

.area-card.active {
  border-color: var(--future-primary);
  background: linear-gradient(
    135deg,
    rgba(77, 20, 140, 0.2) 0%,
    rgba(77, 20, 140, 0.05) 100%
  );
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--future-spacing-md);
}

.area-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--future-text-primary);
  font-family: var(--future-font-family-secondary);
}

.area-header .el-tag {
  font-family: var(--future-font-family-secondary);
  border-radius: var(--future-radius-full);
}

/* Progress Section */
.progress-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--future-spacing-md);
}

.progress-ring-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(77, 20, 140, 0.1);
  stroke-width: 8;
}

.progress-ring-progress {
  fill: none;
  stroke: var(--future-primary);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--future-text-primary);
  font-family: var(--future-font-family);
}

.progress-label {
  display: block;
  font-size: 12px;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
}

/* Area Stats */
.area-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: var(--future-spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
  font-size: 13px;
}

.stat-icon {
  color: var(--future-primary);
}

.stat-icon.warning {
  color: var(--future-danger);
}

/* Area Footer */
.area-footer {
  border-top: 1px solid rgba(77, 20, 140, 0.1);
  padding-top: var(--future-spacing-sm);
}

.date-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--future-text-secondary);
  font-family: var(--future-font-family-secondary);
}

/* Right Content */
.right-content {
  flex: 1;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.1),
    0 2px 12px rgba(102, 0, 153, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Tree Container */
.tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* Search Bar */
.search-bar {
  display: flex;
  gap: var(--future-spacing-sm);
  padding: var(--future-spacing-md);
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
  background: linear-gradient(135deg, rgba(77, 20, 140, 0.03) 0%, rgba(252, 70, 22, 0.03) 100%);
}

.search-bar .el-input {
  flex: 1;
  background: #ffffff;
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: var(--future-radius-md);
  color: var(--future-text-primary);
  font-family: var(--future-font-family-secondary);
  transition: all var(--future-transition-fast) var(--future-easing);
}

.search-bar .el-input:hover {
  border-color: rgba(77, 20, 140, 0.4);
}

.search-bar .el-input:focus-within {
  border-color: var(--future-primary);
  box-shadow: 0 0 0 3px rgba(77, 20, 140, 0.1);
}

.search-bar .el-input .el-input__wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: var(--future-radius-md) !important;
}

.search-bar .el-input .el-input__inner {
  background: transparent !important;
  border: none !important;
  color: var(--future-text-primary) !important;
  font-family: var(--future-font-family-secondary);
}

.search-bar .el-input .el-input__icon {
  color: var(--future-primary) !important;
}

.search-bar .el-button {
  font-family: var(--future-font-family-secondary);
}

/* Tree Wrapper */
.tree-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: var(--future-spacing-md);
}

/* Custom Tree Node */
.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  font-family: var(--future-font-family-secondary);
}

.node-name {
  flex: 1;
  color: var(--future-text-primary);
}

.file-icon {
  color: var(--future-primary);
  font-size: 14px;
}

/* Gantt Container */
.gantt-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--future-spacing-md);
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
  background: linear-gradient(135deg, rgba(77, 20, 140, 0.03) 0%, rgba(252, 70, 22, 0.03) 100%);
}

.gantt-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--future-text-primary);
  font-family: var(--future-font-family);
}

.gantt-controls .el-button-group {
  border-radius: var(--future-radius-md);
  overflow: hidden;
}

.gantt-controls .el-button {
  font-family: var(--future-font-family-secondary);
  border-radius: 0;
}

.gantt-controls .el-button:first-child {
  border-radius: var(--future-radius-md) 0 0 var(--future-radius-md);
}

.gantt-controls .el-button:last-child {
  border-radius: 0 var(--future-radius-md) var(--future-radius-md) 0;
}

/* Gantt Content */
.gantt-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.empty-gantt {
  padding: 60px;
}

/* Gantt Chart */
.gantt-chart {
  display: flex;
  min-width: 100%;
}

.gantt-sidebar {
  flex-shrink: 0;
  width: 250px;
  background: rgba(77, 20, 140, 0.05);
  border-right: 1px solid rgba(77, 20, 140, 0.1);
}

.gantt-header-cell {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--future-text-primary);
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
  font-family: var(--future-font-family-secondary);
  background: rgba(77, 20, 140, 0.03);
}

.gantt-row-label {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--future-text-secondary);
  border-bottom: 1px solid rgba(77, 20, 140, 0.05);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--future-font-family-secondary);
}

.gantt-timeline {
  flex: 1;
  min-width: fit-content;
}

.gantt-timeline-header {
  display: flex;
  background: rgba(77, 20, 140, 0.03);
  border-bottom: 1px solid rgba(77, 20, 140, 0.1);
}

.gantt-date-cell {
  flex-shrink: 0;
  padding: 12px 0;
  text-align: center;
  font-size: 12px;
  color: var(--future-text-secondary);
  border-right: 1px solid rgba(77, 20, 140, 0.05);
  font-family: var(--future-font-family-secondary);
}

.gantt-timeline-body {
  position: relative;
  background: #ffffff;
}

.gantt-row {
  height: 40px;
  border-bottom: 1px solid rgba(77, 20, 140, 0.05);
  position: relative;
}

/* Gantt Bar */
.gantt-bar {
  position: absolute;
  top: 6px;
  height: 28px;
  border-radius: var(--future-radius-md);
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--future-font-family-secondary);
}

.gantt-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gantt-bar.info {
  background: linear-gradient(135deg, var(--future-info), var(--future-info-light));
}

.gantt-bar.primary {
  background: linear-gradient(135deg, var(--future-primary), var(--future-primary-light));
}

.gantt-bar.success {
  background: linear-gradient(135deg, var(--future-success), var(--future-success-light));
}

.gantt-bar.warning {
  background: linear-gradient(135deg, var(--future-warning), var(--future-warning-light));
}

.gantt-bar.danger {
  background: linear-gradient(135deg, var(--future-danger), var(--future-danger-light));
}

.gantt-bar-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Node Detail */
.node-detail {
  padding: var(--future-spacing-md);
  font-family: var(--future-font-family-secondary);
}

.node-detail .el-form-item {
  margin-bottom: var(--future-spacing-md);
}

.node-detail .el-form-item__label {
  color: var(--future-text-primary);
  font-weight: 500;
}

.node-detail .el-input,
.node-detail .el-select,
.node-detail .el-date-picker {
  width: 100%;
  font-family: var(--future-font-family-secondary);
}

.node-detail .el-textarea__inner {
  font-family: var(--future-font-family-secondary);
  color: var(--future-text-primary);
}

/* File List */
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(77, 20, 140, 0.2);
  border-radius: var(--future-radius-md);
  background: rgba(255, 255, 255, 0.9);
  transition: all var(--future-transition-fast);
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 20, 140, 0.15);
  border-color: var(--future-primary);
}

.file-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: var(--future-radius-sm);
  object-fit: cover;
}

.file-icon-large {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--future-primary);
  background: rgba(77, 20, 140, 0.05);
  border-radius: var(--future-radius-sm);
}

.file-name {
  font-size: 12px;
  color: var(--future-text-secondary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--future-font-family-secondary);
  text-align: center;
}



/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }
  
  .area-card {
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--future-spacing-md);
  }
  
  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
  
  .gantt-sidebar {
    width: 150px;
  }
  
  .gantt-row-label {
    font-size: 11px;
  }
  
  .main-content {
    padding: 0 var(--future-spacing-md) var(--future-spacing-md);
  }
  
  .page-header {
    padding: var(--future-spacing-md);
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .header-actions .el-button {
    flex: 100%;
    justify-content: center;
  }
  
  .area-card {
    min-width: 240px;
    padding: var(--future-spacing-md);
  }
  
  .progress-ring-container {
    width: 100px;
    height: 100px;
  }
  
  .progress-value {
    font-size: 20px;
  }
}

/* Animations */
@keyframes futurismSlideInDown {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
