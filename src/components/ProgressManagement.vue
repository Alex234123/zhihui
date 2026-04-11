<template>
  <div class="progress-management">
    <el-container>
      <el-aside width="320px" class="area-sidebar">
        <h2 class="sidebar-title">圆通淮安3号集运中心</h2>
        <h3 class="sidebar-subtitle">施工区域进度</h3>
        
        <div 
          v-for="area in areas" 
          :key="area.areaId"
          class="area-card"
          :class="{ selected: selectedAreaId === area.areaId }"
          @click="selectArea(area.areaId)"
        >
          <div class="area-header">
            <h3 class="area-name">{{ area.areaName }}</h3>
            <el-badge :value="area.delayedTasks" type="danger" />
          </div>
          
          <div class="area-progress">
            <el-progress 
              type="circle" 
              :percentage="area.progress" 
              :width="80"
              :color="getProgressColor(area.progress)"
            />
            <div class="area-info">
              <div class="info-item">
                完成: {{ area.completedTasks }} / {{ area.totalTasks }} 节点
              </div>
              <div class="info-item">
                预计完工: {{ formatDate(area.estimatedCompletionDate) }}
              </div>
            </div>
          </div>
        </div>
      </el-aside>

      <el-main class="main-content">
        <div v-if="selectedArea" class="content-wrapper">
          <div class="statistics-panel">
            <div class="stat-card stat-ahead">
              <div class="stat-icon">🚀</div>
              <div class="stat-content">
                <div class="stat-number">{{ completionStats.ahead }}</div>
                <div class="stat-label">超前完成</div>
              </div>
            </div>
            <div class="stat-card stat-ontime">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-number">{{ completionStats.ontime }}</div>
                <div class="stat-label">正常完成</div>
              </div>
            </div>
            <div class="stat-card stat-overdue">
              <div class="stat-icon">⚠️</div>
              <div class="stat-content">
                <div class="stat-number">{{ completionStats.overdue }}</div>
                <div class="stat-label">超时完成</div>
              </div>
            </div>
            <div class="stat-card stat-total">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-number">{{ completionStats.total }}</div>
                <div class="stat-label">总节点数</div>
              </div>
            </div>
          </div>

          <div class="page-header">
            <h2 class="page-title">{{ selectedArea.areaName }} - 进度管理</h2>
            <div class="header-actions">
              <!-- 楼层切换按钮组 -->
              <div class="floor-switcher">
                <span class="floor-label">当前楼层：</span>
                <el-radio-group v-model="currentFloor" size="small" @change="switchFloor">
                  <el-radio-button
                    v-for="floor in totalFloors"
                    :key="floor"
                    :value="floor"
                  >
                    {{ FLOOR_NAMES[floor - 1] }}
                  </el-radio-button>
                </el-radio-group>
              </div>
              
              <el-button type="primary" :icon="CopyDocument" @click="showCopyModal = true">
                复制模板
              </el-button>
              <el-button :icon="Edit" :disabled="selectedTaskIds.length === 0" @click="showBatchModal = true">
                批量编辑 ({{ selectedTaskIds.length }})
              </el-button>
              <el-button :icon="Download" @click="exportData">
                导出数据
              </el-button>
              <el-button 
                v-if="isAdmin" 
                type="danger" 
                :icon="RefreshRight" 
                @click="forceResetCurrentFloor"
                plain
              >
                🔄 重置当前楼层
              </el-button>
            </div>
          </div>

          <el-tabs v-model="activeTab" class="content-tabs">
            <el-tab-pane label="任务列表" name="tree">
              <div class="task-search">
                <el-input
                  v-model="searchText"
                  placeholder="搜索任务..."
                  :prefix-icon="Search"
                  clearable
                />
              </div>
              
              <el-tree
                :data="treeData"
                :props="treeProps"
                :filter-node-method="filterNode"
                ref="treeRef"
                default-expand-all
                :expand-on-click-node="false"
                show-checkbox
                :check-on-click-node="false"
                @node-click="handleNodeClick"
                @check="handleCheck"
              >
                <template #default="{ node, data }">
                  <div class="tree-node" @contextmenu.prevent="showNodeMenu($event, data)">
                    <span class="node-label">{{ node.label }}</span>
                    <span v-if="data.manager" class="node-manager">
                      负责人：{{ data.manager }}
                    </span>
                    <el-tag v-if="data.status || data.progress > 0" :type="getComputedStatusType(computeTaskStatus(data))" size="small">
                      {{ getComputedStatusText(computeTaskStatus(data)) }}
                    </el-tag>
                    <span v-if="data.progress > 0" class="node-progress">{{ data.progress }}%</span>
                    <div v-if="isAdmin" class="node-actions" @click.stop>
                      <el-button type="primary" size="small" circle :icon="Plus" title="添加子节点" @click.stop="showAddNodeDialog(data)" />
                      <el-button type="warning" size="small" circle :icon="Edit" title="编辑名称" @click.stop="showEditNodeDialog(data)" />
                      <el-button type="danger" size="small" circle :icon="Delete" title="删除节点" @click.stop="deleteNode(data)" />
                    </div>
                  </div>
                </template>
              </el-tree>
            </el-tab-pane>

            <el-tab-pane name="gantt">
              <template #label>
                <span><el-icon><TrendCharts /></el-icon> 甘特图</span>
              </template>
              <div ref="ganttChartRef" class="gantt-chart"></div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>

    <el-drawer
      v-model="drawerVisible"
      :title="currentTask?.name"
      direction="rtl"
      size="640px"
    >
      <el-form v-if="editForm" :model="editForm" label-width="110px" class="task-edit-form">
        <el-divider content-position="left">
          <el-icon><User /></el-icon> 责任信息
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="editForm.manager" placeholder="请输入负责人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <el-icon><DataLine /></el-icon> 进度与状态
        </el-divider>
        <el-form-item label="完成百分比">
          <div class="slider-group">
            <el-slider v-model="editForm.progress" :min="0" :max="100" :show-input="true" :show-tooltip="true" />
            <span class="progress-label">{{ editForm.progress }}%</span>
          </div>
        </el-form-item>

        <el-form-item label="智能状态">
          <div class="smart-status-display">
            <el-tag :type="getComputedStatusType(computedStatus)" size="large" effect="dark" class="status-tag-main">
              {{ getComputedStatusText(computedStatus) }}
            </el-tag>
            <div v-if="deviationInfo" class="deviation-info" :class="deviationInfo.type">
              {{ deviationInfo.text }}
            </div>
          </div>
        </el-form-item>

        <el-divider content-position="left">
          <el-icon><Calendar /></el-icon> 计划时间
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="计划开始日期">
              <div class="date-picker-group">
                <el-date-picker v-model="editForm.plannedStartDate" type="date" placeholder="选择计划开始" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
                <el-button size="small" @click="setToday('plannedStartDate')">今日</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束日期">
              <div class="date-picker-group">
                <el-date-picker v-model="editForm.plannedEndDate" type="date" placeholder="选择计划结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
                <el-button size="small" @click="setToday('plannedEndDate')">今日</el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <el-icon><Timer /></el-icon> 实际时间
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="实际开始日期">
              <div class="date-picker-group">
                <el-date-picker v-model="editForm.actualStartDate" type="date" placeholder="选择实际开始（现场开工时填写）" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
                <el-button size="small" @click="setToday('actualStartDate')">今日</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际完成日期">
              <div v-if="editForm.progress >= 100" class="date-picker-group">
                <el-date-picker v-model="editForm.actualEndDate" type="date" placeholder="选择实际完成（完工后填写）" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
                <el-button size="small" @click="setToday('actualEndDate')">今日</el-button>
              </div>
              <div v-else class="completion-hint">
                <el-alert title="完成百分比达到100%后方可填写实际完成日期" type="info" :closable="false" show-icon />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <el-icon><Document /></el-icon> 备注与附件
        </el-divider>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息（如：天气影响、材料到货情况等）" />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload :auto-upload="false" :on-change="handleFileUpload" multiple :show-file-list="false">
            <el-button :icon="Upload">上传文件</el-button>
          </el-upload>
          <div class="file-list">
            <div v-for="file in editForm.files" :key="file.id" class="file-item">
              <div class="file-info">
                <el-image v-if="file.type === 'image'" :src="file.url" :preview-src-list="[file.url]" style="width: 80px; height: 80px; object-fit: cover;" />
                <div v-else class="file-document"><el-tag type="primary">文档</el-tag><span>{{ file.name }}</span></div>
              </div>
              <el-button type="danger" :icon="Delete" circle size="small" @click="deleteFile(file.id)" />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveTask" :icon="Check">保存任务</el-button>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-dialog
      v-model="showBatchModal"
      title="批量编辑"
      width="500px"
    >
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="负责人">
          <el-input v-model="batchForm.manager" placeholder="请输入负责人姓名（可选）" clearable />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="batchForm.phone" placeholder="请输入联系电话（可选）" clearable />
        </el-form-item>
        <el-form-item label="完成百分比">
          <div class="slider-group">
            <el-slider
              v-model="batchForm.progress"
              :min="0"
              :max="100"
              :show-input="true"
              :show-tooltip="true"
            />
            <span class="progress-label">{{ batchForm.progress }}%</span>
          </div>
        </el-form-item>

        <el-form-item label="计划开始日期">
          <el-date-picker
            v-model="batchForm.startDate"
            type="date"
            placeholder="选择计划开始日期（可选）"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="计划结束日期">
          <el-date-picker
            v-model="batchForm.endDate"
            type="date"
            placeholder="选择计划结束日期（可选）"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchModal = false">取消</el-button>
        <el-button type="primary" @click="handleBatchUpdate">确认更新</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showCopyModal"
      title="复制模板"
      width="500px"
    >
      <p>请选择要复制模板的目标区域：</p>
      <el-checkbox-group v-model="targetAreas">
        <el-checkbox
          v-for="area in areas.filter(a => a.areaId !== selectedAreaId)"
          :key="area.areaId"
          :label="area.areaId"
        >
          {{ area.areaName }}
        </el-checkbox>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="showCopyModal = false">取消</el-button>
        <el-button type="primary" @click="handleCopyTemplate">确认复制</el-button>
      </template>
    </el-dialog>

    <!-- 节点增/改对话框 -->
    <el-dialog v-model="nodeDialogVisible" :title="nodeDialogMode === 'add' ? '添加节点' : '编辑节点'" width="480px">
      <el-form :model="nodeForm" label-width="80px">
        <el-form-item label="节点名称">
          <el-input v-model="nodeForm.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item v-if="nodeDialogMode === 'add'" label="节点类型">
          <el-radio-group v-model="nodeForm.nodeType">
            <el-radio value="substage">子阶段（包含任务列表）</el-radio>
            <el-radio value="task">具体任务</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmNodeAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CopyDocument,
  Edit,
  Download,
  Search,
  TrendCharts,
  Upload,
  Delete,
  Plus,
  Check,
  User,
  DataLine,
  Calendar,
  Timer,
  RefreshRight
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
// 导入弹窗稳定性增强工具
import { createStableClickHandler, safeOpenDialog } from '../utils/dialogUtils.js'
import dataService from '../services/dataService'

const TEMPLATE_STAGES = [
  {
    id: 'stage-1',
    name: '地基与基础工程施工阶段',
    subStages: [
      {
        id: 'substage-1-1',
        name: '进场测量放线与前期准备',
        tasks: [
          { id: 'task-1-1-1', name: '基准点复核', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-1-2', name: '控制网建立', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-1-3', name: '放线定位', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-1-4', name: '开工条件复核', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-1-2',
        name: '基坑支护与土方工程',
        tasks: [
          { id: 'task-1-2-1', name: '支护施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-2-2', name: '降水施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-2-3', name: '土方开挖', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-2-4', name: '变形监测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-2-5', name: '清底收尾', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-1-3',
        name: '地基处理与桩基工程',
        tasks: [
          { id: 'task-1-3-1', name: '天然地基验槽', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-3-2', name: '地基加固', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-3-3', name: '桩基施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-3-4', name: '桩基检测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-3-5', name: '桩基验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-1-4',
        name: '地下结构主体施工',
        tasks: [
          { id: 'task-1-4-1', name: '垫层施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-4-2', name: '底板防水施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-4-3', name: '基础底板结构施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-4-4', name: '地下室墙柱结构施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-4-5', name: '地下室梁板结构施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-4-6', name: '后浇带施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-1-5',
        name: '地下防水与土方回填',
        tasks: [
          { id: 'task-1-5-1', name: '外墙防水施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-5-2', name: '土方回填', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-1-5-3', name: '压实度检测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-1-6',
        name: '分部验收',
        tasks: [
          { id: 'task-1-6-1', name: '地基与基础分部工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  },
  {
    id: 'stage-2',
    name: '主体结构工程施工阶段',
    subStages: [
      {
        id: 'substage-2-1',
        name: '施工准备',
        tasks: [
          { id: 'task-2-1-1', name: '测量引测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-1-2', name: '材料报验', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-1-3', name: '技术交底', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-2',
        name: '标准层主体结构循环施工',
        tasks: [
          { id: 'task-2-2-1', name: '楼层测量放线', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-2', name: '墙柱钢筋工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-3', name: '墙柱模板工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-4', name: '墙柱混凝土工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-5', name: '梁板支撑与模板工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-6', name: '梁板钢筋工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-7', name: '梁板混凝土工程', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-2-8', name: '模板拆除', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-3',
        name: '二次结构穿插施工',
        tasks: [
          { id: 'task-2-3-1', name: '填充墙砌筑', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-3-2', name: '构造柱/过梁/圈梁施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-3-3', name: '洞口处理', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-3-4', name: '管线预埋', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-4',
        name: '屋面结构施工',
        tasks: [
          { id: 'task-2-4-1', name: '屋面结构层施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-4-2', name: '附属结构施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-5',
        name: '结构实体检测',
        tasks: [
          { id: 'task-2-5-1', name: '强度检测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-5-2', name: '钢筋检测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-5-3', name: '楼板检测', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-5-4', name: '尺寸校核', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-6',
        name: '钢结构专项施工（集运中心适配）',
        tasks: [
          { id: 'task-2-6-1', name: '钢构件加工制作与进场报验', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-6-2', name: '钢柱安装与校正固定', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-6-3', name: '钢梁/屋架安装与焊接', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-6-4', name: '檩条/支撑体系安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-6-5', name: '钢结构防火防腐涂装施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-2-6-6', name: '钢结构分部工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-2-7',
        name: '分部验收',
        tasks: [
          { id: 'task-2-7-1', name: '主体结构分部工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  },
  {
    id: 'stage-3',
    name: '机电安装全穿插施工阶段',
    subStages: [
      {
        id: 'substage-3-1',
        name: '预留预埋阶段',
        tasks: [
          { id: 'task-3-1-1', name: '基础预埋', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-1-2', name: '主体墙柱预埋', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-1-3', name: '主体梁板预埋', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-1-4', name: '隐蔽验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-3-2',
        name: '主干管与设备安装阶段',
        tasks: [
          { id: 'task-3-2-1', name: '管道安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-2-2', name: '桥架安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-2-3', name: '设备安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-2-4', name: '电梯安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-2-5', name: '管道试验', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-2-6', name: '电气测试', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-3-3',
        name: '支管与末端安装阶段',
        tasks: [
          { id: 'task-3-3-1', name: '支管安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-3-2', name: '末端安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-3-3', name: '洁具安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-3-4',
        name: '物流专项机电安装（集运中心适配）',
        tasks: [
          { id: 'task-3-4-1', name: '自动化分拣设备管线预埋与安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-4-2', name: '仓储冷链系统管线与设备安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-4-3', name: '智慧园区智能化系统布线与设备安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-3-5',
        name: '系统调试与验收',
        tasks: [
          { id: 'task-3-5-1', name: '单机试运行', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-5-2', name: '联动调试', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-3-5-3', name: '专项验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  },
  {
    id: 'stage-4',
    name: '装饰装修与屋面工程施工阶段',
    subStages: [
      {
        id: 'substage-4-1',
        name: '屋面工程施工',
        tasks: [
          { id: 'task-4-1-1', name: '基层处理', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-2', name: '找坡找平', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-3', name: '防水施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-4', name: '保温施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-5', name: '面层施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-6', name: '附属系统施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-1-7', name: '蓄水试验', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-4-2',
        name: '外装饰工程施工',
        tasks: [
          { id: 'task-4-2-1', name: '基层处理', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-2-2', name: '保温施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-2-3', name: '饰面施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-2-4', name: '门窗安装', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-2-5', name: '淋水试验', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-2-6', name: '脚手架拆除', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-4-3',
        name: '内装饰工程施工',
        tasks: [
          { id: 'task-4-3-1', name: '粗装修施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-3-2', name: '精装修施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-4-3-3', name: '物流仓储专项装修（集运中心适配）', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-4-4',
        name: '分户验收',
        tasks: [
          { id: 'task-4-4-1', name: '住宅分户验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-4-5',
        name: '分部验收',
        tasks: [
          { id: 'task-4-5-1', name: '装饰装修分部工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  },
  {
    id: 'stage-5',
    name: '室外总图及配套工程施工阶段',
    subStages: [
      {
        id: 'substage-5-1',
        name: '室外管网工程',
        tasks: [
          { id: 'task-5-1-1', name: '雨污水管网施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-1-2', name: '给排水管网施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-1-3', name: '消防管网施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-1-4', name: '强弱电/智能化管网施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-1-5', name: '管网功能性试验与验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-5-2',
        name: '室外土建工程',
        tasks: [
          { id: 'task-5-2-1', name: '园区道路及硬化施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-2-2', name: '围墙/大门/挡土墙施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-2-3', name: '停车场施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-2-4', name: '附属构筑物施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-2-5', name: '物流专项配套（集运中心适配）', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-5-3',
        name: '景观绿化工程',
        tasks: [
          { id: 'task-5-3-1', name: '种植土回填', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-3-2', name: '苗木种植与养护', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-3-3', name: '景观小品施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-5-3-4', name: '室外照明系统施工', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-5-4',
        name: '验收',
        tasks: [
          { id: 'task-5-4-1', name: '室外工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  },
  {
    id: 'stage-6',
    name: '竣工收尾与竣工验收阶段',
    subStages: [
      {
        id: 'substage-6-1',
        name: '竣工自检与整改',
        tasks: [
          { id: 'task-6-1-1', name: '全部分项工程自检', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-1-2', name: '竣工图绘制', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-1-3', name: '质量缺陷整改闭环', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-1-4', name: '现场清场、成品保护', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-6-2',
        name: '竣工预验收',
        tasks: [
          { id: 'task-6-2-1', name: '竣工报验单提交', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-2-2', name: '监理组织五方预验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-2-3', name: '问题清单整改闭环', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-2-4', name: '监理复核合格', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-6-3',
        name: '法定专项验收',
        tasks: [
          { id: 'task-6-3-1', name: '消防验收/备案', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-2', name: '人防工程验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-3', name: '规划核实', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-4', name: '建筑节能验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-5', name: '室内环境检测验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-6', name: '环保验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-7', name: '防雷验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-3-8', name: '城建档案预验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      },
      {
        id: 'substage-6-4',
        name: '正式竣工验收',
        tasks: [
          { id: 'task-6-4-1', name: '五方责任主体联合验收', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-4-2', name: '质量监督机构全程监督', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-4-3', name: '签署单位工程竣工验收报告', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' },
          { id: 'task-6-4-4', name: '提交工程质量保修书', status: 'not_started', startDate: null, endDate: null, files: [], remark: '' }
        ]
      }
    ]
  }
]

// 创建带楼层前缀的模板数据
function createTemplateStages(prefix = '') {
  const template = JSON.parse(JSON.stringify(TEMPLATE_STAGES))
  
  // 递归地为所有节点添加前缀
  function addPrefixToNode(node, pfx) {
    if (node.name && !node.name.startsWith(pfx)) {
      node.name = pfx + node.name
      node.label = node.name  // 同步更新label
    }
    
    if (node.subStages) {
      node.subStages.forEach(sub => addPrefixToNode(sub, pfx))
    }
    
    if (node.tasks) {
      node.tasks.forEach(task => addPrefixToNode(task, pfx))
    }
    
    if (node.children) {
      node.children.forEach(child => addPrefixToNode(child, pfx))
    }
  }
  
  // 为每个阶段及其子节点添加前缀
  template.forEach(stage => addPrefixToNode(stage, prefix))
  
  return template
}

const AREAS = [
  { id: 'area-A', name: 'A区' },
  { id: 'area-B', name: 'B区' },
  { id: 'area-C', name: 'C区' },
  { id: 'area-D', name: 'D区' }
]

const props = defineProps({
  action: {
    type: String,
    default: ''
  }
})

// 多楼层独立数据结构
// 数据格式: allAreaData[areaId][floor] = { stages: [...], ... }
const allAreaData = ref({})
const currentAreaData = computed(() => {
  if (!allAreaData.value[selectedAreaId.value]) return null
  return allAreaData.value[selectedAreaId.value][currentFloor.value] || null
})

const areas = ref([])
const selectedAreaId = ref('area-A')
const selectedTaskIds = ref([])
const drawerVisible = ref(false)
const currentTask = ref(null)
const editForm = ref(null)

// 楼层管理
const currentFloor = ref(1)
const totalFloors = 3
const FLOOR_NAMES = ['一层', '二层', '三层']
const FLOOR_PREFIXES = ['一层-', '二层-', '三层-']

// 切换楼层：保存当前层数据 → 加载新楼层数据
async function switchFloor(floor) {
  if (floor < 1 || floor > totalFloors) return
  
  const oldFloor = currentFloor.value
  console.log(`[ProgressManagement] 切换楼层: ${FLOOR_NAMES[oldFloor - 1]} -> ${FLOOR_NAMES[floor - 1]}`)
  
  // 1. 保存当前楼层的修改
  if (currentAreaData.value && oldFloor !== floor) {
    await saveCurrentFloorData()
  }
  
  // 2. 切换到新楼层
  currentFloor.value = floor
  
  // 3. 加载新楼层数据（如果存在）
  await loadCurrentFloorData()
}

// 保存当前区域+楼层的详细数据
async function saveCurrentFloorData() {
  try {
    const areaId = selectedAreaId.value
    const floor = currentFloor.value
    
    if (!allAreaData.value[areaId]) {
      allAreaData.value[areaId] = {}
    }
    
    // 获取当前显示的stages数据
    const areaIndex = areas.value.findIndex(a => a.areaId === areaId)
    if (areaIndex === -1 || !areas.value[areaIndex].stages) return
    
    // 保存到对应楼层的数据槽位
    allAreaData.value[areaId][floor] = JSON.parse(JSON.stringify(areas.value[areaIndex]))
    
    // 同步到服务器（使用唯一键）
    const storageKey = `progressDetail-${areaId}-${floor}`
    const result = await dataService.set(storageKey, allAreaData.value[areaId][floor])
    
    console.log(`[ProgressManagement] ✅ 已保存 ${areaId} ${FLOOR_NAMES[floor - 1]} 数据:`, result ? '成功' : '失败')
    
    return result
  } catch (error) {
    console.error('[ProgressManagement] ❌ 保存楼层数据失败:', error)
    return false
  }
}

// 加载当前区域+楼层的详细数据
async function loadCurrentFloorData() {
  try {
    const areaId = selectedAreaId.value
    const floor = currentFloor.value
    const storageKey = `progressDetail-${areaId}-${floor}`
    const expectedPrefix = FLOOR_PREFIXES[floor - 1]
    
    console.log(`[ProgressManagement] 正在加载 ${areaId} ${FLOOR_NAMES[floor - 1]} 数据... (期望前缀: "${expectedPrefix}")`)
    
    // 尝试从服务器加载该楼层的数据
    let savedData = await dataService.get(storageKey, null)
    
    // 强力修复：如果数据存在，严格验证楼层前缀是否匹配
    if (savedData && savedData.stages && savedData.stages.length > 0) {
      const firstStageName = savedData.stages[0]?.name || ''
      const firstTaskName = savedData.stages[0]?.subStages[0]?.tasks[0]?.name || ''
      
      console.log(`[ProgressManagement] 🔍 检查数据: 阶段名="${firstStageName}", 任务名="${firstTaskName}"`)
      
      // 检查数据是否包含期望的楼层前缀
      const hasCorrectPrefix = firstStageName.startsWith(expectedPrefix) || firstTaskName.startsWith(expectedPrefix)
      
      // 检查数据是否包含其他楼层的前缀（说明是脏数据）
      const hasWrongFloorPrefix = FLOOR_PREFIXES.some(prefix => {
        if (prefix === expectedPrefix) return false  // 跳过期望的前缀
        return firstStageName.startsWith(prefix) || firstTaskName.startsWith(prefix)
      })
      
      if (hasWrongFloorPrefix || !hasCorrectPrefix) {
        // 发现脏数据或不匹配的数据！
        console.warn(`[ProgressManagement] ⚠️ 检测到脏数据! key=${storageKey}`)
        console.warn(`[ProgressManagement]   期望: "${expectedPrefix}", 实际阶段: "${firstStageName}", 任务: "${firstTaskName}"`)
        
        // 强制删除服务器上的脏数据
        console.warn(`[ProgressManagement] 🗑️ 正在删除脏数据并重新初始化...`)
        await dataService.set(storageKey, null)  // 清除脏数据
        savedData = null  // 设为null以触发重新初始化
        
        ElMessage.warning(`${FLOOR_NAMES[floor - 1]} 数据已重置（检测到错误的楼层数据）`)
      }
    }
    
    if (savedData && savedData.stages && savedData.stages.length > 0) {
      // 数据验证通过，恢复它
      const areaIndex = areas.value.findIndex(a => a.areaId === areaId)
      if (areaIndex !== -1) {
        Object.assign(areas.value[areaIndex], savedData)
        updateAreaProgress()
        console.log(`[ProgressManagement] ✅ 从服务器恢复 ${FLOOR_NAMES[floor - 1]} 数据 (节点数: ${savedData.stages.length} 个阶段)`)
        
        // 同步到 Dashboard（确保数据一致）
        await syncProgressToDashboard()
      }
    } else {
      // 无已保存数据或数据已被清理，使用默认模板并添加楼层前缀
      console.log(`[ProgressManagement] ℹ️ ${FLOOR_NAMES[floor - 1]} 无历史数据/数据已重置，使用默认模板`)
      await initializeCurrentFloorWithPrefix()
    }
  } catch (error) {
    console.error('[ProgressManagement] ❌ 加载楼层数据失败:', error)
  }
}

// 管理员强制重置当前楼层（清除脏数据）
async function forceResetCurrentFloor() {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员才能执行此操作')
    return
  }
  
  try {
    const areaId = selectedAreaId.value
    const floor = currentFloor.value
    const storageKey = `progressDetail-${areaId}-${floor}`
    
    await ElMessageBox.confirm(
      `确定要重置 ${areas.value.find(a => a.areaId === areaId)?.areaName || areaId} ${FLOOR_NAMES[floor - 1]} 的所有数据吗？\n\n⚠️ 此操作将删除该楼层的所有节点数据并恢复为默认模板！`,
      '⚠️ 强制重置确认',
      { 
        confirmButtonText: '确定重置', 
        cancelButtonText: '取消', 
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    console.log(`[ProgressManagement] 🗑️ 管理员强制重置: ${storageKey}`)
    
    // 1. 从服务器删除脏数据
    await dataService.set(storageKey, null)
    
    // 2. 清除可能的旧键（兼容性）
    localStorage.removeItem(storageKey)
    if (localStorage.getItem('progressDetail')) {
      const detail = JSON.parse(localStorage.getItem('progressDetail') || '{}')
      if (detail && Array.isArray(detail)) {
        const areaIndex = detail.findIndex(a => a.areaId === areaId)
        if (areaIndex !== -1 && detail[areaIndex].stages) {
          detail[areaIndex].stages = []
          localStorage.setItem('progressDetail', JSON.stringify(detail))
        }
      }
    }
    
    // 3. 重新初始化当前楼层
    await initializeCurrentFloorWithPrefix()
    
    ElMessage.success(`✅ ${FLOOR_NAMES[floor - 1]} 数据已重置为默认模板`)
    console.log('[ProgressManagement] ✅ 强制重置完成')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[ProgressManagement] ❌ 强制重置失败:', error)
      ElMessage.error('重置失败: ' + error.message)
    }
  }
}

// 为当前楼层初始化带前缀的模板数据
async function initializeCurrentFloorWithPrefix() {
  const prefix = FLOOR_PREFIXES[currentFloor.value - 1]
  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return
  
  // 创建带楼层前缀的深拷贝模板
  const templateStages = createTemplateStages(prefix)
  areas.value[areaIndex].stages = templateStages
  
  // 更新进度计算
  updateAreaProgress()
  
  // 保存到服务器（当前楼层详细数据）
  await saveCurrentFloorData()
  
  // 同步进度概要到 Dashboard（关键修复：确保数据一致）
  await syncProgressToDashboard()
  
  ElMessage.info(`已初始化 ${FLOOR_NAMES[currentFloor.value - 1]} 默认数据（带"${prefix}"前缀）`)
}

// 管理员权限检查
const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

// 节点增删改相关
const nodeDialogVisible = ref(false)
const nodeDialogMode = ref('add') // 'add' | 'edit'
const currentNodeData = ref(null)
const nodeForm = reactive({
  name: '',
  nodeType: 'task'
})
const showBatchModal = ref(false)
const showCopyModal = ref(false)
const activeTab = ref('tree')
const searchText = ref('')
const targetAreas = ref([])
const treeRef = ref(null)
const ganttChartRef = ref(null)

const computedStatus = computed(() => {
  if (!editForm.value) return 'not_started'
  return computeTaskStatus(editForm.value)
})

const deviationInfo = computed(() => {
  if (!editForm.value || !editForm.value.plannedStartDate || !editForm.value.plannedEndDate) return null
  const p = editForm.value.progress || 0
  const totalDays = Math.max(1, dayDiff(editForm.value.plannedStartDate, editForm.value.plannedEndDate))
  const today = new Date()
  const planStart = new Date(editForm.value.plannedStartDate)
  const planEnd = new Date(editForm.value.plannedEndDate)
  const elapsedDays = Math.max(0, (today - planStart) / 86400000)
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
  const diff = p - expectedProgress
  if (Math.abs(diff) <= 5) return null
  if (diff > 0) return { type: 'ahead', text: `进度超前约 ${diff}%（预期 ${expectedProgress}%，实际 ${p}%）` }
  return { type: 'behind', text: `进度滞后约 ${Math.abs(diff)}%（预期 ${expectedProgress}%，实际 ${p}%）` }
})

const batchForm = reactive({
  progress: null,
  startDate: null,
  endDate: null,
  manager: '',
  phone: ''
})

const treeProps = {
  children: 'children',
  label: 'label'
}

const selectedArea = computed(() => areas.value.find(area => area.areaId === selectedAreaId.value))

const completionStats = computed(() => {
  if (!selectedArea.value) return { ahead: 0, ontime: 0, overdue: 0, total: 0 }

  let ahead = 0
  let ontime = 0
  let overdue = 0
  let total = 0

  selectedArea.value.stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        total++
        const status = computeTaskStatus(task)
        if (status === 'completed_ahead') ahead++
        else if (status === 'completed_ontime') ontime++
        else if (status === 'completed_overdue') overdue++
      })
    })
  })

  return { ahead, ontime, overdue, total }
})

const treeData = computed(() => {
  if (!selectedArea.value) return []
  
  const stages = selectedArea.value.stages
  const searchLower = searchText.value.toLowerCase()
  
  const buildTreeData = (stageList) => {
    return stageList.map(stage => {
      const filteredSubStages = stage.subStages.map(subStage => {
        const filteredTasks = subStage.tasks.filter(task => {
          if (!searchText.value) return true
          return task.name.toLowerCase().includes(searchLower) || 
                 task.remark.toLowerCase().includes(searchLower)
        })
        
        return {
          label: subStage.name,
          children: filteredTasks.map(task => ({
            label: task.name,
            ...task
          }))
        }
      }).filter(sub => sub.children.length > 0)
      
      return {
        label: stage.name,
        children: filteredSubStages
      }
    }).filter(stage => stage.children.length > 0)
  }
  
  return buildTreeData(stages)
})

watch(searchText, (val) => {
  treeRef.value?.filter(val)
})

watch(activeTab, (newTab) => {
  if (newTab === 'gantt') {
    nextTick(() => {
      initGanttChart()
    })
  }
})

watch(currentFloor, (newFloor) => {
  if (activeTab.value === 'gantt') {
    nextTick(() => {
      initGanttChart()
    })
  }
})

watch(selectedAreaId, () => {
  if (activeTab.value === 'gantt') {
    nextTick(() => {
      initGanttChart()
    })
  }
})

function convertToDashboardProgress() {
  return areas.value.map(area => {
    const blockLetter = area.areaId.replace('area-', '')
    const currentNode = getCurrentStageInfo(area.stages)
    return {
      block: blockLetter,
      progress: area.progress,
      manager: '',
      phone: '',
      stage: currentNode.stageName || '已完成',
      currentNode: currentNode.taskName || '',
      targetDate: formatDate(area.estimatedCompletionDate),
      startDate: currentNode.startDate || '',
      id: area.areaId
    }
  })
}

function getCurrentStageInfo(stages) {
  for (const stage of stages) {
    for (const subStage of stage.subStages) {
      const allCompleted = subStage.tasks.every(t => t.status === 'completed' || computeTaskStatus(t) === 'completed')
      if (allCompleted) continue

      const inProgressTask = subStage.tasks.find(t => {
        const s = computeTaskStatus(t)
        return ['in_progress', 'ahead_of_schedule', 'behind_schedule', 'started'].includes(s)
      })
      if (inProgressTask) {
        return {
          stageName: subStage.name,
          taskName: inProgressTask.name,
          startDate: inProgressTask.actualStartDate || inProgressTask.plannedStartDate || null
        }
      }

      const notStartedTask = subStage.tasks.find(t => {
        const s = computeTaskStatus(t)
        return ['not_started', 'delayed', 'paused'].includes(s)
      })
      if (notStartedTask) {
        return {
          stageName: subStage.name,
          taskName: notStartedTask.name,
          startDate: notStartedTask.actualStartDate || notStartedTask.plannedStartDate || null
        }
      }

      return { stageName: subStage.name, taskName: subStage.name, startDate: null }
    }
  }

  return { stageName: '已完成', taskName: '', startDate: null }
}

function getCurrentStage(stages) {
  for (const stage of stages) {
    for (const subStage of stage.subStages) {
      const allCompleted = subStage.tasks.every(t => t.status === 'completed' || computeTaskStatus(t) === 'completed')
      if (!allCompleted) return subStage.name
    }
  }
  return '已完成'
}

async function syncProgressToDashboard() {
  try {
    console.log('[ProgressManagement] 开始同步进度数据到服务器...')
    
    const progressData = convertToDashboardProgress()
    const detailData = JSON.parse(JSON.stringify(areas.value))
    
    // 保存进度概要
    const result1 = await dataService.set('progress', progressData)
    console.log('[ProgressManagement] ✅ 进度概要已保存:', result1 ? '成功' : '失败')
    
    // 保存详细数据（包含所有节点信息）
    const result2 = await dataService.set('progressDetail', detailData)
    console.log('[ProgressManagement] ✅ 详细数据已保存:', result2 ? '成功' : '失败')
    
    if (result1 && result2) {
      ElMessage.success({
        message: '数据已同步到服务器',
        duration: 2000,
        showClose: true
      })
    } else {
      ElMessage.warning('数据同步可能未完全成功，请检查网络连接')
    }
    
    return (result1 && result2)
  } catch (error) {
    console.error('[ProgressManagement] ❌ 同步进度数据失败:', error)
    ElMessage.error('数据同步失败: ' + error.message)
    return false
  }
}

// 添加自动保存防抖（避免频繁保存）
let autoSaveTimeout = null
function debouncedSync() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout)
  autoSaveTimeout = setTimeout(() => {
    syncProgressToDashboard()
  }, 1000) // 1秒后自动保存
}

onMounted(async () => {
  try {
    // 初始化区域基础数据（不含stages）
    initializeAreas()
    
    // 加载当前选中区域的当前楼层数据
    await loadCurrentFloorData()
    
  } catch (error) {
    console.error('[ProgressManagement] 初始化失败:', error)
    initializeAreas()
    // 如果加载失败，尝试初始化当前楼层
    initializeCurrentFloorWithPrefix()
  }
})

function initializeAreas() {
  areas.value = AREAS.map(area => ({
    areaId: area.id,
    areaName: area.name,
    stages: [],  // 先不填充stages，等loadCurrentFloorData后填充
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// 切换区域：保存当前区域数据 → 加载新区域当前楼层数据
async function selectArea(areaId) {
  // 1. 保存当前区域的当前楼层数据
  if (selectedAreaId.value && selectedAreaId.value !== areaId) {
    await saveCurrentFloorData()
  }
  
  // 2. 切换到新区域
  selectedAreaId.value = areaId
  
  // 3. 加载新区域的当前楼层数据
  await loadCurrentFloorData()
}

function updateAreaProgress() {
  areas.value.forEach(area => {
    const progress = calculateProgress(area.stages)
    area.progress = progress.progress
    area.completedTasks = progress.completedTasks
    area.totalTasks = progress.totalTasks
    area.estimatedCompletionDate = progress.estimatedCompletionDate
    area.delayedTasks = progress.delayedTasks
  })
}

function calculateProgress(stages) {
  let totalTasks = 0
  let sumProgress = 0
  let completedTasks = 0
  let delayedTasks = 0
  let estimatedCompletionDate = null

  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        totalTasks++
        const taskProgress = task.progress || 0
        sumProgress += taskProgress

        if (taskProgress === 100) completedTasks++
        if (task.status === 'delayed') delayedTasks++
      })
    })
  })

  const progress = totalTasks > 0 ? Math.round(sumProgress / totalTasks) : 0

  let latestPlannedEnd = null
  let hasAnyPlanDate = false

  for (const stage of stages) {
    for (let i = stage.subStages.length - 1; i >= 0; i--) {
      const subStage = stage.subStages[i]
      for (let j = subStage.tasks.length - 1; j >= 0; j--) {
        const task = subStage.tasks[j]
        
        if (task.plannedEndDate) {
          hasAnyPlanDate = true
          if (!latestPlannedEnd || new Date(task.plannedEndDate) > new Date(latestPlannedEnd)) {
            latestPlannedEnd = task.plannedEndDate
          }
        }
        
        const taskStatus = computeTaskStatus(task)
        if (taskStatus !== 'completed' && taskStatus !== 'completed_ontime' && taskStatus !== 'completed_ahead' && taskStatus !== 'completed_overdue') {
          if (task.plannedEndDate) {
            estimatedCompletionDate = task.plannedEndDate
          }
          break
        }
      }
    }
  }

  if (!estimatedCompletionDate && hasAnyPlanDate) {
    estimatedCompletionDate = latestPlannedEnd
  }

  if (!estimatedCompletionDate) {
    const allCompleted = stages.every(stage =>
      stage.subStages.every(subStage =>
        subStage.tasks.every(task => {
          const s = computeTaskStatus(task)
          return ['completed', 'completed_ontime', 'completed_ahead', 'completed_overdue'].includes(s)
        })
      )
    )

    if (allCompleted && totalTasks > 0) {
      let latestActualEnd = null
      stages.forEach(stage => {
        stage.subStages.forEach(subStage => {
          subStage.tasks.forEach(task => {
            if (task.actualEndDate) {
              if (!latestActualEnd || new Date(task.actualEndDate) > new Date(latestActualEnd)) {
                latestActualEnd = task.actualEndDate
              }
            }
          })
        })
      })
      estimatedCompletionDate = latestActualEnd
    }
  }

  return {
    progress,
    completedTasks,
    totalTasks,
    estimatedCompletionDate,
    delayedTasks
  }
}

function handleNodeClick(data) {
  if (data.id) {
    currentTask.value = data
    editForm.value = {
      ...JSON.parse(JSON.stringify(data)),
      manager: data.manager || '',
      phone: data.phone || '',
      progress: data.progress || 0,
      status: data.status || 'not_started',
      plannedStartDate: data.plannedStartDate || data.startDate || null,
      plannedEndDate: data.plannedEndDate || data.endDate || null,
      actualStartDate: data.actualStartDate || null,
      actualEndDate: data.actualEndDate || null
    }
    drawerVisible.value = true
  }
}

function handleCheck(data, checkedInfo) {
  const allCheckedIds = []
  function collectIds(nodes) {
    nodes.forEach(node => {
      if (node.id) {
        allCheckedIds.push(node.id)
      }
      if (node.children) {
        collectIds(node.children)
      }
    })
  }
  collectIds(checkedInfo.checkedNodes)
  selectedTaskIds.value = allCheckedIds
}

// ========== 节点增删改功能（仅管理员）==========

// 使用增强型点击处理器包装弹窗打开函数
const stableShowAddNodeDialog = createStableClickHandler(async function(parentNode) {
  if (!isAdmin.value) return
  currentNodeData.value = parentNode
  nodeDialogMode.value = 'add'
  nodeForm.name = ''
  nodeForm.nodeType = 'task'
  
  // 使用安全的方式打开弹窗
  await safeOpenDialog(nodeDialogVisible, { preDelay: 80 })
}, { delay: 80, retries: 2 })

const stableShowEditNodeDialog = createStableClickHandler(async function(node) {
  if (!isAdmin.value) return
  currentNodeData.value = node
  nodeDialogMode.value = 'edit'
  nodeForm.name = node.label || node.name || ''
  
  // 使用安全的方式打开弹窗
  await safeOpenDialog(nodeDialogVisible, { preDelay: 80 })
}, { delay: 80, retries: 2 })

function showAddNodeDialog(parentNode) {
  stableShowAddNodeDialog(parentNode)
}

function showEditNodeDialog(node) {
  stableShowEditNodeDialog(node)
}

async function confirmNodeAction() {
  if (!nodeForm.name.trim()) {
    ElMessage.warning('请输入节点名称')
    return
  }

  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return

  const stages = areas.value[areaIndex].stages

  if (nodeDialogMode.value === 'add') {
    addNodeToStages(stages, currentNodeData.value)
  } else {
    updateNodeInStages(stages, currentNodeData.value)
  }

  updateAreaProgress()
  nodeDialogVisible.value = false
  
  // 保存到当前区域+楼层的独立数据槽位（关键修改）
  const saveResult = await saveCurrentFloorData()
  
  if (saveResult) {
    ElMessage.success({
      message: `${nodeDialogMode.value === 'add' ? '节点添加' : '节点修改'}成功（已同步到服务器）`,
      duration: 2000,
      showClose: true
    })
  } else {
    ElMessage.warning('操作成功但数据同步可能失败')
  }
}

function addNodeToStages(stages, parentNode) {
  const newNodeId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`

  if (nodeForm.nodeType === 'task') {
    // 添加为任务节点（叶子节点）
    const newTask = {
      id: newNodeId,
      name: nodeForm.name.trim(),
      status: 'not_started',
      plannedStartDate: null,
      plannedEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
      files: [],
      remark: '',
      progress: 0
    }

    // 判断父节点类型并找到正确的位置插入
    for (const stage of stages) {
      for (const subStage of stage.subStages) {
        // 父节点是子阶段 → 添加到该子阶段的 tasks
        if (parentNode && parentNode.id === subStage.id) {
          subStage.tasks.push(newTask)
          return
        }
        // 父节点是阶段 → 在该阶段下新建子阶段包含此任务
        if (parentNode && parentNode.id === stage.id) {
          const newSubStage = {
            id: `substage-${newNodeId}`,
            name: nodeForm.name.trim(),
            tasks: [newTask]
          }
          stage.subStages.push(newSubStage)
          return
        }
        // 父节点是已有任务 → 作为同级任务添加到同一子阶段
        if (parentNode && parentNode.id) {
          const existingTask = subStage.tasks.find(t => t.id === parentNode.id)
          if (existingTask) {
            subStage.tasks.push(newTask)
            return
          }
        }
      }
    }

    // 兜底：找不到父节点时，添加到第一个子阶段
    if (stages[0]?.subStages[0]) {
      stages[0].subStages[0].tasks.push(newTask)
    }
  } else {
    // 添加为子阶段（包含空任务列表）
    const newSubStage = {
      id: `substage-${newNodeId}`,
      name: nodeForm.name.trim(),
      tasks: [{
        id: `${newNodeId}-task-1`,
        name: '待定义任务',
        status: 'not_started',
        startDate: null,
        endDate: null,
        files: [],
        remark: '',
        progress: 0
      }]
    }

    if (parentNode && parentNode.id) {
      // 找到父级阶段
      const parentStage = stages.find(s => s.id === parentNode.id)
      if (parentStage) {
        parentStage.subStages.push(newSubStage)
        return
      }
    }

    // 兜底：添加到最后一个阶段
    if (stages.length > 0) {
      stages[stages.length - 1].subStages.push(newSubStage)
    }
  }
}

function updateNodeInStages(stages, targetNode) {
  const newName = nodeForm.name.trim()
  
  if (!newName) {
    ElMessage.warning('节点名称不能为空')
    return
  }

  console.log('[ProgressManagement] 更新节点:', targetNode.id, '->', newName)

  for (const stage of stages) {
    // 检查阶段节点
    if (stage.id === targetNode.id) {
      stage.name = newName
      stage.label = newName  // 同时更新label（用于el-tree显示）
      console.log('✅ 已更新阶段名称')
      return true
    }
    
    for (const subStage of stage.subStages) {
      // 检查子阶段节点
      if (subStage.id === targetNode.id) {
        subStage.name = newName
        subStage.label = newName  // 同时更新label
        console.log('✅ 已更新子阶段名称')
        return true
      }
      
      // 检查任务节点
      const taskIndex = subStage.tasks.findIndex(t => t.id === targetNode.id)
      if (taskIndex !== -1) {
        subStage.tasks[taskIndex].name = newName
        subStage.tasks[taskIndex].label = newName  // 同时更新label
        console.log('✅ 已更新任务名称')
        return true
      }
    }
  }
  
  console.warn('❌ 未找到目标节点:', targetNode.id)
  return false
}

async function deleteNode(node) {
  if (!isAdmin.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除节点 "${node.label || node.name}" 吗？其下所有子节点也将被一并删除。`,
      '确认删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )

    const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
    if (areaIndex === -1) return

    const stages = areas.value[areaIndex].stages
    let deleted = false

    // 尝试从阶段级别删除
    const stageIdx = stages.findIndex(s => s.id === node.id)
    if (stageIdx !== -1) {
      stages.splice(stageIdx, 1)
      deleted = true
    }

    // 尝试从子阶段级别删除
    if (!deleted) {
      for (const stage of stages) {
        const subIdx = stage.subStages.findIndex(ss => ss.id === node.id)
        if (subIdx !== -1) {
          stage.subStages.splice(subIdx, 1)
          deleted = true
          break
        }
      }
    }

    // 尝试从任务级别删除
    if (!deleted) {
      for (const stage of stages) {
        for (const subStage of stage.subStages) {
          const taskIdx = subStage.tasks.findIndex(t => t.id === node.id)
          if (taskIdx !== -1) {
            subStage.tasks.splice(taskIdx, 1)
            deleted = true
            break
          }
        }
        if (deleted) break
      }
    }

    if (deleted) {
      updateAreaProgress()
      await syncProgressToDashboard()
      ElMessage.success('节点已删除')
    } else {
      ElMessage.warning('未找到要删除的节点')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete node error:', error)
      ElMessage.error('删除失败')
    }
  }
}

function showNodeMenu(event, data) {
  // 右键菜单预留，当前使用行内按钮
}

async function saveTask() {
  if (!editForm.value) return

  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return

  const stages = areas.value[areaIndex].stages
  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      const taskIndex = subStage.tasks.findIndex(t => t.id === editForm.value.id)
      if (taskIndex !== -1) {
        const updatedTask = { ...subStage.tasks[taskIndex], ...editForm.value }
        updatedTask.status = computeTaskStatus(updatedTask)
        if (updatedTask.progress >= 100 && !updatedTask.actualEndDate) {
          updatedTask.actualEndDate = new Date().toISOString().slice(0, 10)
        }
        if (updatedTask.progress > 0 && !updatedTask.actualStartDate) {
          updatedTask.actualStartDate = updatedTask.actualStartDate || new Date().toISOString().slice(0, 10)
        }

        subStage.tasks[taskIndex] = updatedTask
      }
    })
  })

  updateAreaProgress()
  drawerVisible.value = false
  await syncProgressToDashboard()
  ElMessage.success('保存成功')
}

function handleFileUpload(file) {
  if (!editForm.value) return
  
  const isImage = file.raw.type.startsWith('image/')
  const newFile = {
    id: `${Date.now()}-${Math.random()}`,
    name: file.name,
    url: URL.createObjectURL(file.raw),
    type: isImage ? 'image' : 'document',
    size: file.size
  }
  
  if (!editForm.value.files) {
    editForm.value.files = []
  }
  editForm.value.files.push(newFile)
}

function deleteFile(fileId) {
  if (!editForm.value) return
  editForm.value.files = editForm.value.files.filter(f => f.id !== fileId)
}

function setToday(field) {
  const today = new Date().toISOString().split('T')[0]
  editForm.value[field] = today
}

async function handleBatchUpdate() {
  const updates = {}
  if (batchForm.progress !== null && batchForm.progress !== undefined) updates.progress = batchForm.progress
  if (batchForm.startDate) updates.startDate = batchForm.startDate
  if (batchForm.endDate) updates.endDate = batchForm.endDate
  if (batchForm.manager) updates.manager = batchForm.manager
  if (batchForm.phone) updates.phone = batchForm.phone
  
  if (Object.keys(updates).length === 0) {
    ElMessage.warning('请至少选择一项要修改的内容')
    return
  }
  
  if (selectedTaskIds.value.length === 0) {
    ElMessage.warning('请至少选择一个任务')
    return
  }
  
  const updateCount = selectedTaskIds.value.length
  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return
  
  const stages = areas.value[areaIndex].stages
  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        if (selectedTaskIds.value.includes(task.id)) {
          Object.assign(task, updates)

          if ('progress' in updates) {
            if (task.progress >= 100) {
              task.status = 'completed'
            } else if (task.progress > 0) {
              task.status = 'in_progress'
            }
          }
        }
      })
    })
  })
  
  updateAreaProgress()
  showBatchModal.value = false
  selectedTaskIds.value = []
  batchForm.status = null
  batchForm.startDate = null
  batchForm.endDate = null
  batchForm.manager = ''
  batchForm.phone = ''
  await syncProgressToDashboard()
  ElMessage.success(`成功更新 ${updateCount} 个任务`)
}

async function handleCopyTemplate() {
  if (targetAreas.value.length === 0) {
    ElMessage.warning('请至少选择一个目标区域')
    return
  }
  
  const copyCount = targetAreas.value.length
  const sourceArea = areas.value.find(a => a.areaId === selectedAreaId.value)
  if (!sourceArea) return
  areas.value.forEach(area => {
    if (targetAreas.value.includes(area.areaId)) {
      area.stages = JSON.parse(JSON.stringify(sourceArea.stages))
      area.updatedAt = new Date().toISOString()
    }
  })
  
  updateAreaProgress()
  showCopyModal.value = false
  targetAreas.value = []
  await syncProgressToDashboard()
  ElMessage.success(`成功复制模板到 ${copyCount} 个区域`)
}

function exportData() {
  const dataStr = JSON.stringify(areas.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `project-progress-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function formatDate(date) {
  if (!date) return '未设定'
  return new Date(date).toLocaleDateString('zh-CN')
}

function getProgressColor(progress) {
  if (progress === 100) return '#52c41a'
  if (progress >= 75) return '#1890ff'
  if (progress >= 50) return '#faad14'
  return '#d9d9d9'
}

function getStatusType(status) {
  const statusMap = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    paused: 'warning',
    delayed: 'danger'
  }
  return statusMap[status] || 'info'
}

function getStatusText(status) {
  const statusMap = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '暂停',
    delayed: '延误'
  }
  return statusMap[status] || '未开始'
}

function computeTaskStatus(task) {
  const p = task.progress || 0
  const hasActualStart = !!task.actualStartDate
  const hasActualEnd = !!task.actualEndDate
  const hasPlanStart = !!task.plannedStartDate
  const hasPlanEnd = !!task.plannedEndDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (p >= 100 || hasActualEnd) {
    if (hasActualEnd && hasPlanEnd) {
      const actualEnd = new Date(task.actualEndDate)
      const planEnd = new Date(task.plannedEndDate)
      actualEnd.setHours(0, 0, 0, 0)
      planEnd.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((actualEnd - planEnd) / 86400000)
      if (diffDays > 0) return 'completed_overdue'
      if (diffDays < 0) return 'completed_ahead'
      return 'completed_ontime'
    }
    return 'completed'
  }

  if (task.status === 'paused') return 'paused'

  if (hasPlanStart && hasPlanEnd) {
    const planStart = new Date(task.plannedStartDate)
    const planEnd = new Date(task.plannedEndDate)
    planStart.setHours(0, 0, 0, 0)
    planEnd.setHours(0, 0, 0, 0)

    if (today < planStart) return 'not_started'

    if (p > 0 && hasActualStart) {
      const totalDays = Math.max(1, dayDiff(task.plannedStartDate, task.plannedEndDate))
      const elapsedDays = Math.max(0, (today - planStart) / 86400000)
      const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      const diff = p - expectedProgress

      if (diff > 10) return 'ahead_of_schedule'
      if (diff < -10) return 'behind_schedule'

      const daysRemaining = Math.ceil((planEnd - today) / 86400000)
      if (daysRemaining < 0) return 'delayed'
      return 'in_progress'
    }

    if (today >= planStart) {
      if (!hasActualStart) {
        const daysDelayed = Math.ceil((today - planStart) / 86400000)
        if (daysDelayed > 7) return 'delayed'
        return 'should_start'
      }
      return 'in_progress'
    }
  }

  if (hasPlanStart) {
    if (today >= new Date(task.plannedStartDate)) return 'delayed'
  }

  return 'not_started'
}

function dayDiff(d1, d2) {
  if (!d1 || !d2) return 1
  return Math.abs(new Date(d1) - new Date(d2)) / 86400000
}

function getComputedStatusColor(status) {
  const colorMap = {
    not_started: '#909399',
    should_start: '#E6A23C',
    started: '#409EFF',
    in_progress: '#409EFF',
    ahead_of_schedule: '#67C23A',
    behind_schedule: '#E6A23C',
    delayed: '#F56C6C',
    paused: '#909399',
    completed: '#67C23A',
    completed_ontime: '#67C23A',
    completed_ahead: '#67C23A',
    completed_overdue: '#F56C6C'
  }
  return colorMap[status] || '#909399'
}

function getComputedStatusType(status) {
  const statusMap = {
    not_started: 'info',
    should_start: 'warning',
    started: '',
    in_progress: 'primary',
    ahead_of_schedule: 'success',
    behind_schedule: 'warning',
    delayed: 'danger',
    paused: 'info',
    completed: 'success',
    completed_ontime: 'success',
    completed_ahead: 'success',
    completed_overdue: 'danger'
  }
  return statusMap[status] || 'info'
}

function getComputedStatusText(status) {
  const statusMap = {
    not_started: '未开始',
    should_start: '应开始',
    started: '已开始',
    in_progress: '施工中',
    ahead_of_schedule: '超前',
    behind_schedule: '滞后',
    delayed: '延期',
    paused: '暂停',
    completed: '已完成',
    completed_ontime: '正常完成',
    completed_ahead: '超前完成',
    completed_overdue: '超时完成'
  }
  return statusMap[status] || '未开始'
}

function filterNode(value, data) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

function initGanttChart() {
  if (!ganttChartRef.value || !selectedArea.value) return
  let chart = echarts.getInstanceByDom(ganttChartRef.value)
  if (chart) {
    chart.dispose()
  }
  chart = echarts.init(ganttChartRef.value)
  
  const plannedData = []
  const actualData = []
  const taskNames = []
  let taskIndex = 0
  
  const today = new Date()
  const defaultProjectStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  let autoDateCursor = new Date(defaultProjectStart)
  
  const allDates = []

  selectedArea.value.stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        let pStart, pEnd
        
        if (task.plannedStartDate && task.plannedEndDate) {
          pStart = new Date(task.plannedStartDate)
          pEnd = new Date(task.plannedEndDate)
        } else if (task.plannedStartDate) {
          pStart = new Date(task.plannedStartDate)
          pEnd = new Date(pStart.getTime() + 14 * 86400000)
          autoDateCursor = new Date(pEnd.getTime() + 86400000)
        } else {
          pStart = new Date(autoDateCursor)
          const durationDays = Math.max(7, Math.min(14, task.progress > 0 ? 14 : 7))
          pEnd = new Date(pStart.getTime() + durationDays * 86400000)
          autoDateCursor = new Date(pEnd.getTime() + 86400000)
        }
        
        allDates.push(pStart, pEnd)
        
        const computedStatus = computeTaskStatus(task)
        const baseColor = getComputedStatusColor(computedStatus)
        
        plannedData.push({
          name: task.name,
          value: [taskIndex, pStart.getTime(), pEnd.getTime(), computedStatus],
          itemStyle: { color: baseColor, opacity: 0.25 }
        })
        
        if (task.actualStartDate) {
          const aStart = new Date(task.actualStartDate)
          let aEnd
          if (task.actualEndDate) {
            aEnd = new Date(task.actualEndDate)
          } else if (task.progress >= 100) {
            aEnd = new Date(aStart.getTime() + 1 * 86400000)
          } else if (task.progress > 0 && task.plannedEndDate) {
            const planDuration = new Date(task.plannedEndDate) - new Date(task.plannedStartDate)
            aEnd = new Date(aStart.getTime() + planDuration * (task.progress / 100))
          } else {
            aEnd = new Date(Math.min(today.getTime(), aStart.getTime() + 30 * 86400000))
          }
          
          actualData.push({
            name: task.name,
            value: [taskIndex, aStart.getTime(), aEnd.getTime(), computedStatus],
            itemStyle: { color: baseColor }
          })
          allDates.push(aStart, aEnd)
        } else if (task.progress > 0) {
          const progressEnd = new Date(pStart.getTime() + (pEnd - pStart) * (task.progress / 100))
          actualData.push({
            name: task.name,
            value: [taskIndex, pStart.getTime(), progressEnd.getTime(), computedStatus],
            itemStyle: { color: baseColor }
          })
        }
        
        taskNames.push(task.name)
        taskIndex++
      })
    })
  })

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : defaultProjectStart
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : today
  const paddingBefore = (maxDate - minDate) * 0.08
  const paddingAfter = (maxDate - minDate) * 0.15
  const xMin = new Date(minDate.getTime() - paddingBefore)
  const xMax = new Date(maxDate.getTime() + paddingAfter)

  const option = {
    title: { 
      text: `${selectedArea.value?.areaName || ''} - ${FLOOR_NAMES[currentFloor.value - 1]}甘特图（计划 vs 实际）`, 
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      formatter: function(params) {
        const task = params.data
        const seriesName = params.seriesName
        const start = new Date(task.value[1]).toLocaleDateString('zh-CN')
        const end = new Date(task.value[2]).toLocaleDateString('zh-CN')
        const durationMs = task.value[2] - task.value[1]
        const durationDays = Math.round(durationMs / 86400000)
        return `${FLOOR_NAMES[currentFloor.value - 1]} | ${task.name}<br/>${seriesName}<br/>开始: ${start}<br/>结束: ${end}<br/>工期: ${durationDays}天`
      }
    },
    legend: { data: ['计划时间', '实际进度'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'time',
      min: xMin,
      max: xMax,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#ddd' } },
      axisLabel: {
        formatter: function(value) {
          const d = new Date(value)
          return (d.getMonth() + 1) + '/' + d.getDate()
        }
      }
    },
    yAxis: { type: 'category', data: taskNames, axisLabel: { interval: 0, rotate: 30 } },
    series: [
      {
        name: '计划时间',
        type: 'custom',
        renderItem: function(params, api) {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.5
          const rectShape = echarts.graphic.clipRectByRect(
            { x: start[0], y: start[1] - height / 2, width: end[0] - start[0], height: height },
            { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height }
          )
          return rectShape && { type: 'rect', shape: rectShape, style: api.style({ fill: api.style().fill, opacity: 0.3 }) }
        },
        data: plannedData,
        z: 99
      },
      {
        name: '实际进度',
        type: 'custom',
        renderItem: function(params, api) {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.35
          const rectShape = echarts.graphic.clipRectByRect(
            { x: start[0], y: start[1] - height / 2 + height * 0.32, width: Math.max(end[0] - start[0], 2), height: height },
            { x: params.coordSys.x, y: params.coordSys.y, width: params.coordSys.width, height: params.coordSys.height }
          )
          return rectShape && { type: 'rect', shape: rectShape, style: api.style() }
        },
        data: actualData,
        z: 100
      }
    ]
  }
  
  chart.setOption(option)
  
  const handleResize = () => {
    chart.resize()
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
    chart.dispose()
  }
}

watch(() => props.action, (newAction) => {
  console.log('ProgressManagement收到action:', newAction)
})

watch(showBatchModal, (newVal) => {
  if (!newVal) {
    batchForm.manager = ''
    batchForm.phone = ''
  }
})
</script>

<style scoped>
/* ========== CSS 变量系统 ========== */
:root {
  --primary-color: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #3b82f6;
  
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
 
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
}

/* ========== 基础布局 ========== */
.progress-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.el-container {
  height: 100%;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--bg-primary);
  box-shadow: var(--shadow-xl);
}

/* ========== 侧边栏优化 ========== */
.area-sidebar {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: var(--spacing-xl);
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
  position: relative;
}

.area-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
  opacity: 0.6;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.sidebar-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: 500;
}

/* ========== 区域卡片优化 ========== */
.area-card {
  background: var(--bg-primary);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.area-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.area-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.area-card:hover::before {
  transform: scaleX(1);
}

.area-card.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), var(--shadow-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
}

.area-card.selected::before {
  transform: scaleX(1);
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.area-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.area-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.area-info {
  flex: 1;
}

.info-item {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.info-item::before {
  content: '•';
  color: var(--primary-color);
  font-weight: bold;
}

/* ========== 主内容区优化 ========== */
.main-content {
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  position: relative;
}

.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

/* ========== 楼层切换器优化 ========== */
.floor-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(8px);
  transition: all var(--transition-fast);
}

.floor-switcher:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.floor-label {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
}

.floor-switcher :deep(.el-radio-group) {
  display: flex;
  gap: var(--spacing-xs);
}

.floor-switcher :deep(.el-radio-button__inner) {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast);
}

.floor-switcher :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

/* ========== 统计面板优化 ========== */
.statistics-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.statistics-panel::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1;
  border: 1px solid transparent;
}

.stat-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: var(--shadow-xl);
  border-color: rgba(255, 255, 255, 0.5);
}

.stat-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
  transition: all var(--transition-fast);
}

.stat-card:hover .stat-number {
  transform: scale(1.05);
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
  font-weight: 500;
}

.stat-ahead .stat-number { color: #10b981; }
.stat-ontime .stat-number { color: #3b82f6; }
.stat-overdue .stat-number { color: #ef4444; }
.stat-total .stat-number { color: #8b5cf6; }

/* ========== Tabs 优化 ========== */
.content-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.content-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
}

.content-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.content-tabs :deep(.el-tabs__item) {
  font-weight: 600;
  font-size: 14px;
  transition: all var(--transition-fast);
  padding: 0 var(--spacing-lg);
}

.content-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 700;
}

.content-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
}
.content-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.content-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-md) 0;
}

/* ========== 搜索框优化 ========== */
.task-search {
  margin-bottom: var(--spacing-lg);
}

.task-search :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.task-search :deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), var(--shadow-md);
}

/* ========== 树形节点优化 ========== */
.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  margin: var(--spacing-xs) 0;
  position: relative;
}

.tree-node:hover {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%);
  transform: translateX(4px);
}

.node-label {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}
.node-manager {
  font-size: 12px;
  color: var(--primary-color);
  margin-right: var(--spacing-sm);
  padding: 2px 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%);
  border-radius: 20px;
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.node-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transform: translateX(10px);
  transition: all var(--transition-normal);
  margin-left: var(--spacing-sm);
  flex-shrink: 0;
}

.tree-node:hover .node-actions {
  opacity: 1;
  transform: translateX(0);
}

.node-actions :deep(.el-button) {
  transition: all var(--transition-fast);
}

.node-actions :deep(.el-button:hover) {
  transform: scale(1.1) !important;
}

.node-progress {
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--info-color) 0%, #60a5fa 100%);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
  min-width: 40px;
  text-align: center;
}

/* ========== 甘特图优化 ========== */
.gantt-chart {
  width: 100%;
  height: 520px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

/* ========== 表单优化 ========== */
.task-edit-form {
  padding: var(--spacing-md) 0;
}

.task-edit-form .el-divider {
  margin: var(--spacing-xl) 0 var(--spacing-lg);
  border-top: 2px solid var(--border-light);
}

.task-edit-form .el-divider .el-icon {
  margin-right: var(--spacing-sm);
  font-size: 18px;
  color: var(--primary-color);
}

.task-edit-form .el-divider__text {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

.date-picker-group {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
}

.date-picker-group .el-date-picker {
  flex: 1;
}

.date-picker-group :deep(.el-input__wrapper) {
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.date-picker-group :deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
 }

.slider-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.slider-group .el-slider {
  flex: 1;
}

.progress-label {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary-color);
  min-width: 60px;
  text-align: center;
  background: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

.smart-status-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(129, 140, 248, 0.04) 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(99, 102, 241, 0.1);
}
.status-tag-main {
  font-size: 16px;
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-weight: 700;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.status-tag-main:hover {
  transform: scale(1.05);
}
.deviation-info {
  font-size: 13px;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.deviation-info.ahead {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.deviation-info.behind {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fcd34d;
}

.completion-hint {
  width: 100%;
}

.completion-hint :deep(.el-alert) {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  border: none;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
}

.file-list {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
}

.file-item:hover {
  border-color: var(--primary-color);
  border-style: solid;
  background: white;
  transform: translateX(4px);
}

.file-info {
  flex: 1;
}

.file-document {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* ========== 按钮优化 ========== */
.header-actions :deep(.el-button) {
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  border-width: 2px;
}
.header-actions :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.header-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border: none;
}

.header-actions :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.header-actions :deep(.el-button--danger) {
  animation: glow-red 2s ease-in-out infinite alternate;
}

@keyframes glow-red {
  from { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
  to { box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .statistics-panel {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .header-actions {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .area-sidebar {
    width: 100%;
    max-width: 100%;
    padding: var(--spacing-md);
  }
  
  .main-content {
    padding: var(--spacing-md);
  }
  
  .statistics-panel {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .stat-icon {
    font-size: 28px;
  }
  
  .stat-number {
    font-size: 26px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .floor-switcher {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .gantt-chart {
    height: 400px;
  }
  
  .smart-status-display {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .sidebar-title {
    font-size: 18px;
  }
  
  .area-progress {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  .header-actions :deep(.el-button) {
    width: 100%;
  }
}

/* ========== 滚动条优化 ========== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--primary-light) 0%, var(--primary-color) 100%);
  border-radius: 4px;
  border: 2px solid var(--bg-tertiary);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-dark) 100%);
}

/* ========== 加载动画 ========== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.area-card {
  animation: fadeInUp 0.5s ease-out forwards;
}

.area-card:nth-child(1) { animation-delay: 0.1s; }
.area-card:nth-child(2) { animation-delay: 0.2s; }
.area-card:nth-child(3) { animation-delay: 0.3s; }
.area-card:nth-child(4) { animation-delay: 0.4s; }

.stat-card {
  animation: fadeInUp 0.6s ease-out forwards;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

/* ========== 可访问性优化 ========== */
.el-button:focus-visible,
.el-input:focus-visible,
.el-select:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.tree-node:focus-within {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
</style>