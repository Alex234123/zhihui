<!-- Dashboard.vue - 完整数据看板组件 v2.1 -->
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
    <div class="stat-cards-wrapper">
      <el-row :gutter="12">
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" @click="navigateTo('personnel')">
            <div class="stat-content">
              <div class="stat-icon personnel">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ personnelCount }}</div>
                <div class="stat-label">在场人员</div>
                <div class="stat-trend" :class="personnelTrend >= 0 ? 'positive' : 'negative'">{{ personnelTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(personnelTrend) }} 今日</div>
              </div>
              <div class="stat-actions">
                <el-button size="small" type="primary" plain @click.stop="quickAdd('personnel')">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" @click="navigateTo('equipment')">
            <div class="stat-content">
              <div class="stat-icon equipment">
                <el-icon><Tools /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ equipmentCount }}</div>
                <div class="stat-label">设备数量</div>
                <div class="stat-trend" :class="equipmentTrend >= 0 ? 'positive' : 'negative'">{{ equipmentTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(equipmentTrend) }} 今日</div>
              </div>
              <div class="stat-actions">
                <el-button size="small" type="primary" plain @click.stop="quickAdd('equipment')">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" @click="navigateTo('safety')">
            <div class="stat-content">
              <div class="stat-icon safety">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ safetyCount }}</div>
                <div class="stat-label">安全巡检</div>
                <div class="stat-trend" :class="safetyTrend >= 0 ? 'positive' : 'negative'">{{ safetyTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(safetyTrend) }} 今日</div>
              </div>
              <div class="stat-actions">
                <el-button size="small" type="primary" plain @click.stop="quickAdd('safety')">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <el-card class="stat-card" @click="navigateTo('materials')">
            <div class="stat-content">
              <div class="stat-icon materials">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ materialCount }}</div>
                <div class="stat-label">材料种类</div>
                <div class="stat-trend" :class="materialTrend >= 0 ? 'positive' : 'negative'">{{ materialTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(materialTrend) }} 今日</div>
              </div>
              <div class="stat-actions">
                <el-button size="small" type="primary" plain @click.stop="quickAdd('materials')">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

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
                <div v-if="getBlockPhotos(item.block).length > 0" class="block-photos-carousel"
                  @mouseenter="carouselHover[item.block] = true"
                  @mouseleave="carouselHover[item.block] = false; resumeCarousel(item.block)"
                >
                  <div class="carousel-track" :style="{ transform: `translateX(-${blockCarouselIndex[item.block] || 0}00%)` }">
                    <div v-for="(photo, idx) in getBlockPhotos(item.block)" :key="idx" class="carousel-slide">
                      <el-image
                        :src="photo.url"
                        :preview-src-list="getBlockPhotos(item.block).map(p => p.url)"
                        :initial-index="idx"
                        fit="cover"
                        class="block-photo"
                      />
                      <div class="carousel-photo-info">
                        <span class="carousel-counter">{{ idx + 1 }}/{{ getBlockPhotos(item.block).length }}</span>
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
                  <button
                    v-if="(getBlockPhotos(item.block).length > 1) && carouselHover[item.block]"
                    class="carousel-btn carousel-prev"
                    @click.stop="slideCarousel(item.block, -1)"
                  >
                    ‹
                  </button>
                  <button
                    v-if="(getBlockPhotos(item.block).length > 1) && carouselHover[item.block]"
                    class="carousel-btn carousel-next"
                    @click.stop="slideCarousel(item.block, 1)"
                  >
                    ›
                  </button>
                  <div v-if="getBlockPhotos(item.block).length > 1" class="carousel-dots">
                    <span
                      v-for="(_, idx) in getBlockPhotos(item.block)"
                      :key="idx"
                      class="carousel-dot"
                      :class="{ active: (blockCarouselIndex[item.block] || 0) === idx }"
                      @click="goToSlide(item.block, idx)"
                    ></span>
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