<template>
  <div class="file-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>文件管理</h2>
        <p class="page-description">管理项目文档、图片和各类文件资源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Plus /></el-icon>
          上传文件
        </el-button>
      </div>
    </div>

    <!-- File Stats -->
    <div class="stats-container">
      <div class="stat-card total-files">
        <div class="stat-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ fileTree.length }}</span>
          <span class="stat-label">总文件数</span>
        </div>
      </div>

      <div class="stat-card total-size">
        <div class="stat-icon">
          <el-icon><FolderOpened /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ formatSize(totalFileSize) }}</span>
          <span class="stat-label">总大小</span>
        </div>
      </div>

      <div class="stat-card image-count">
        <div class="stat-icon">
          <el-icon><Picture /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ imageCount }}</span>
          <span class="stat-label">图片数量</span>
        </div>
      </div>

      <div class="stat-card document-count">
        <div class="stat-icon">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ documentCount }}</span>
          <span class="stat-label">文档数量</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="search-filter-container">
      <el-input
        v-model="searchText"
        placeholder="搜索文件名..."
        :prefix-icon="Search"
        clearable
        class="search-input"
      />
      <el-select v-model="filterType" placeholder="文件类型" clearable class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="图片" value="image" />
        <el-option label="文档" value="document" />
        <el-option label="视频" value="video" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <!-- File Tree -->
    <div class="file-tree-container">
      <el-card class="tree-card">
        <template #header>
          <div class="card-header">
            <span>文件目录</span>
            <div class="view-toggle">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button value="tree">
                  <el-icon><List /></el-icon>
                </el-radio-button>
                <el-radio-button value="grid">
                  <el-icon><Grid /></el-icon>
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>

        <!-- Tree View -->
        <div v-if="viewMode === 'tree'" class="tree-view">
          <el-tree
            :data="filteredFileTree"
            :props="treeProps"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            highlight-current
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node" :class="{ 'is-file': !data.children }">
                <span class="node-content">
                  <el-icon v-if="data.children" class="node-icon folder"><Folder /></el-icon>
                  <el-icon v-else-if="data.type === 'image'" class="node-icon image"><Picture /></el-icon>
                  <el-icon v-else-if="data.type === 'document'" class="node-icon document"><Document /></el-icon>
                  <el-icon v-else class="node-icon other"><Files /></el-icon>
                  <span class="node-name">{{ data.name }}</span>
                </span>
                <span v-if="!data.children" class="node-meta">
                  <span class="file-size">{{ formatSize(data.size || 0) }}</span>
                  <span class="file-date">{{ data.uploadTime ? new Date(data.uploadTime).toLocaleDateString() : '' }}</span>
                </span>
              </div>
            </template>
          </el-tree>
        </div>

        <!-- Grid View -->
        <div v-else class="grid-view">
          <div class="grid-list">
            <div 
              v-for="item in flatFilteredFiles" 
              :key="item.id" 
              class="grid-item"
              @click="previewFile(item)"
            >
              <div class="grid-thumbnail">
                <el-image
                  v-if="item.type === 'image' && item.url"
                  :src="item.url"
                  fit="cover"
                  class="thumbnail-image"
                  :preview-src-list="[item.url]"
                  :initial-index="0"
                />
                <div v-else class="thumbnail-placeholder">
                  <el-icon v-if="item.type === 'document'"><Document /></el-icon>
                  <el-icon v-else><Files /></el-icon>
                </div>
                <div class="thumbnail-actions">
                  <el-button 
                    v-if="isAdmin"
                    type="danger" 
                    size="small" 
                    circle
                    @click.stop="deleteFile(item)"
                    class="delete-btn"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="grid-info">
                <span class="grid-name" :title="item.name">{{ item.name }}</span>
                <span class="grid-meta">{{ formatSize(item.size || 0) }} · {{ item.uploadTime ? new Date(item.uploadTime).toLocaleDateString() : '' }}</span>
              </div>
            </div>
          </div>
          <el-empty v-if="flatFilteredFiles.length === 0" description="暂无文件" />
        </div>
      </el-card>
    </div>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文件"
      width="600px"
      class="upload-dialog"
    >
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :on-change="handleFileSelect"
          :on-remove="handleFileRemove"
          multiple
          drag
          accept="*/*"
          class="upload-component"
        >
          <div class="upload-placeholder">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <p class="upload-text">将文件拖到此处，或<em>点击上传</em></p>
            <p class="upload-hint">支持所有格式，单文件最大50MB</p>
          </div>
        </el-upload>
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="selectedFile?.name"
      width="800px"
      class="preview-dialog"
    >
      <div class="preview-content">
        <el-image
          v-if="selectedFile && selectedFile.type === 'image' && selectedFile.url"
          :src="selectedFile.url"
          fit="contain"
          class="preview-image"
          :preview-src-list="[selectedFile.url]"
        />
        <div v-else class="preview-file-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="文件名">{{ selectedFile?.name }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ selectedFile?.type }}</el-descriptions-item>
            <el-descriptions-item label="大小">{{ formatSize(selectedFile?.size || 0) }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ selectedFile?.uploadTime ? new Date(selectedFile.uploadTime).toLocaleString() : '' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Document,
  FolderOpened,
  Picture,
  Files,
  Folder,
  List,
  Grid,
  Delete,
  UploadFilled
} from '@element-plus/icons-vue'
import dataService from '../services/dataService'
import { uploadApi } from '../api/api'

const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})

const fileTree = ref([])
const searchText = ref('')
const filterType = ref('')
const viewMode = ref('tree')
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)
const pendingFiles = ref([])
const uploadRef = ref(null)

const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data) => !data.children
}

const totalFileSize = computed(() => {
  let total = 0
  function calculateSize(items) {
    items.forEach(item => {
      if (item.children) {
        calculateSize(item.children)
      } else {
        total += item.size || 0
      }
    })
  }
  calculateSize(fileTree.value)
  return total
})

const imageCount = computed(() => {
  let count = 0
  function countImages(items) {
    items.forEach(item => {
      if (item.children) {
        countImages(item.children)
      } else if (item.type === 'image') {
        count++
      }
    })
  }
  countImages(fileTree.value)
  return count
})

const documentCount = computed(() => {
  let count = 0
  function countDocuments(items) {
    items.forEach(item => {
      if (item.children) {
        countDocuments(item.children)
      } else if (item.type === 'document' || item.type === 'other') {
        count++
      }
    })
  }
  countDocuments(fileTree.value)
  return count
})

const filteredFileTree = computed(() => {
  if (!searchText.value && !filterType.value) {
    return fileTree.value
  }
  
  function filterItems(items) {
    return items.filter(item => {
      if (item.children) {
        const filteredChildren = filterItems(item.children)
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren }
        }
        return false
      }
      
      const nameMatch = !searchText.value || item.name.toLowerCase().includes(searchText.value.toLowerCase())
      const typeMatch = !filterType.value || item.type === filterType.value
      return nameMatch && typeMatch
    }).map(item => {
      if (item.children) {
        return filterItems([item])[0]
      }
      return item
    })
  }
  
  return filterItems(fileTree.value)
})

const flatFilteredFiles = computed(() => {
  let files = []
  function flatten(items) {
    items.forEach(item => {
      if (item.children) {
        flatten(item.children)
      } else {
        files.push(item)
      }
    })
  }
  flatten(filteredFileTree.value)
  return files
})

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function handleNodeClick(data) {
  if (!data.children) {
    previewFile(data)
  }
}

async function previewFile(file) {
  selectedFile.value = file
  showPreviewDialog.value = true
}

function handleFileSelect(uploadFile) {
  pendingFiles.value.push(uploadFile.raw)
}

function handleFileRemove(uploadFile) {
  const index = pendingFiles.value.findIndex(f => f.uid === uploadFile.raw.uid)
  if (index !== -1) {
    pendingFiles.value.splice(index, 1)
  }
}

async function handleUpload() {
  if (pendingFiles.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  uploading.value = true
  
  try {
    for (const file of pendingFiles.value) {
      const reader = new FileReader()
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      const result = await uploadApi.uploadImage(base64Data, file.name)
      
      const fileType = file.type.startsWith('image/') ? 'image' :
                       file.type.includes('pdf') || file.type.includes('word') || file.type.includes('excel') ? 'document' :
                       file.type.startsWith('video/') ? 'video' : 'other'
      
      const newFile = {
        id: `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
        name: file.name,
        url: result.url,
        type: fileType,
        size: file.size,
        uploadTime: new Date().toISOString(),
        uploader: localStorage.getItem('zhihui_site_username') || 'unknown'
      }
      
      fileTree.value.push(newFile)
    }
    
    await dataService.set('fileManagement', fileTree.value)
    
    pendingFiles.value = []
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    showUploadDialog.value = false
    
    ElMessage.success(`成功上传 ${pendingFiles.value.length} 个文件`)
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

async function deleteFile(file) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.name}" 吗？`,
      '确认删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    
    if (file.url) {
      try {
        const urlParts = file.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        await uploadApi.deleteImage(filename)
        console.log(`[FileManagement] Server file deleted: ${filename}`)
      } catch (deleteError) {
        console.warn('[FileManagement] Server file deletion failed:', deleteError)
      }
    }
    
    const index = fileTree.value.findIndex(f => f.id === file.id)
    if (index !== -1) {
      fileTree.value.splice(index, 1)
    }
    
    await dataService.set('fileManagement', fileTree.value)
    
    ElMessage.success('文件已删除')
    console.log(`[FileManagement] File deleted: ${file.id} - ${file.name}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[FileManagement] Delete error:', error)
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

onMounted(async () => {
  try {
    const savedFiles = await dataService.get('fileManagement', [])
    if (savedFiles && Array.isArray(savedFiles)) {
      fileTree.value = savedFiles
    } else {
      fileTree.value = []
    }
  } catch (error) {
    console.error('[FileManagement] Load error:', error)
    fileTree.value = []
  }
})
</script>

<style scoped>
.file-management {
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  min-height: calc(100vh - 200px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.05), rgba(102, 0, 153, 0.02));
  border-radius: 16px;
  border: 1px solid rgba(102, 0, 153, 0.08);
}

.header-left h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1D2129;
  margin: 0 0 8px 0;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.page-description {
  font-size: 14px;
  color: #86909C;
  margin: 0;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 247, 250, 0.9));
  border-radius: 16px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 0, 153, 0.15);
  border-color: rgba(102, 0, 153, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
  background: var(--future-primary);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.25);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.stat-label {
  font-size: 13px;
  color: #86909C;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.search-filter-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
}

.filter-select {
  width: 160px;
}

.file-tree-container {
  margin-bottom: 24px;
}

.tree-card {
  min-height: 400px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 251, 252, 0.95));
  border-radius: 16px;
  border: 1px solid rgba(77, 20, 140, 0.1);
  box-shadow: 0 8px 32px rgba(102, 0, 153, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.tree-view {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.grid-view {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 6px 0;
}

.tree-node.is-file:hover .delete-btn {
  opacity: 1;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.node-icon {
  font-size: 18px;
  transition: all 0.2s ease;
}

.node-icon.folder {
  color: #FFA940;
}

.node-icon.image {
  color: #165DFF;
}

.node-icon.document {
  color: #660099;
}

.node-icon.other {
  color: #86909C;
}

.node-name {
  font-size: 14px;
  color: #1D2129;
  font-weight: 500;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.node-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #86909C;
  flex-shrink: 0;
}

.file-size {
  font-weight: 500;
}

.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.grid-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.grid-item:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: var(--future-primary);
  box-shadow: 0 12px 28px rgba(102, 0, 153, 0.18);
}

.grid-thumbnail {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #ccc;
}

.thumbnail-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.grid-item:hover .thumbnail-actions {
  opacity: 1;
}

.delete-btn {
  transform: scale(0.85);
}

.grid-info {
  padding: 12px;
  text-align: center;
}

.grid-name {
  display: block;
  font-size: 13px;
  color: #1D2129;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.grid-meta {
  font-size: 11px;
  color: #86909C;
}

.upload-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.98);
  --el-dialog-border-color: rgba(77, 20, 140, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(30px);
  box-shadow: 0 20px 60px rgba(102, 0, 153, 0.3);
}

.upload-area {
  padding: 20px 0;
}

.upload-component {
  width: 100%;
}

.upload-component :deep(.el-upload-dragger) {
  border: 2px dashed rgba(102, 0, 153, 0.3);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.03), rgba(102, 0, 153, 0.01));
  transition: all 0.3s ease;
}

.upload-component :deep(.el-upload-dragger:hover) {
  border-color: var(--future-primary);
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.06), rgba(102, 0, 153, 0.03));
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 56px;
  color: rgba(102, 0, 153, 0.35);
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #4E5969;
  margin: 0 0 8px 0;
}

.upload-text em {
  color: var(--future-primary);
  font-style: normal;
  font-weight: 600;
}

.upload-hint {
  font-size: 13px;
  color: #86909C;
  margin: 0;
}

.preview-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.98);
  --el-dialog-border-color: rgba(77, 20, 140, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(30px);
  box-shadow: 0 20px 60px rgba(102, 0, 153, 0.3);
}

.preview-content {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 12px;
}

.preview-file-info {
  padding: 20px;
}

@media (max-width: 1200px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 14px;
    gap: 12px;
  }

  .stat-icon {
    width: 40px;
  height: 40px;
    font-size: 18px;
  }

  .stat-value {
    font-size: 20px;
  }

  .search-filter-container {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .grid-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .grid-list {
    grid-template-columns: 1fr;
  }
}
</style>