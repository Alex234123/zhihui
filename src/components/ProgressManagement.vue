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
          <div class="page-header">
            <h2 class="page-title">{{ selectedArea.areaName }} - 进度管理</h2>
            <div class="header-actions">
              <el-button type="primary" :icon="CopyDocument" @click="showCopyModal = true">
                复制模板
              </el-button>
              <el-button :icon="Edit" :disabled="selectedTaskIds.length === 0" @click="showBatchModal = true">
                批量编辑 ({{ selectedTaskIds.length }})
              </el-button>
              <el-button :icon="Download" @click="exportData">
                导出数据
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
                    <el-tag v-if="data.status" :type="getStatusType(data.status)" size="small">
                      {{ getStatusText(data.status) }}
                    </el-tag>
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
      size="600px"
    >
      <el-form v-if="editForm" :model="editForm" label-width="100px">
        <el-form-item label="负责人">
          <el-input v-model="editForm.manager" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="完成百分比">
          <div class="slider-group">
            <el-slider
              v-model="editForm.progress"
              :min="0"
              :max="100"
              :show-input="true"
              :show-tooltip="true"
            />
            <span class="progress-label">{{ editForm.progress }}%</span>
          </div>
        </el-form-item>

        <el-form-item label="任务状态">
          <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已延期" value="delayed" />
          </el-select>
        </el-form-item>

        <el-form-item label="计划开始日期">
          <div class="date-picker-group">
            <el-date-picker
              v-model="editForm.startDate"
              type="date"
              placeholder="选择计划开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button @click="setToday('startDate')">今日</el-button>
          </div>
        </el-form-item>

        <el-form-item label="计划结束日期">
          <div class="date-picker-group">
            <el-date-picker
              v-model="editForm.endDate"
              type="date"
              placeholder="选择计划结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button @click="setToday('endDate')">今日</el-button>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileUpload"
            multiple
            :show-file-list="false"
          >
            <el-button :icon="Upload">上传文件</el-button>
          </el-upload>
          
          <div class="file-list">
            <div v-for="file in editForm.files" :key="file.id" class="file-item">
              <div class="file-info">
                <el-image
                  v-if="file.type === 'image'"
                  :src="file.url"
                  :preview-src-list="[file.url]"
                  style="width: 100px; height: 100px; object-fit: cover;"
                />
                <div v-else class="file-document">
                  <el-tag type="primary">文档</el-tag>
                  <span>{{ file.name }}</span>
                </div>
              </div>
              <el-button type="danger" :icon="Delete" circle @click="deleteFile(file.id)" />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveTask">保存</el-button>
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
  Delete
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
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
          { id: 'task-4-1-2', name: '找坡找平', status: 'not_started', startDate: null, endDate: null, files: [], remark:'' },
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

const areas = ref([])
const selectedAreaId = ref('area-A')
const selectedTaskIds = ref([])
const drawerVisible = ref(false)
const currentTask = ref(null)
const editForm = ref(null)

const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

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
      startDate: currentDate || '',
      id: area.areaId
    }
  })
}

function getCurrentStageInfo(stages) {
  let result = {
    stageName: null,
    taskName: null,
    startDate: null,
    maxProgress: 0
  }

  for (const stage of stages) {
    for (const subStage of stage.subStages) {
      const subStageProgress = subStage.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / (subStage.tasks.length || 1)
      if (subStageProgress > result.maxProgress && subStageProgress < 100) {
        result.maxProgress = subStageProgress
        result.stageName = subStage.name
        const inProgressTask = subStage.tasks.find(t => t.progress > 0 && t.progress < 100)
        result.taskName = inProgressTask ? inProgressTask.name : subStage.name
        result.startDate = inProgressTask ? inProgressTask.startDate : null
      }
    }
  }

  if (!result.stageName && result.maxProgress === 0) {
    const firstTask = stages[0]?.subStages[0]?.tasks[0]
    if (firstTask) {
      result.stageName = '准备中'
      result.taskName = firstTask.name
      result.startDate = firstTask.startDate
    }
  }

  return result
}

function getCurrentStage(stages) {
  let currentStage = null
  let maxProgress = 0

  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i]
    for (const subStage of stage.subStages) {
      const subStageProgress = subStage.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / (subStage.tasks.length || 1)
      if (subStageProgress > maxProgress && subStageProgress < 100) {
        maxProgress = subStageProgress
        currentStage = subStage.name
      }
    }
  }

  return currentStage || '已完成'
}

async function syncProgressToDashboard() {
  try {
    const progressData = convertToDashboardProgress()
    await dataService.set('progress', progressData)
    await dataService.set('progressDetail', JSON.parse(JSON.stringify(areas.value)))
  } catch (error) {
    console.error('同步进度数据失败:', error)
  }
}

onMounted(async () => {
  try {
    const savedDetail = await dataService.get('progressDetail', null)
    if (savedDetail && savedDetail.length > 0) {
      console.log('[ProgressManagement] 从服务器恢复完整的进度数据')
      areas.value = savedDetail
      updateAreaProgress()
    } else {
      console.log('[ProgressManagement] 无已保存数据，使用默认模板')
      initializeAreas()
      await syncProgressToDashboard()
    }
  } catch (error) {
    console.error('加载进度数据失败:', error)
    initializeAreas()
  }
})

function initializeAreas() {
  areas.value = AREAS.map(area => ({
    areaId: area.id,
    areaName: area.name,
    stages: JSON.parse(JSON.stringify(TEMPLATE_STAGES)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
  
  updateAreaProgress()
}

function selectArea(areaId) {
  selectedAreaId.value = areaId
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
  let latestEndDate = null

  stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        totalTasks++
        const taskProgress = task.progress || 0
        sumProgress += taskProgress

        if (taskProgress === 100) completedTasks++
        if (task.status === 'delayed') delayedTasks++

        if (task.endDate) {
          if (!latestEndDate || new Date(task.endDate) > new Date(latestEndDate)) {
            latestEndDate = task.endDate
          }
        }
      })
    })
  })

  const progress = totalTasks > 0 ? Math.round(sumProgress / totalTasks) : 0

  return {
    progress,
    completedTasks,
    totalTasks,
    estimatedCompletionDate: latestEndDate,
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
      status: data.status || 'not_started'
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

function showAddNodeDialog(parentNode) {
  if (!isAdmin.value) return
  currentNodeData.value = parentNode
  nodeDialogMode.value = 'add'
  nodeForm.name = ''
  nodeForm.nodeType = 'task'
  nodeDialogVisible.value = true
}

function showEditNodeDialog(node) {
  if (!isAdmin.value) return
  currentNodeData.value = node
  nodeDialogMode.value = 'edit'
  nodeForm.name = node.label || node.name || ''
  nodeDialogVisible.value = true
}

function confirmNodeAction() {
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
  syncProgressToDashboard()
  ElMessage.success(nodeDialogMode.value === 'add' ? '节点添加成功' : '节点修改成功')
}

function addNodeToStages(stages, parentNode) {
  const newNodeId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`

  if (nodeForm.nodeType === 'task') {
    const newTask = {
      id: newNodeId,
      name: nodeForm.name.trim(),
      status: 'not_started',
      startDate: null,
      endDate: null,
      files: [],
      remark: '',
      progress: 0
    }

    for (const stage of stages) {
      for (const subStage of stage.subStages) {
        if (parentNode && parentNode.id === subStage.id) {
          subStage.tasks.push(newTask)
          return
        }
        if (parentNode && parentNode.id === stage.id) {
          const newSubStage = {
            id: `substage-${newNodeId}`,
            name: nodeForm.name.trim(),
            tasks: [newTask]
          }
          stage.subStages.push(newSubStage)
          return
        }
        if (parentNode && parentNode.id) {
          const existingTask = subStage.tasks.find(t => t.id === parentNode.id)
          if (existingTask) {
            subStage.tasks.push(newTask)
            return
          }
        }
      }
    }

    if (stages[0]?.subStages[0]) {
      stages[0].subStages[0].tasks.push(newTask)
    }
  } else {
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
      const parentStage = stages.find(s => s.id === parentNode.id)
      if (parentStage) {
        parentStage.subStages.push(newSubStage)
        return
      }
    }

    if (stages.length > 0) {
      stages[stages.length - 1].subStages.push(newSubStage)
    }
  }
}

function updateNodeInStages(stages, targetNode) {
  const newName = nodeForm.name.trim()

  for (const stage of stages) {
    if (stage.id === targetNode.id) {
      stage.name = newName
      return
    }
    for (const subStage of stage.subStages) {
      if (subStage.id === targetNode.id) {
        subStage.name = newName
        return
      }
      const task = subStage.tasks.find(t => t.id === targetNode.id)
      if (task) {
        task.name = newName
        return
      }
    }
  }
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

    const stageIdx = stages.findIndex(s => s.id === node.id)
    if (stageIdx !== -1) {
      stages.splice(stageIdx, 1)
      deleted = true
    }

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

        if (updatedTask.progress >= 100) {
          updatedTask.status = 'completed'
        } else if (updatedTask.progress > 0) {
          updatedTask.status = 'in_progress'
        } else {
          updatedTask.status = 'not_started'
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

function filterNode(value, data) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

function initGanttChart() {
  if (!ganttChartRef.value || !selectedArea.value) return
  
  const chart = echarts.init(ganttChartRef.value)
  
  const data = []
  const taskNames = []
  let taskIndex = 0
  
  selectedArea.value.stages.forEach(stage => {
    stage.subStages.forEach(subStage => {
      subStage.tasks.forEach(task => {
        if (task.startDate && task.endDate) {
          data.push({
            name: task.name,
            value: [
              taskIndex,
              new Date(task.startDate).getTime(),
              new Date(task.endDate).getTime(),
              task.status
            ],
            itemStyle: {
              color: getStatusColor(task.status)
            }
          })
          taskNames.push(task.name)
          taskIndex++
        }
      })
    })
  })
  
  const option = {
    title: {
      text: '项目甘特图',
      left: 'center'
    },
    tooltip: {
      formatter: function(params) {
        const task = params.data
        const start = new Date(task.value[1]).toLocaleDateString('zh-CN')
        const end = new Date(task.value[2]).toLocaleDateString('zh-CN')
        return `${task.name}<br/>开始: ${start}<br/>结束: ${end}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    series: [
      {
        type: 'custom',
        renderItem: function(params, api) {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6
          
          const rectShape = echarts.graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height
            },
            {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height
            }
          )
          
          return rectShape && {
            type: 'rect',
            shape: rectShape,
            style: api.style({
              fill: api.value(3) === 'completed' ? '#52c41a' : 
                    api.value(3) === 'in_progress' ? '#1890ff' : 
                    api.value(3) === 'delayed' ? '#ff4d4f' : '#d9d9d9'
            })
          }
        },
        data: data,
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
}

.el-container {
  height: 100%;
}

.area-sidebar {
  background: #f5f5f5;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
}

.sidebar-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  color: #1D2129;
}

.sidebar-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 24px;
}

.area-card {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.area-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.area-card.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.area-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.area-progress {
  display: flex;
  align-items: center;
  gap: 16px;
}

.area-info {
  flex: 1;
}

.info-item {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.main-content {
  padding: 24px;
  background: white;
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
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.content-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
  padding: 16px 0;
}

.task-search {
  margin-bottom: 16px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-label {
  flex: 1;
}

.node-manager {
  font-size: 12px;
  color: #86909C;
  margin-right: 8px;
  padding: 2px 8px;
  background: rgba(102, 0, 153, 0.08);
  border-radius: 4px;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.gantt-chart {
  width: 100%;
  height: 500px;
}

.date-picker-group {
  display: flex;
  gap: 8px;
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
  font-size: 14px;
  font-weight: 600;
  color: #660099;
  min-width: 50px;
}

.file-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.file-info {
  flex: 1;
}

.file-document {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .area-sidebar {
    width: 100%;
    max-width: 100%;
  }
  
  .main-content {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>