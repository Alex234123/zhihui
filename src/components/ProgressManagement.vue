<template>
  <div class="progress-management">
    <div class="page-header">
      <h2 class="page-title">
        <img src="@/assets/images/yto-logo.png" alt="圆通速递" class="title-logo" />
        圆通淮安3号集运中心 - 施工区域进度
      </h2>
      <div class="header-actions">
        <!-- 楼层切换按钮组 -->
        <div class="floor-switcher">
          <span class="floor-label">当前楼层：</span>
          <el-radio-group :model-value="currentFloor" size="small" @change="switchFloor">
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
          @click="resetSelectedNodes"
          :disabled="selectedTaskIds.length === 0"
          plain
        >
          重置选中节点 ({{ selectedTaskIds.length }})
        </el-button>
        <el-button
          v-if="isAdmin"
          type="danger"
          size="small"
          @click="resetAllProgressData"
          class="reset-module-button"
        >
          <el-icon><Delete /></el-icon>
          重置进度数据
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-sidebar">
        <div
          v-for="area in areas"
          :key="area.areaId"
          class="area-card liquid-glass-card"
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
      </div>

      <div class="right-content" v-if="selectedArea" v-loading="floorLoading || areaLoading" element-loading-text="正在加载数据..." element-loading-background="rgba(255, 255, 255, 0.85)">
        <div v-if="isSyncing" class="sync-indicator">
          <el-icon class="sync-icon"><Loading /></el-icon>
          <span>同步中...</span>
        </div>
        <div class="statistics-panel">
          <div class="stat-card stat-ahead">
            <div class="stat-icon"><el-icon><Top /></el-icon></div>
            <div class="stat-content">
              <div class="stat-number">{{ completionStats.ahead }}</div>
              <div class="stat-label">超前完成</div>
            </div>
          </div>
          <div class="stat-card stat-ontime">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-content">
              <div class="stat-number">{{ completionStats.ontime }}</div>
              <div class="stat-label">正常完成</div>
            </div>
          </div>
          <div class="stat-card stat-overdue">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-content">
              <div class="stat-number">{{ completionStats.overdue }}</div>
              <div class="stat-label">超时完成</div>
            </div>
          </div>
          <div class="stat-card stat-total">
            <div class="stat-icon"><el-icon><DataLine /></el-icon></div>
            <div class="stat-content">
              <div class="stat-number">{{ completionStats.total }}</div>
              <div class="stat-label">总节点数</div>
            </div>
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
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="currentTask?.name"
      direction="rtl"
      size="640px"
      @close="handleDrawerClose"
    >
      <el-form v-if="editForm" :model="editForm" label-width="110px" class="task-edit-form">
        <el-divider content-position="left">
          <el-icon><User /></el-icon> 责任信息
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select
                v-model="editForm.manager"
                placeholder="请选择负责人"
                filterable
                @change="handleEditManagerChange"
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="editForm.phone" placeholder="选择负责人后自动填充" disabled />
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
          <el-select
            v-model="batchForm.manager"
            placeholder="请选择负责人（可选）"
            filterable
            clearable
            @change="handleBatchManagerChange"
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
        <el-form-item label="联系电话">
          <el-input v-model="batchForm.phone" placeholder="选择负责人后自动填充" disabled />
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  RefreshRight,
  Top,
  CircleCheck,
  Warning,
  Loading
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
// 导入弹窗稳定性增强工具
import { createStableClickHandler, safeOpenDialog } from '../utils/dialogUtils.js'
import dataService from '../services/dataService'
import { onDataUpdate } from '../api/api'

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
const personnelList = ref([])
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

// 楼层切换加载状态
const floorLoading = ref(false)
const areaLoading = ref(false)
const isSyncing = ref(false)

// 切换楼层：显示加载动画 → 保存当前层 → 切换 → 加载新层 → 隐藏动画
async function switchFloor(floor) {
  if (floor < 1 || floor > totalFloors) return

  const oldFloor = currentFloor.value
  if (oldFloor === floor) return

  // 防止重复点击（正在切换中）
  if (floorLoading.value) {
    console.log(`[ProgressManagement] ⏳ 正在切换中，忽略重复请求`)
    return
  }

  console.log(`[ProgressManagement] 🔄 切换楼层: ${FLOOR_NAMES[oldFloor - 1]} -> ${FLOOR_NAMES[floor - 1]}`)

  // 立即显示加载动画
  floorLoading.value = true

  try {
    // 1. 保存当前楼层的修改
    await saveCurrentFloorData()
    console.log('[ProgressManagement] ✅ 当前层数据已保存')

    // 2. 切换到新楼层
    isInternalSwitch = true
    currentFloor.value = floor
    await nextTick()
    isInternalSwitch = false
    console.log(`[ProgressManagement] ✅ 已切换到 ${FLOOR_NAMES[floor - 1]}`)

    // 3. 加载新楼层数据
    await loadCurrentFloorData()
    console.log('[ProgressManagement] ✅ 新层数据已加载')

  } catch (error) {
    console.error('[ProgressManagement] ❌ 切换楼层失败:', error)
    ElMessage.error('楼层切换失败，请重试')
    // 失败时回滚到原楼层
    isInternalSwitch = true
    currentFloor.value = oldFloor
    await nextTick()
    isInternalSwitch = false
    await loadCurrentFloorData()
  } finally {
    // 无论成功失败都隐藏加载动画
    floorLoading.value = false
  }
}

// 保存当前区域+楼层的详细数据
async function saveCurrentFloorData() {
  // 防止WebSocket推送回环：标记正在保存
  if (isSavingData) return
  isSavingData = true

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

    // 直接构建完整的对象格式数据，绕过dataService的动态键转换bug
    try {
      const { dataApi, request } = await import('../api/api')

      // 强制从服务器获取最新数据（不使用缓存）
      const allServerData = await request('/data')

      // 确保progressDetail是正确的对象格式: { 'area-A': { '1': {...}, '2': {...} }, ... }
      if (!allServerData.progressDetail || Array.isArray(allServerData.progressDetail)) {
        if (Array.isArray(allServerData.progressDetail)) {
          // 将旧的数组格式转换为新格式，保留所有已有数据
          const converted = {}
          allServerData.progressDetail.forEach(item => {
            if (item && item.areaId) {
              if (!converted[item.areaId]) converted[item.areaId] = {}
              converted[item.areaId]['1'] = item
            }
          })
          allServerData.progressDetail = converted
          console.log('[ProgressManagement] 🔄 已将旧数组格式转换为对象格式')
        } else {
          allServerData.progressDetail = {}
        }
      }

      // 只更新当前区域+楼层的数据，保留其他所有区域不变
      if (!allServerData.progressDetail[areaId]) {
        allServerData.progressDetail[areaId] = {}
      }
      allServerData.progressDetail[areaId][floor] = allAreaData.value[areaId][floor]

      await dataApi.saveAllData(allServerData)
      console.log(`[ProgressManagement] ✅ 已保存 ${areaId} ${FLOOR_NAMES[floor - 1]} 数据 (直接API, 保留其他区域)`)
      return true
    } catch (apiError) {
      console.warn('[ProgressManagement] 直接API保存失败，回退到dataService:', apiError)
      // 回退：使用原始的dataService方式
      const storageKey = `progressDetail-${areaId}-${floor}`
      const result = await dataService.set(storageKey, allAreaData.value[areaId][floor])
      console.log(`[ProgressManagement] ⚠️ 已通过dataService回退保存 ${areaId} ${FLOOR_NAMES[floor - 1]} 数据`)
      return result
    }
  } catch (error) {
    console.error('[ProgressManagement] ❌ 保存楼层数据失败:', error)
    return false
  } finally {
    isSavingData = false
    lastSaveTime = Date.now()
  }
}

// 加载当前区域+楼层的详细数据
async function loadCurrentFloorData() {
  try {
    const areaId = selectedAreaId.value
    const floor = currentFloor.value
    const expectedPrefix = FLOOR_PREFIXES[floor - 1]

    console.log(`[ProgressManagement] 正在加载 ${areaId} ${FLOOR_NAMES[floor - 1]} 数据... (期望前缀: "${expectedPrefix}")`)

    let savedData = null

    // 直接从API读取，绕过dataService的动态键转换bug
    try {
      const { request } = await import('../api/api')
      // 强制从服务器获取最新数据（不使用缓存）
      const allServerData = await request('/data')
      const detailData = allServerData.progressDetail

      if (detailData && typeof detailData === 'object' && !Array.isArray(detailData)) {
        if (detailData[areaId] && detailData[areaId][floor]) {
          savedData = detailData[areaId][floor]
          console.log(`[ProgressManagement] ✅ 从对象格式找到 ${areaId} floor${floor} 数据`)
        }
      } else if (detailData && Array.isArray(detailData)) {
        const arrayItem = detailData.find(item => item && item.areaId === areaId)
        if (arrayItem) {
          savedData = arrayItem
          console.log(`[ProgressManagement] ⚠️ 从数组格式找到 ${areaId} 数据（兼容模式）`)
        }
      }

      if (savedData) {
        console.log(`[ProgressManagement] 🔍 阶段数=${savedData.stages ? savedData.stages.length : 0}`)
      }
    } catch (apiError) {
      console.warn('[ProgressManagement] 直接API加载失败，回退到dataService:', apiError)
      const storageKey = `progressDetail-${areaId}-${floor}`
      savedData = await dataService.get(storageKey, null)
    }

    // 验证楼层前缀
    if (savedData && savedData.stages && savedData.stages.length > 0) {
      const firstStageName = savedData.stages[0]?.name || ''
      const firstTaskName = savedData.stages[0]?.subStages?.[0]?.tasks?.[0]?.name || ''

      console.log(`[ProgressManagement] 🔍 阶段名="${firstStageName}", 任务名="${firstTaskName}"`)

      const hasCorrectPrefix = firstStageName.startsWith(expectedPrefix) || firstTaskName.startsWith(expectedPrefix)
      const hasWrongFloorPrefix = FLOOR_PREFIXES.some(prefix => {
        if (prefix === expectedPrefix) return false
        return firstStageName.startsWith(prefix) || firstTaskName.startsWith(prefix)
      })

      if (hasWrongFloorPrefix || !hasCorrectPrefix) {
        console.warn(`[ProgressManagement] ⚠️ 检测到脏数据! 期望: "${expectedPrefix}", 实际: "${firstStageName}"`)
        savedData = null
      }
    }

    if (savedData && savedData.stages && savedData.stages.length > 0) {
      const areaIndex = areas.value.findIndex(a => a.areaId === areaId)
      if (areaIndex !== -1) {
        Object.assign(areas.value[areaIndex], savedData)
        updateAreaProgress()
        console.log(`[ProgressManagement] ✅ 恢复 ${FLOOR_NAMES[floor - 1]} 数据 (${savedData.stages.length} 个阶段)`)

        await syncProgressToDashboard()
      }
    } else {
      // 无已保存数据或数据已被清理（脏数据），使用默认模板并添加楼层前缀
      console.log(`[ProgressManagement] ℹ️ ${FLOOR_NAMES[floor - 1]} 无历史数据/数据已重置，使用默认模板`)
      await initializeCurrentFloorWithPrefix(true)  // 强制模式：忽略已有数据检查
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

// 重置选中的节点
async function resetSelectedNodes() {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员才能执行此操作')
    return
  }

  if (!treeRef.value) {
    ElMessage.warning('无法获取树形组件引用')
    return
  }

  const checkedNodes = treeRef.value.getCheckedNodes()
  if (checkedNodes.length === 0) {
    ElMessage.warning('请先选择要重置的节点')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要重置选中的 ${checkedNodes.length} 个节点吗？\n\n⚠️ 此操作将清除这些节点的所有进度、状态、负责人、日期等数据，恢复为初始状态！`,
      '⚠️ 确认重置选中节点',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    console.log(`[ProgressManagement] 🗑️ 开始重置 ${checkedNodes.length} 个选中节点`)

    const areaId = selectedAreaId.value
    const areaIndex = areas.value.findIndex(a => a.areaId === areaId)
    if (areaIndex === -1) return

    let resetCount = 0

    checkedNodes.forEach(checkedNode => {
      const resetNodeInStages = (stages) => {
        for (const stage of stages) {
          if (stage.id === checkedNode.id || stage.name === checkedNode.label) {
            resetNodeData(stage)
            resetCount++
            return true
          }
          if (stage.subStages) {
            for (const subStage of stage.subStages) {
              if (subStage.id === checkedNode.id || subStage.name === checkedNode.label) {
                resetNodeData(subStage)
                resetCount++
                return true
              }
              if (subStage.tasks) {
                for (const task of subStage.tasks) {
                  if (task.id === checkedNode.id || task.name === checkedNode.label) {
                    resetNodeData(task)
                    resetCount++
                    return true
                  }
                }
              }
            }
          }
        }
        return false
      }

      resetNodeInStages(areas.value[areaIndex].stages)
    })

    updateAreaProgress()
    await saveCurrentFloorData()

    ElMessage.success(`✅ 成功重置 ${resetCount} 个节点`)
    console.log(`[ProgressManagement] ✅ 已重置 ${resetCount} 个节点`)

    selectedTaskIds.value = []

  } catch (error) {
    if (error !== 'cancel') {
      console.error('[ProgressManagement] ❌ 重置选中节点失败:', error)
      ElMessage.error('重置失败: ' + error.message)
    }
  }
}

// 重置单个节点的数据
function resetNodeData(node) {
  node.progress = 0
  node.status = 'not_started'
  node.startDate = null
  node.endDate = null
  node.manager = ''
  node.phone = ''
  node.remark = ''
  node.actualStartDate = null
  node.actualEndDate = null
}

const resetAllProgressData = async () => {
  if (!isAdmin.value) {
    ElMessage.error('您没有执行此操作的权限')
    return
  }

  ElMessageBox.confirm(
    '此操作将清空所有进度数据（包括各区块、各楼层的详细节点数据），且不可恢复！确定要继续吗？',
    '⚠️ 确认重置进度数据',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await dataService.set('progress', [])
      await dataService.set('progressDetail', {})
      
      const areaIds = ['area-A', 'area-B', 'area-C', 'area-D']
      const totalFloors = 3
      for (const areaId of areaIds) {
        for (let floor = 1; floor <= totalFloors; floor++) {
          const detailKey = `progressDetail-${areaId}-${floor}`
          await dataService.set(detailKey, null)
        }
      }
      
      progressList.value = []
      
      const currentUserName = localStorage.getItem('zhihui_site_username') || '匿名用户'
      await dataService.addLog('info', `${currentUserName} 重置了所有进度数据`)
      
      ElMessage.success('进度数据已成功重置')
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('重置进度数据失败:', error)
      ElMessage.error('重置失败，请稍后重试')
    }
  }).catch(() => {})
}

// 为当前楼层初始化带前缀的模板数据
async function initializeCurrentFloorWithPrefix(forceReInit = false) {
  const prefix = FLOOR_PREFIXES[currentFloor.value - 1]
  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return

  const currentStages = areas.value[areaIndex].stages

  // 检查当前是否已有用户编辑的数据（避免覆盖）
  // forceReInit=true 时跳过检查（用于脏数据修复场景）
  if (!forceReInit) {
    const hasUserData = currentStages && currentStages.some(stage => {
      return (stage.subStages || []).some(subStage => {
        return (subStage.tasks || []).some(task => {
          return task.progress > 0 ||
                 task.status !== 'not_started' ||
                 task.startDate ||
                 task.endDate ||
                 task.manager ||
                 task.phone
        })
      })
    })

    if (hasUserData) {
      console.log(`[ProgressManagement] ⚠️ 检测到已有用户数据，跳过初始化模板`)
      return
    }
  }

  console.log(`[ProgressManagement] 📝 初始化 ${FLOOR_NAMES[currentFloor.value - 1]} 默认模板（前缀: "${prefix}"${forceReInit ? ', 强制模式' : ''}）`)

  // 创建带楼层前缀的深拷贝模板
  const templateStages = createTemplateStages(prefix)
  areas.value[areaIndex].stages = templateStages

  // 更新进度计算
  updateAreaProgress()

  // 保存到服务器（当前楼层详细数据）
  await saveCurrentFloorData()

  // 同步进度概要到 Dashboard
  await syncProgressToDashboard()

  ElMessage.info(`已初始化 ${FLOOR_NAMES[currentFloor.value - 1]} 默认数据（带"${prefix}"前缀）`)
}

// 管理员权限检查
const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

const constructionPersonnel = computed(() => {
  return personnelList.value.filter(p => p.responsibility === '施工单位')
})

const handleEditManagerChange = (selectedName) => {
  if (selectedName) {
    const selectedPerson = constructionPersonnel.value.find(p => p.name === selectedName)
    if (selectedPerson && editForm.value) {
      editForm.value.phone = selectedPerson.phone
    }
  } else if (editForm.value) {
    editForm.value.phone = ''
  }
}

const handleBatchManagerChange = (selectedName) => {
  if (selectedName) {
    const selectedPerson = constructionPersonnel.value.find(p => p.name === selectedName)
    if (selectedPerson) {
      batchForm.phone = selectedPerson.phone
    }
  } else {
    batchForm.phone = ''
  }
}

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

    const planDates = getAreaPlanDates(area.stages)

    return {
      block: blockLetter,
      progress: area.progress,
      manager: '',
      phone: '',
      stage: currentNode.stageName || '已完成',
      currentNode: currentNode.taskName || '',
      targetDate: formatDate(area.estimatedCompletionDate) || formatDate(planDates.endDate),
      startDate: formatDate(planDates.startDate) || currentNode.startDate || '',
      plannedStartDate: formatDate(planDates.startDate) || '',
      plannedEndDate: formatDate(planDates.endDate) || '',
      id: area.areaId
    }
  })
}

function getAreaPlanDates(stages) {
  let earliestStart = null
  let latestEnd = null

  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        const startDate = task.plannedStartDate || task.startDate
        const endDate = task.plannedEndDate || task.endDate

        if (startDate) {
          if (!earliestStart || new Date(startDate) < new Date(earliestStart)) {
            earliestStart = startDate
          }
        }
        if (endDate) {
          if (!latestEnd || new Date(endDate) > new Date(latestEnd)) {
            latestEnd = endDate
          }
        }
      })
    })
  })

  return { startDate: earliestStart, endDate: latestEnd }
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
    console.log('[ProgressManagement] 开始同步进度概要到服务器...')

    const progressData = convertToDashboardProgress()

    // 只保存进度概要（不含详细节点数据）
    // 详细数据由 saveCurrentFloorData() 按区域+楼层单独保存，避免互相覆盖
    const result1 = await dataService.set('progress', progressData)
    console.log('[ProgressManagement] ✅ 进度概要已保存:', result1 ? '成功' : '失败')

    if (result1) {
      console.log('[ProgressManagement] ✅ 进度概要同步完成')
    } else {
      console.warn('[ProgressManagement] ⚠️ 进度概要同步可能未成功')
    }

    return result1
  } catch (error) {
    console.error('[ProgressManagement] ❌ 同步进度数据失败:', error)
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

// WebSocket监听器注销函数
let unregisterWsListener = null
// 防止自己触发的WebSocket推送导致循环加载
let isSavingData = false
let lastSaveTime = 0

// 标记是否是 switchFloor 内部触发的楼层变化（防止 watcher 循环）
let isInternalSwitch = false

onMounted(async () => {
  try {
    // 初始化区域基础数据（不含stages）
    initializeAreas()

    // 加载当前选中区域的当前楼层数据
    await loadCurrentFloorData()
    
    // 加载人员数据
    personnelList.value = await dataService.get('personnel', [])

    // 注册WebSocket实时同步监听（局域网多设备数据同步）
    unregisterWsListener = onDataUpdate('progressDetail', async (message) => {
      // 关键修复：忽略自己触发的推送，防止无限循环
      if (isSavingData) {
        console.log(`[ProgressManagement] ⏭️ 跳过自己触发的推送（正在保存中）`)
        return
      }

      // 如果推送时间距离上次保存太近（<2秒），也跳过（防止时序竞争）
      const timeSinceSave = Date.now() - lastSaveTime
      if (timeSinceSave < 2000) {
        console.log(`[ProgressManagement] ⏭️ 跳过刚保存后的推送 (${timeSinceSave}ms ago)`)
        return
      }

      console.log(`[ProgressManagement] 📡 收到其他设备的进度更新 (v${message.version})`)

      // 显示同步状态
      isSyncing.value = true

      // 如果更新的就是当前正在查看的区块+楼层，立即刷新
      if (!isSwitchingArea) {
        const currentId = selectedAreaId.value
        const currentFl = currentFloor.value

        setTimeout(async () => {
          // 再次检查状态（可能已变化）
          if (!isSwitchingArea && selectedAreaId.value === currentId && currentFloor.value === currentFl) {
            console.log(`[ProgressManagement] 🔄 刷新 ${currentId} 第${currentFl}层 数据（来自其他设备）`)
            // 先保存当前正在编辑的数据，防止丢失
            try {
              await saveCurrentFloorData()
            } catch (saveError) {
              console.warn('[ProgressManagement] ⚠️ 同步前保存失败:', saveError)
            }
            await loadCurrentFloorData()
          }
          // 隐藏同步状态
          isSyncing.value = false
        }, 500)
      } else {
        isSyncing.value = false
      }
    })

    console.log('[ProgressManagement] ✅ WebSocket实时同步已启用')
  } catch (error) {
    console.error('[ProgressManagement] 初始化失败:', error)
    initializeAreas()
    // 如果加载失败，尝试初始化当前楼层
    initializeCurrentFloorWithPrefix()
  }
})

// 组件卸载前自动保存数据（防止切换页面时数据丢失）
onBeforeUnmount(async () => {
  console.log('[ProgressManagement] 🔄 组件即将卸载，保存当前数据...')
  isSwitchingArea = true

  // 注销WebSocket监听器
  if (unregisterWsListener) {
    unregisterWsListener()
    unregisterWsListener = null
    console.log('[ProgressManagement] ✅ WebSocket监听器已注销')
  }

  try {
    await saveCurrentFloorData()
    await syncProgressToDashboard()
    console.log('[ProgressManagement] ✅ 组件卸载前数据已保存')
  } catch (error) {
    console.error('[ProgressManagement] ❌ 组件卸载前保存失败:', error)
  } finally {
    isSwitchingArea = false
  }
})

// 监听关键数据变化，实时自动保存（防抖）
let saveTimeout = null
let isSwitchingArea = false
watch(
  () => areas.value,
  async (newAreas) => {
    if (!newAreas || newAreas.length === 0) return
    if (isSwitchingArea) return

    // 防抖：避免频繁保存
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(async () => {
      if (isSwitchingArea) return
      console.log('[ProgressManagement] 💾 检测到数据变化，自动保存...')
      try {
        await saveCurrentFloorData()
        await syncProgressToDashboard()
      } catch (error) {
        console.error('[ProgressManagement] ❌ 自动保存失败:', error)
      }
    }, 1000) // 1秒防抖
  },
  { deep: true }
)

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
function selectArea(areaId) {
  if (selectedAreaId.value === areaId) return

  // 防止重复点击
  if (areaLoading.value || floorLoading.value) {
    console.log(`[ProgressManagement] ⏳ 正在切换中，忽略重复请求`)
    return
  }

  const oldAreaId = selectedAreaId.value
  console.log(`[ProgressManagement] 🔄 切换区块: ${oldAreaId} -> ${areaId}`)

  // 显示加载动画
  areaLoading.value = true
  floorLoading.value = true

  // 立即保存当前区域数据（不等待防抖）
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }

  saveCurrentFloorData()
    .then(() => {
      console.log('[ProgressManagement] ✅ 当前区块数据已保存')
      // 切换到新区域
      selectedAreaId.value = areaId
      // 加载新区域数据
      return loadCurrentFloorData()
    })
    .then(() => {
      console.log(`[ProgressManagement] ✅ 已切换到 ${areaId}`)
    })
    .catch(error => {
      console.error('[ProgressManagement] ❌ 切换区块失败:', error)
      ElMessage.error('区块切换失败，请重试')
      // 回滚
      selectedAreaId.value = oldAreaId
      return loadCurrentFloorData()
    })
    .finally(() => {
      areaLoading.value = false
      floorLoading.value = false
    })
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

  // 立即保存到服务器（确保数据持久化）
  console.log('[ProgressManagement] 💾 任务编辑后立即保存...')
  await saveCurrentFloorData()
  await syncProgressToDashboard()
  ElMessage.success('保存成功')
}

// 抽屉关闭时自动保存未保存的更改
async function handleDrawerClose() {
  if (!editForm.value || !currentTask.value) return

  const areaIndex = areas.value.findIndex(a => a.areaId === selectedAreaId.value)
  if (areaIndex === -1) return

  const stages = areas.value[areaIndex].stages
  let hasChanges = false

  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      const taskIndex = subStage.tasks.findIndex(t => t.id === editForm.value.id)
      if (taskIndex !== -1) {
        const currentTask = subStage.tasks[taskIndex]
        if (currentTask.manager !== editForm.value.manager ||
            currentTask.phone !== editForm.value.phone ||
            currentTask.progress !== editForm.value.progress ||
            currentTask.startDate !== editForm.value.startDate ||
            currentTask.endDate !== editForm.value.endDate ||
            currentTask.remark !== editForm.value.remark) {
          hasChanges = true
        }
      }
    })
  })

  if (hasChanges) {
    console.log('[ProgressManagement] 💾 检测到未保存的更改，自动保存...')
    try {
      await saveTask()
    } catch (error) {
      console.error('[ProgressManagement] ❌ 自动保存失败:', error)
    }
  }
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

  // 立即保存到服务器（确保数据持久化）
  console.log('[ProgressManagement] 💾 批量更新后立即保存...')
  await saveCurrentFloorData()
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
.progress-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  padding: var(--future-spacing-lg);
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

/* Page Header - 统一风格 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--future-spacing-lg);
  padding: var(--future-spacing-lg) var(--future-spacing-xl);
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.03) 0%, rgba(255, 102, 0, 0.03) 100%);
  border-bottom: 1px solid rgba(102, 0, 153, 0.1);
  border-radius: var(--future-radius-2xl);
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
  padding-left: 16px;
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 26px;
  background: linear-gradient(180deg, var(--future-primary), var(--future-secondary));
  border-radius: var(--future-radius-full);
}

.title-icon {
  font-size: 28px;
  color: var(--future-primary);
}

.title-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  border-radius: var(--future-radius-sm);
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: var(--future-spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.header-actions .el-button {
  transition: all var(--future-transition-normal) var(--future-easing);
  border-radius: var(--future-radius-md);
  font-weight: 500;
  letter-spacing: 0.3px;
  box-shadow: var(--future-shadow-sm);
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--future-shadow-md);
}

/* Floor Switcher */
.floor-switcher {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-sm);
  padding: var(--future-spacing-sm) var(--future-spacing-md);
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.06) 0%, rgba(255, 102, 0, 0.04) 100%);
  border-radius: var(--future-radius-lg);
  border: 1px solid rgba(102, 0, 153, 0.15);
  box-shadow: var(--future-shadow-sm);
}

.floor-label {
  font-size: 13px;
  color: var(--future-primary);
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.floor-switcher :deep(.el-radio-group) {
  display: flex;
  gap: 6px;
}

.floor-switcher :deep(.el-radio-button__inner) {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--future-radius-md) !important;
  transition: all var(--future-transition-normal) ease;
}

/* Main Content */
.main-content {
  display: flex;
  gap: var(--future-spacing-lg);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Left Sidebar */
.left-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--future-spacing-md);
  overflow: visible;
  padding: var(--future-spacing-sm);
}

/* Area Card - 使用全局 liquid-glass-card 样式 */
.area-card {
  padding: var(--future-spacing-lg);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  border: 2px solid transparent;
  font-weight: 700;
}

.area-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 0, 153, 0.2), 0 4px 12px rgba(102, 0, 153, 0.1);
  z-index: 10;
}

.area-card.selected {
  border-color: var(--future-primary) !important;
  border-width: 3px !important;
  box-shadow: 0 0 0 4px rgba(102, 0, 153, 0.25), 0 8px 24px rgba(102, 0, 153, 0.2);
  transform: scale(1.02);
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--future-spacing-md);
}

.area-name {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: var(--future-text-primary);
  letter-spacing: 0.5px;
}

.area-progress {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-md);
}

.area-info {
  flex: 1;
}

.info-item {
  font-size: 13px;
  color: var(--future-text-secondary);
  margin-bottom: 5px;
  font-weight: 500;
}

/* Right Content */
.right-content {
  flex: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.88) 100%);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: var(--future-radius-2xl);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--future-shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: var(--future-spacing-lg);
  position: relative;
}

/* Sync Indicator */
.sync-indicator {
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, var(--future-primary), var(--future-secondary));
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.3);
  animation: syncPulse 1.5s ease-in-out infinite;
}

.sync-icon {
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes syncPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Statistics Panel */
.statistics-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--future-spacing-md);
  margin-bottom: var(--future-spacing-lg);
  padding: var(--future-spacing-lg);
  background: linear-gradient(135deg, var(--future-primary) 0%, var(--future-primary-dark) 50%, var(--future-primary-light) 100%);
  border-radius: var(--future-radius-2xl);
  box-shadow: var(--future-shadow-xl), inset 0 2px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.statistics-panel::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -30%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--future-spacing-md);
  padding: var(--future-spacing-md);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--future-radius-xl);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--future-shadow-md);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.stat-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: var(--future-shadow-xl);
}

.stat-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  color: var(--future-primary);
}

.stat-ahead .stat-icon { 
  color: var(--future-success); 
}
.stat-ontime .stat-icon { 
  color: var(--future-info); 
}
.stat-overdue .stat-icon { 
  color: var(--future-danger); 
}
.stat-total .stat-icon { 
  color: var(--future-primary); 
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 800;
  color: var(--future-text-primary);
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.stat-ahead .stat-number { 
  color: var(--future-success); 
  text-shadow: 0 2px 8px rgba(0, 180, 42, 0.2);
}
.stat-ontime .stat-number { 
  color: var(--future-info); 
  text-shadow: 0 2px 8px rgba(22, 93, 255, 0.2);
}
.stat-overdue .stat-number { 
  color: var(--future-danger); 
  text-shadow: 0 2px 8px rgba(245, 63, 63, 0.2);
}
.stat-total .stat-number { 
  color: var(--future-primary); 
  text-shadow: 0 2px 8px rgba(102, 0, 153, 0.2);
}

.stat-label {
  font-size: 13px;
  color: var(--future-text-muted);
  margin-top: 4px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Content Tabs */
.content-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--future-radius-xl);
  border: 1px solid rgba(102, 0, 153, 0.08);
  padding: var(--future-spacing-md);
}

.content-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.content-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
  padding: var(--future-spacing-md) 0;
}

.task-search {
  margin-bottom: var(--future-spacing-md);
}

.task-search :deep(.el-input) {
  border-radius: var(--future-radius-lg);
  box-shadow: var(--future-shadow-sm);
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 6px 0;
  transition: all 0.2s ease;
  border-radius: var(--future-radius-md);
}

.tree-node:hover {
  background: rgba(102, 0, 153, 0.03);
  padding-left: 8px;
  padding-right: 8px;
}

.node-label {
  flex: 1;
  font-weight: 500;
  color: var(--future-text-primary);
}

.node-manager {
  font-size: 12px;
  color: var(--future-primary);
  margin-right: 8px;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.08) 0%, rgba(102, 0, 153, 0.04) 100%);
  border-radius: var(--future-radius-full);
  font-weight: 500;
  border: 1px solid rgba(102, 0, 153, 0.12);
}

.node-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.gantt-chart {
  width: 100%;
  height: 520px;
  border-radius: var(--future-radius-xl);
  overflow: hidden;
  box-shadow: var(--future-shadow-md);
}

.date-picker-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.date-picker-group .el-date-picker {
  flex: 1;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.slider-group .el-slider {
  flex: 1;
}

.progress-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--future-primary);
  min-width: 55px;
  text-align: center;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.06) 0%, rgba(255, 102, 0, 0.04) 100%);
  border-radius: var(--future-radius-md);
}

.file-list {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(102, 0, 153, 0.12);
  border-radius: var(--future-radius-lg);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateX(4px);
  box-shadow: var(--future-shadow-md);
  border-color: rgba(102, 0, 153, 0.25);
}

.file-info {
  flex: 1;
}

.file-document {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .statistics-panel {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-sidebar {
    width: 100%;
    max-width: 100%;
    padding: 16px;
    flex-direction: row;
    overflow-x: auto;
  }
  
  .area-card {
    min-width: 280px;
  }

  .right-content {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .statistics-panel {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
    border-radius: var(--future-radius-xl);
  }

  .stat-icon {
    font-size: 24px;
  }

  .stat-number {
    font-size: 22px;
  }

  .page-title {
    font-size: 20px;
  }
}

.task-edit-form .el-divider {
  margin: 18px 0 14px;
}

.task-edit-form .el-divider .el-icon {
  margin-right: 8px;
  color: var(--future-primary);
}

.smart-status-display {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.status-tag-main {
  font-size: 16px;
  padding: 10px 24px;
  border-radius: var(--future-radius-lg);
  font-weight: 600;
  box-shadow: var(--future-shadow-sm);
}

.deviation-info {
  font-size: 13px;
  padding: 6px 14px;
  border-radius: var(--future-radius-lg);
  font-weight: 600;
}

.deviation-info.ahead {
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f8e4 100%);
  color: var(--future-success);
  border: 1px solid #c2e7b0;
  box-shadow: 0 2px 6px rgba(0, 180, 42, 0.15);
}

.deviation-info.behind {
  background: linear-gradient(135deg, #fdf6ec 0%, #faf0e4 100%);
  color: var(--future-warning);
  border: 1px solid #faecd8;
  box-shadow: 0 2px 6px rgba(255, 125, 0, 0.15);
}

.node-progress {
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, var(--future-info) 0%, var(--future-info-light) 100%);
  padding: 2px 8px;
  border-radius: var(--future-radius-full);
  margin-left: 6px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(22, 93, 255, 0.25);
}

.completion-hint {
  width: 100%;
}

.completion-hint :deep(.el-alert) {
  padding: 6px 12px;
  border-radius: var(--future-radius-lg);
}
</style>
