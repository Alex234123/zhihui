<template>
  <div class="file-management" :class="{ 'fade-in': isMounted }">
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane label="工程设计全流程核心管控文件" name="design">
        <div class="page-header">
          <h2>工程设计全流程核心管控文件</h2>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="file-tree-container">
              <div v-for="(category, index) in designCategories" :key="index" class="category-card">
                <div class="category-header" @click="toggleCategory('design', index)">
                  <el-icon class="category-icon"><component :is="category.icon" /></el-icon>
                  <span class="category-title">{{ category.title }}</span>
                  <el-icon class="expand-icon" :class="{ 'rotated': expandedDesignCategories[index] }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div v-show="expandedDesignCategories[index]" class="category-content">
                    <div v-for="(subCat, subIndex) in category.children" :key="subIndex" class="subcategory">
                      <div class="subcategory-header" @click="toggleSubcategory('design', index, subIndex)">
                        <el-icon class="subcategory-icon"><Folder /></el-icon>
                        <span class="subcategory-title">{{ subCat.title }}</span>
                        <el-icon class="expand-icon" :class="{ 'rotated': expandedDesignSubcategories[`${index}-${subIndex}`] }">
                          <ArrowRight />
                        </el-icon>
                      </div>
                      <el-collapse-transition>
                        <div v-show="expandedDesignSubcategories[`${index}-${subIndex}`]" class="subcategory-content">
                          <div v-if="subCat.children && subCat.children.length > 0">
                            <div v-for="(item, itemIndex) in subCat.children" :key="itemIndex" class="folder-item">
                              <div class="folder-item-header" @click="toggleFolder('design', index, subIndex, itemIndex)">
                                <el-icon class="folder-icon"><FolderOpened /></el-icon>
                                <span class="folder-name">{{ item.title }}</span>
                                <el-icon class="expand-icon" :class="{ 'rotated': expandedDesignFolders[`${index}-${subIndex}-${itemIndex}`] }">
                                  <ArrowRight />
                                </el-icon>
                              </div>
                              <el-collapse-transition>
                                <div v-show="expandedDesignFolders[`${index}-${subIndex}-${itemIndex}`]" class="folder-content">
                                  <div v-if="item.children && item.children.length > 0">
                                    <div v-for="(subItem, subItemIndex) in item.children" :key="subItemIndex" class="subfolder-item">
                                      <div class="subfolder-item-header" @click="toggleSubFolder('design', index, subIndex, itemIndex, subItemIndex)">
                                        <el-icon class="subfolder-icon"><Folder /></el-icon>
                                        <span class="subfolder-name">{{ subItem.title }}</span>
                                        <el-icon class="expand-icon" :class="{ 'rotated': expandedDesignSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`] }">
                                          <ArrowRight />
                                        </el-icon>
                                      </div>
                                      <el-collapse-transition>
                                        <div v-show="expandedDesignSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`]" class="file-list">
                                          <div v-if="subItem.files && subItem.files.length > 0">
                                            <div v-for="(file, fileIndex) in subItem.files" :key="fileIndex" class="file-item">
                                              <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                                <component :is="getFileIcon(file.type)" />
                                              </el-icon>
                                              <span class="file-name">{{ file.name }}</span>
                                              <span class="file-date">{{ file.date }}</span>
                                              <div class="file-actions">
                                                <el-button size="small" type="primary" link @click="previewFile(file)">
                                                  <el-icon><View /></el-icon>
                                                  预览
                                                </el-button>
                                                <el-button size="small" type="success" link @click="downloadFile(file)">
                                                  <el-icon><Download /></el-icon>
                                                  下载
                                                </el-button>
                                                <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'design', index, subIndex, itemIndex, subItemIndex)">
                                                  <el-icon><Delete /></el-icon>
                                                  删除
                                                </el-button>
                                              </div>
                                            </div>
                                            <div class="upload-file-btn">
                                              <el-button size="small" type="primary" @click="showUploadDialog('design', index, subIndex, itemIndex, subItemIndex)">
                                                <el-icon><Plus /></el-icon>
                                                上传文件
                                              </el-button>
                                            </div>
                                          </div>
                                          <div v-else class="file-list">
                                            <div class="upload-file-btn">
                                              <el-button size="small" type="primary" @click="showUploadDialog('design', index, subIndex, itemIndex, subItemIndex)">
                                                <el-icon><Plus /></el-icon>
                                                上传文件
                                              </el-button>
                                            </div>
                                          </div>
                                        </div>
                                      </el-collapse-transition>
                                    </div>
                                  </div>
                                  <div v-else class="file-list">
                                    <div v-if="item.files && item.files.length > 0">
                                      <div v-for="(file, fileIndex) in item.files" :key="fileIndex" class="file-item">
                                        <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                          <component :is="getFileIcon(file.type)" />
                                        </el-icon>
                                        <span class="file-name">{{ file.name }}</span>
                                        <span class="file-date">{{ file.date }}</span>
                                        <div class="file-actions">
                                          <el-button size="small" type="primary" link @click="previewFile(file)">
                                            <el-icon><View /></el-icon>
                                            预览
                                          </el-button>
                                          <el-button size="small" type="success" link @click="downloadFile(file)">
                                            <el-icon><Download /></el-icon>
                                            下载
                                          </el-button>
                                          <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'design', index, subIndex, itemIndex)">
                                            <el-icon><Delete /></el-icon>
                                            删除
                                          </el-button>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="upload-file-btn">
                                      <el-button size="small" type="primary" @click="showUploadDialog('design', index, subIndex, itemIndex)">
                                        <el-icon><Plus /></el-icon>
                                        上传文件
                                      </el-button>
                                    </div>
                                  </div>
                                </div>
                              </el-collapse-transition>
                            </div>
                          </div>
                          <div v-else class="file-list">
                            <div v-if="subCat.files && subCat.files.length > 0">
                              <div v-for="(file, fileIndex) in subCat.files" :key="fileIndex" class="file-item">
                                <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                  <component :is="getFileIcon(file.type)" />
                                </el-icon>
                                <span class="file-name">{{ file.name }}</span>
                                <span class="file-date">{{ file.date }}</span>
                                <div class="file-actions">
                                  <el-button size="small" type="primary" link @click="previewFile(file)">
                                    <el-icon><View /></el-icon>
                                    预览
                                  </el-button>
                                  <el-button size="small" type="success" link @click="downloadFile(file)">
                                    <el-icon><Download /></el-icon>
                                    下载
                                  </el-button>
                                  <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'design', index, subIndex)">
                                    <el-icon><Delete /></el-icon>
                                    删除
                                  </el-button>
                                </div>
                              </div>
                            </div>
                            <div class="upload-file-btn">
                              <el-button size="small" type="primary" @click="showUploadDialog('design', index, subIndex)">
                                <el-icon><Plus /></el-icon>
                                上传文件
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </el-collapse-transition>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <el-tab-pane label="建设单位现场成本" name="cost">
        <div class="page-header">
          <h2>建设单位现场成本</h2>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="file-tree-container">
              <div v-for="(category, index) in costCategories" :key="index" class="category-card">
                <div class="category-header" @click="toggleCategory('cost', index)">
                  <el-icon class="category-icon"><component :is="category.icon" /></el-icon>
                  <span class="category-title">{{ category.title }}</span>
                  <el-icon class="expand-icon" :class="{ 'rotated': expandedCostCategories[index] }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div v-show="expandedCostCategories[index]" class="category-content">
                    <div v-for="(subCat, subIndex) in category.children" :key="subIndex" class="subcategory">
                      <div class="subcategory-header" @click="toggleSubcategory('cost', index, subIndex)">
                        <el-icon class="subcategory-icon"><Folder /></el-icon>
                        <span class="subcategory-title">{{ subCat.title }}</span>
                        <el-icon class="expand-icon" :class="{ 'rotated': expandedCostSubcategories[`${index}-${subIndex}`] }">
                          <ArrowRight />
                        </el-icon>
                      </div>
                      <el-collapse-transition>
                        <div v-show="expandedCostSubcategories[`${index}-${subIndex}`]" class="subcategory-content">
                          <div v-if="subCat.children && subCat.children.length > 0">
                            <div v-for="(item, itemIndex) in subCat.children" :key="itemIndex" class="folder-item">
                              <div class="folder-item-header" @click="toggleFolder('cost', index, subIndex, itemIndex)">
                                <el-icon class="folder-icon"><FolderOpened /></el-icon>
                                <span class="folder-name">{{ item.title }}</span>
                                <el-icon class="expand-icon" :class="{ 'rotated': expandedCostFolders[`${index}-${subIndex}-${itemIndex}`] }">
                                  <ArrowRight />
                                </el-icon>
                              </div>
                              <el-collapse-transition>
                                <div v-show="expandedCostFolders[`${index}-${subIndex}-${itemIndex}`]" class="folder-content">
                                  <div v-if="item.children && item.children.length > 0">
                                    <div v-for="(subItem, subItemIndex) in item.children" :key="subItemIndex" class="subfolder-item">
                                      <div class="subfolder-item-header" @click="toggleSubFolder('cost', index, subIndex, itemIndex, subItemIndex)">
                                        <el-icon class="subfolder-icon"><Folder /></el-icon>
                                        <span class="subfolder-name">{{ subItem.title }}</span>
                                        <el-icon class="expand-icon" :class="{ 'rotated': expandedCostSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`] }">
                                          <ArrowRight />
                                        </el-icon>
                                      </div>
                                      <el-collapse-transition>
                                        <div v-show="expandedCostSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`]" class="file-list">
                                          <div v-if="subItem.files && subItem.files.length > 0">
                                            <div v-for="(file, fileIndex) in subItem.files" :key="fileIndex" class="file-item">
                                              <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                                <component :is="getFileIcon(file.type)" />
                                              </el-icon>
                                              <span class="file-name">{{ file.name }}</span>
                                              <span class="file-date">{{ file.date }}</span>
                                              <div class="file-actions">
                                                <el-button size="small" type="primary" link @click="previewFile(file)">
                                                  <el-icon><View /></el-icon>
                                                  预览
                                                </el-button>
                                                <el-button size="small" type="success" link @click="downloadFile(file)">
                                                  <el-icon><Download /></el-icon>
                                                  下载
                                                </el-button>
                                                <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'cost', index, subIndex, itemIndex, subItemIndex)">
                                                  <el-icon><Delete /></el-icon>
                                                  删除
                                                </el-button>
                                              </div>
                                            </div>
                                            <div class="upload-file-btn">
                                              <el-button size="small" type="primary" @click="showUploadDialog('cost', index, subIndex, itemIndex, subItemIndex)">
                                                <el-icon><Plus /></el-icon>
                                                上传文件
                                              </el-button>
                                            </div>
                                          </div>
                                          <div v-else class="upload-file-btn">
                                            <el-button size="small" type="primary" @click="showUploadDialog('cost', index, subIndex, itemIndex, subItemIndex)">
                                              <el-icon><Plus /></el-icon>
                                              上传文件
                                            </el-button>
                                          </div>
                                        </div>
                                      </el-collapse-transition>
                                    </div>
                                  </div>
                                  <div v-else class="file-list">
                                    <div v-if="item.files && item.files.length > 0">
                                      <div v-for="(file, fileIndex) in item.files" :key="fileIndex" class="file-item">
                                        <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                          <component :is="getFileIcon(file.type)" />
                                        </el-icon>
                                        <span class="file-name">{{ file.name }}</span>
                                        <span class="file-date">{{ file.date }}</span>
                                        <div class="file-actions">
                                          <el-button size="small" type="primary" link @click="previewFile(file)">
                                            <el-icon><View /></el-icon>
                                            预览
                                          </el-button>
                                          <el-button size="small" type="success" link @click="downloadFile(file)">
                                            <el-icon><Download /></el-icon>
                                            下载
                                          </el-button>
                                          <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'cost', index, subIndex, itemIndex)">
                                            <el-icon><Delete /></el-icon>
                                            删除
                                          </el-button>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="upload-file-btn">
                                      <el-button size="small" type="primary" @click="showUploadDialog('cost', index, subIndex, itemIndex)">
                                        <el-icon><Plus /></el-icon>
                                        上传文件
                                      </el-button>
                                    </div>
                                  </div>
                                </div>
                              </el-collapse-transition>
                            </div>
                          </div>
                          <div v-else class="file-list">
                            <div v-if="subCat.files && subCat.files.length > 0">
                              <div v-for="(file, fileIndex) in subCat.files" :key="fileIndex" class="file-item">
                                <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                  <component :is="getFileIcon(file.type)" />
                                </el-icon>
                                <span class="file-name">{{ file.name }}</span>
                                <span class="file-date">{{ file.date }}</span>
                                <div class="file-actions">
                                  <el-button size="small" type="primary" link @click="previewFile(file)">
                                    <el-icon><View /></el-icon>
                                    预览
                                  </el-button>
                                  <el-button size="small" type="success" link @click="downloadFile(file)">
                                    <el-icon><Download /></el-icon>
                                    下载
                                  </el-button>
                                  <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'cost', index, subIndex)">
                                    <el-icon><Delete /></el-icon>
                                    删除
                                  </el-button>
                                </div>
                              </div>
                            </div>
                            <div class="upload-file-btn">
                              <el-button size="small" type="primary" @click="showUploadDialog('cost', index, subIndex)">
                                <el-icon><Plus /></el-icon>
                                上传文件
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </el-collapse-transition>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="监理单位文件" name="supervisor">
        <div class="page-header">
          <h2>监理单位文件</h2>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="file-tree-container">
              <div v-for="(category, index) in supervisorCategories" :key="index" class="category-card">
                <div class="category-header" @click="toggleCategory('supervisor', index)">
                  <el-icon class="category-icon"><component :is="category.icon" /></el-icon>
                  <span class="category-title">{{ category.title }}</span>
                  <el-icon class="expand-icon" :class="{ 'rotated': expandedSupervisorCategories[index] }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div v-show="expandedSupervisorCategories[index]" class="category-content">
                    <div v-for="(subCat, subIndex) in category.children" :key="subIndex" class="subcategory">
                      <div class="subcategory-header" @click="toggleSubcategory('supervisor', index, subIndex)">
                        <el-icon class="subcategory-icon"><Folder /></el-icon>
                        <span class="subcategory-title">{{ subCat.title }}</span>
                        <el-icon class="expand-icon" :class="{ 'rotated': expandedSupervisorSubcategories[`${index}-${subIndex}`] }">
                          <ArrowRight />
                        </el-icon>
                      </div>
                      <el-collapse-transition>
                        <div v-show="expandedSupervisorSubcategories[`${index}-${subIndex}`]" class="subcategory-content">
                          <div class="file-list">
                            <div v-if="subCat.files && subCat.files.length > 0">
                              <div v-for="(file, fileIndex) in subCat.files" :key="fileIndex" class="file-item">
                                <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                  <component :is="getFileIcon(file.type)" />
                                </el-icon>
                                <span class="file-name">{{ file.name }}</span>
                                <span class="file-date">{{ file.date }}</span>
                                <div class="file-actions">
                                  <el-button size="small" type="primary" link @click="previewFile(file)">
                                    <el-icon><View /></el-icon>
                                    预览
                                  </el-button>
                                  <el-button size="small" type="success" link @click="downloadFile(file)">
                                    <el-icon><Download /></el-icon>
                                    下载
                                  </el-button>
                                  <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'supervisor', index, subIndex)">
                                    <el-icon><Delete /></el-icon>
                                    删除
                                  </el-button>
                                </div>
                              </div>
                            </div>
                            <div class="upload-file-btn">
                              <el-button size="small" type="primary" @click="showUploadDialog('supervisor', index, subIndex)">
                                <el-icon><Plus /></el-icon>
                                上传文件
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </el-collapse-transition>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="工程亮点板块" name="highlight">
        <div class="page-header">
          <h2>工程亮点板块</h2>
        </div>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="file-tree-container">
              <div v-for="(category, index) in highlightCategories" :key="index" class="category-card">
                <div class="category-header" @click="toggleCategory('highlight', index)">
                  <el-icon class="category-icon"><component :is="category.icon" /></el-icon>
                  <span class="category-title">{{ category.title }}</span>
                  <el-icon class="expand-icon" :class="{ 'rotated': expandedHighlightCategories[index] }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div v-show="expandedHighlightCategories[index]" class="category-content">
                    <div v-for="(subCat, subIndex) in category.children" :key="subIndex" class="subcategory">
                      <div class="subcategory-header" @click="toggleSubcategory('highlight', index, subIndex)">
                        <el-icon class="subcategory-icon"><Folder /></el-icon>
                        <span class="subcategory-title">{{ subCat.title }}</span>
                        <el-icon class="expand-icon" :class="{ 'rotated': expandedHighlightSubcategories[`${index}-${subIndex}`] }">
                          <ArrowRight />
                        </el-icon>
                      </div>
                      <el-collapse-transition>
                        <div v-show="expandedHighlightSubcategories[`${index}-${subIndex}`]" class="subcategory-content">
                          <div v-if="subCat.children && subCat.children.length > 0">
                            <div v-for="(item, itemIndex) in subCat.children" :key="itemIndex" class="folder-item">
                              <div class="folder-item-header" @click="toggleFolder('highlight', index, subIndex, itemIndex)">
                                <el-icon class="folder-icon"><FolderOpened /></el-icon>
                                <span class="folder-name">{{ item.title }}</span>
                                <el-icon class="expand-icon" :class="{ 'rotated': expandedHighlightFolders[`${index}-${subIndex}-${itemIndex}`] }">
                                  <ArrowRight />
                                </el-icon>
                              </div>
                              <el-collapse-transition>
                                <div v-show="expandedHighlightFolders[`${index}-${subIndex}-${itemIndex}`]" class="folder-content">
                                  <div v-if="item.children && item.children.length > 0">
                                    <div v-for="(subItem, subItemIndex) in item.children" :key="subItemIndex" class="subfolder-item">
                                      <div class="subfolder-item-header" @click="toggleSubFolder('highlight', index, subIndex, itemIndex, subItemIndex)">
                                        <el-icon class="subfolder-icon"><Folder /></el-icon>
                                        <span class="subfolder-name">{{ subItem.title }}</span>
                                        <el-icon class="expand-icon" :class="{ 'rotated': expandedHighlightSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`] }">
                                          <ArrowRight />
                                        </el-icon>
                                      </div>
                                      <el-collapse-transition>
                                        <div v-show="expandedHighlightSubFolders[`${index}-${subIndex}-${itemIndex}-${subItemIndex}`]" class="file-list">
                                          <div v-if="subItem.files && subItem.files.length > 0">
                                            <div v-for="(file, fileIndex) in subItem.files" :key="fileIndex" class="file-item">
                                              <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                                <component :is="getFileIcon(file.type)" />
                                              </el-icon>
                                              <span class="file-name">{{ file.name }}</span>
                                              <span class="file-date">{{ file.date }}</span>
                                              <div class="file-actions">
                                                <el-button size="small" type="primary" link @click="previewFile(file)">
                                                  <el-icon><View /></el-icon>
                                                  预览
                                                </el-button>
                                                <el-button size="small" type="success" link @click="downloadFile(file)">
                                                  <el-icon><Download /></el-icon>
                                                  下载
                                                </el-button>
                                                <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'highlight', index, subIndex, itemIndex, subItemIndex)">
                                                  <el-icon><Delete /></el-icon>
                                                  删除
                                                </el-button>
                                              </div>
                                            </div>
                                            <div class="upload-file-btn">
                                              <el-button size="small" type="primary" @click="showUploadDialog('highlight', index, subIndex, itemIndex, subItemIndex)">
                                                <el-icon><Plus /></el-icon>
                                                上传文件
                                              </el-button>
                                            </div>
                                          </div>
                                          <div v-else class="upload-file-btn">
                                            <el-button size="small" type="primary" @click="showUploadDialog('highlight', index, subIndex, itemIndex, subItemIndex)">
                                              <el-icon><Plus /></el-icon>
                                              上传文件
                                            </el-button>
                                          </div>
                                        </div>
                                      </el-collapse-transition>
                                    </div>
                                  </div>
                                  <div v-else class="file-list">
                                    <div v-if="item.files && item.files.length > 0">
                                      <div v-for="(file, fileIndex) in item.files" :key="fileIndex" class="file-item">
                                        <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                          <component :is="getFileIcon(file.type)" />
                                        </el-icon>
                                        <span class="file-name">{{ file.name }}</span>
                                        <span class="file-date">{{ file.date }}</span>
                                        <div class="file-actions">
                                          <el-button size="small" type="primary" link @click="previewFile(file)">
                                            <el-icon><View /></el-icon>
                                            预览
                                          </el-button>
                                          <el-button size="small" type="success" link @click="downloadFile(file)">
                                            <el-icon><Download /></el-icon>
                                            下载
                                          </el-button>
                                          <el-button v-if="isAdmin" size="small" type="danger" link @click="deleteFile(file, 'highlight', index, subIndex, itemIndex)">
                                            <el-icon><Delete /></el-icon>
                                            删除
                                          </el-button>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="upload-file-btn">
                                      <el-button size="small" type="primary" @click="showUploadDialog('highlight', index, subIndex, itemIndex)">
                                        <el-icon><Plus /></el-icon>
                                        上传文件
                                      </el-button>
                                    </div>
                                  </div>
                                </div>
                              </el-collapse-transition>
                            </div>
                          </div>
                          <div v-else class="file-list">
                            <div v-if="subCat.files && subCat.files.length > 0">
                              <div v-for="(file, fileIndex) in subCat.files" :key="fileIndex" class="file-item">
                                <el-icon class="file-icon" :class="getFileIconClass(file.type)">
                                  <component :is="getFileIcon(file.type)" />
                                </el-icon>
                                <span class="file-name">{{ file.name }}</span>
                                <span class="file-date">{{ file.date }}</span>
                                <div class="file-actions">
                                  <el-button size="small" type="primary" link @click="previewFile(file)">
                                    <el-icon><View /></el-icon>
                                    预览
                                  </el-button>
                                  <el-button size="small" type="success" link @click="downloadFile(file)">
                                    <el-icon><Download /></el-icon>
                                    下载
                                  </el-button>
                                </div>
                              </div>
                            </div>
                            <div class="upload-file-btn">
                              <el-button size="small" type="primary" @click="showUploadDialog('highlight', index, subIndex)">
                                <el-icon><Plus /></el-icon>
                                上传文件
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </el-collapse-transition>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="previewDialogVisible" :title="previewFileData?.name" width="80%" class="preview-dialog">
      <div class="preview-content" v-if="previewFileData">
        <!-- 文件信息 -->
        <el-descriptions :column="2" border class="preview-info">
          <el-descriptions-item label="文件名称">{{ previewFileData.name }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ previewFileData.type || getFileType(previewFileData.name) }}</el-descriptions-item>
          <el-descriptions-item label="上传日期">{{ previewFileData.date }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ previewFileData.size || '未知' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 图片预览区域 -->
        <div v-if="isImageFile(previewFileData.name)" class="image-preview-container">
          <img 
            :src="getFullUrl(previewFileData.url)" 
            :alt="previewFileData.name"
            class="preview-image"
            @error="handleImageError"
          />
        </div>

        <!-- 非图片文件的预览占位符 -->
        <div v-else class="preview-placeholder">
          <el-icon :size="80" :class="getFileIconClass(previewFileData.name)"><component :is="getFileIcon(previewFileData.name)" /></el-icon>
          <p class="preview-text">该文件类型暂不支持在线预览</p>
          <p class="preview-hint">支持预览：JPG、PNG、GIF、WebP 等图片格式</p>
          <el-button type="primary" size="large" @click="downloadFile(previewFileData)">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="500px" class="upload-dialog">
      <el-upload
        ref="fileInput"
        class="upload-area"
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="currentUploadFiles.map(f => ({ name: f.name, size: f.size }))"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、DWG、Word、Excel、图片等格式文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadFiles" :loading="uploadLoading">
          确定上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Folder,
  FolderOpened,
  ArrowRight,
  View,
  Download,
  Files,
  Picture,
  Notebook,
  Paperclip,
  Calendar,
  Warning,
  CircleCheck,
  Plus,
  Upload,
  Delete
} from '@element-plus/icons-vue'
import dataService from '../services/dataService'
import { uploadApi } from '../api/api'

const isMounted = ref(false)
const activeTab = ref('design')

// 管理员权限检查
const isAdmin = computed(() => {
  const username = localStorage.getItem('zhihui_site_username')
  return username === '管理员' || username === 'admin'
})
const expandedDesignCategories = ref({})
const expandedDesignSubcategories = ref({})
const expandedDesignFolders = ref({})
const expandedDesignSubFolders = ref({})
const expandedCostCategories = ref({})
const expandedCostSubcategories = ref({})
const expandedCostFolders = ref({})
const expandedCostSubFolders = ref({})
const expandedHighlightCategories = ref({})
const expandedHighlightSubcategories = ref({})
const expandedHighlightFolders = ref({})
const expandedHighlightSubFolders = ref({})
const expandedSupervisorCategories = ref({})
const expandedSupervisorSubcategories = ref({})
const previewDialogVisible = ref(false)
const previewFileData = ref(null)
const uploadDialogVisible = ref(false)
const uploadCategoryPath = ref('')
const uploadSubcategoryPath = ref('')
const currentUploadFiles = ref([])
const uploadLoading = ref(false)
const fileInput = ref(null)
const currentUploadTarget = ref({ type: '', categoryIndex: -1, subIndex: -1, itemIndex: -1, subItemIndex: -1 })

const costCategories = shallowRef([
  {
    title: '一、设计变更成本',
    icon: Document,
    children: [
      {
        title: '1.1 设计变更申请发起',
        files: []
      },
      {
        title: '1.2 设计变更图纸出具',
        files: []
      },
      {
        title: '1.3 变更技术可行性审查',
        files: []
      },
      {
        title: '1.4 变更工程量现场核实',
        files: []
      },
      {
        title: '1.5 变更费用申报（施工单位）',
        files: []
      },
      {
        title: '1.6 变更费用监理审核',
        files: []
      },
      {
        title: '1.7 变更费用造价审核',
        files: []
      },
      {
        title: '1.8 变更费用甲方内部审批',
        files: []
      },
      {
        title: '1.9 变更工程实施与验收',
        files: []
      },
      {
        title: '1.10 变更费用进度款支付',
        files: []
      },
      {
        title: '1.11 变更费用竣工结算',
        files: []
      },
      {
        title: '1.12 设计变更台账登记',
        files: []
      }
    ]
  },
  {
    title: '二、工程指令/甲方指令单成本',
    icon: Document,
    children: [
      {
        title: '2.1 甲方指令单签发',
        files: []
      },
      {
        title: '2.2 指令内容现场确认',
        files: []
      },
      {
        title: '2.3 指令工程量核实',
        files: []
      },
      {
        title: '2.4 指令费用申报',
        files: []
      },
      {
        title: '2.5 指令费用监理审核',
        files: []
      },
      {
        title: '2.6 指令费用造价审核',
        files: []
      },
      {
        title: '2.7 指令费用甲方审批',
        files: []
      },
      {
        title: '2.8 指令工程实施验收',
        files: []
      },
      {
        title: '2.9 指令费用进度支付',
        files: []
      },
      {
        title: '2.10 指令费用竣工结算',
        files: []
      },
      {
        title: '2.11 工程指令单台账登记',
        files: []
      }
    ]
  }
])
const supervisorCategories = shallowRef([
  {
    title: '监理规划与细则',
    icon: Document,
    children: [
      {
        title: '监理规划文件',
        files: []
      },
      {
        title: '监理细则专项',
        files: []
      }
    ]
  },
  {
    title: '监理例会与纪要',
    icon: Calendar,
    children: [
      {
        title: '监理例会记录',
        files: []
      },
      {
        title: '专题会议纪要',
        files: []
      }
    ]
  },
  {
    title: '监理工程师通知书',
    icon: Warning,
    children: [
      {
        title: '质量类通知书',
        files: []
      },
      {
        title: '安全类通知书',
        files: []
      }
    ]
  },
  {
    title: '监理月报与总结',
    icon: Document,
    children: [
      {
        title: '监理月报',
        files: []
      },
      {
        title: '阶段性总结',
        files: []
      }
    ]
  },
  {
    title: '施工方案审批',
    icon: CircleCheck,
    children: [
      {
        title: '施工组织设计审批',
        files: []
      },
      {
        title: '专项施工方案审批',
        files: []
      }
    ]
  },
  {
    title: '旁站记录与巡视',
    icon: View,
    children: [
      {
        title: '旁站记录',
        files: []
      },
      {
        title: '巡视检查记录',
        files: []
      }
    ]
  }
])
const highlightCategories = shallowRef([
  {
    title: '样板引路全流程闭环体系（样板确认书核心模块）',
    icon: Document,
    children: [
      {
        title: '样板分级策划与全覆盖实施',
        children: [
          {
            title: '工艺/实体工序/交付/精装修/安全防护样板全专业覆盖',
            files: []
          },
          {
            title: '样板专项策划方案、前置技术交底，明确标准与验收节点',
            files: []
          }
        ]
      },
      {
        title: '样板验收与样板确认书闭环管理',
        children: [
          {
            title: '四方联合验收，签署样板确认书，作为大面积施工唯一依据',
            files: []
          },
          {
            title: '材料同步封样留存，与样板确认书一一对应，标准可追溯',
            files: []
          }
        ]
      },
      {
        title: '样板公示与技术交底落实',
        children: [
          {
            title: '样板挂牌公示，明确工艺标准、责任人、确认书编号',
            files: []
          },
          {
            title: '样板基准全员技术交底，签字+影像双留存，未交底不开工',
            files: []
          }
        ]
      },
      {
        title: '样板落地复核与奖罚联动',
        children: [
          {
            title: '大面积施工样板符合性定期复核，偏离标准立即整改',
            files: []
          },
          {
            title: '专项奖罚制度，执行情况与班组结算、评优直接挂钩',
            files: []
          }
        ]
      }
    ]
  },
  {
    title: '全工序分级质量管控体系',
    icon: Document,
    children: [
      {
        title: '三检100%闭环管理',
        children: [
          {
            title: '自检/互检/交接检全流程，签字台账+实测数据+影像全留存',
            files: []
          },
          {
            title: '质量终身责任制，责任到人到岗，未完成三检不进入下道工序',
            files: []
          }
        ]
      },
      {
        title: '关键工序举牌验收制度',
        children: [
          {
            title: '主体/防水/钢筋/隐蔽工程等关键工序举牌验收',
            files: []
          },
          {
            title: '验收影像与资料同步归档，全程可查',
            files: []
          }
        ]
      },
      {
        title: '隐蔽工程影像化全追溯管控',
        children: [
          {
            title: '纸质资料+电子影像双归档，覆盖隐蔽全流程',
            files: []
          },
          {
            title: '验收编号管理，与施工日志一一对应，杜绝虚假验收',
            files: []
          }
        ]
      },
      {
        title: '旁站监理全流程管控',
        children: [
          {
            title: '危大工程、关键工序全过程旁站，留存旁站记录与影像',
            files: []
          },
          {
            title: '全程监督工艺符合规范与样板标准',
            files: []
          }
        ]
      },
      {
        title: '质量巡检与整改闭环机制',
        children: [
          {
            title: '日巡检/周排查月大检三级巡检制度，下发整改通知书',
            files: []
          },
          {
            title: '整改-复核-销项全闭环，质量问题100%销项',
            files: []
          }
        ]
      }
    ]
  },
  {
    title: '实测实量与分户验收全周期管控',
    icon: Document,
    children: [
      {
        title: '全流程实测实量管控体系',
        children: [
          {
            title: '专项方案全覆盖全专业，明确指标、标准、频次',
            files: []
          },
          {
            title: '实测数据实时上墙+数字化录入，与班组奖罚结算挂钩',
            files: []
          },
          {
            title: '第三方飞检复核，合格率行业领先',
            files: []
          }
        ]
      },
      {
        title: '分户验收一户一验全闭环',
        children: [
          {
            title: '以户为单位100%全覆盖验收，覆盖观感/功能/尺寸/防水',
            files: []
          },
          {
            title: '一户一档完整档案，验收合格作为竣工验收前置条件',
            files: []
          },
          {
            title: '交付前承接查验与品质提升',
            children: [
              {
                title: '多轮模拟业主视角全维度查验，问题台账闭环整改',
                files: []
              },
              {
                title: '一户一验成品保护，高品质交付，业主满意度领先',
                files: []
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: '材料与构配件全链条质量溯源管理',
    icon: Document,
    children: [
      {
        title: '材料进场联合验收制度',
        children: [
          {
            title: '施工/监理/建设三方联合验收，核对质保资料与封样标准',
            files: []
          },
          {
            title: '不合格材料严禁进场',
            files: []
          }
        ]
      },
      {
        title: '见证取样与送检全闭环管理',
        children: [
          {
            title: '需复检材料100%监理见证取样封样送检，影像台账全留存',
            files: []
          },
          {
            title: '检测报告二维码溯源，未复检合格严禁使用',
            files: []
          }
        ]
      },
      {
        title: '不合格材料退场闭环管理',
        children: [
          {
            title: '不合格材料立即下达退场通知单，时限+数量明确',
            files: []
          },
          {
            title: '退场影像+签收台账留存100%退场无流入风险',
            files: []
          }
        ]
      },
      {
        title: '材料全流程溯源管理',
        children: [
          {
            title: '数字化台账，采购-进场-验收-领用-安装全流程追踪',
            files: []
          },
          {
            title: '绿色/高性能/环保建材认证与应用',
            files: []
          }
        ]
      }
    ]
  },
  {
    title: '质量通病防治与创优专项管理',
    icon: Document,
    children: [
      {
        title: '质量通病防治专项体系',
        children: [
          {
            title: '通病清单+专项方案，针对性解决渗漏开裂空鼓等行业痛点',
            files: []
          },
          {
            title: '通病防治样板先行，定期复盘优化，形成工法/QC成果',
            files: []
          }
        ]
      },
      {
        title: '创优创奖专项质量管控',
        children: [
          {
            title: '创优专项策划，明确亮点、标准、责任分工',
            files: []
          },
          {
            title: '创优标准高于国标，过程创优、一次成优',
            files: []
          },
          {
            title: '创优资料与工程实体同步，完整规范可追溯',
            files: []
          }
        ]
      },
      {
        title: '成品保护专项管控体系',
        children: [
          {
            title: '全专业成品保护专项方案，分阶段针对性保护措施',
            files: []
          },
          {
            title: '成品保护交接检制度，损坏追责赔偿，确保成品完好',
            files: []
          }
        ]
      }
    ]
  },
  {
    title: '质量管控数字化与创新体系',
    icon: Document,
    children: [
      {
        title: '质量追溯数字化管理',
        children: [
          {
            title: '一构件一档一户一码追溯二维码，全流程信息扫码可查',
            files: []
          },
          {
            title: '质量管理数字化平台，质量问题线上闭环管控',
            files: []
          }
        ]
      },
      {
        title: 'BIM技术质量管控应用',
        children: [
          {
            title: '图纸会审+碰撞检查，提前解决错漏碰缺，避免返工',
            files: []
          },
          {
            title: '复杂节点/管线综合可视化交底，提升施工精度',
            files: []
          }
        ]
      },
      {
        title: '智能化质量检测应用',
        children: [
          {
            title: 'AI视频监控、智能实测设备、智能监测技术应用',
            files: []
          },
          {
            title: '无人机航拍、三维激光扫描数字化精准验收',
            files: []
          }
        ]
      }
    ]
  }
])

const designCategories = shallowRef([
  {
    title: '前期设计合规与批复文件',
    icon: Files,
    children: [
      {
        title: '方案设计文件及主管部门批复文件',
        files: []
      },
      {
        title: '初步设计文件及主管部门批复文件',
        files: []
      },
      {
        title: '初步设计概算及审批文件',
        files: []
      }
    ]
  },
  {
    title: '设计出图与图纸管控文件',
    icon: Notebook,
    children: [
      {
        title: '全套施工图设计文件',
        files: []
      },
      {
        title: '施工图审查合格书及整改回复',
        files: []
      },
      {
        title: '设计交底纪要',
        files: []
      },
      {
        title: '图纸会审纪要',
        files: []
      }
    ]
  },
  {
    title: '过程设计变更与技术确认文件',
    icon: Paperclip,
    children: [
      {
        title: '设计变更文件',
        files: []
      },
      {
        title: '设计补充说明/修改通知书',
        files: []
      },
      {
        title: '技术核定单',
        files: []
      },
      {
        title: '材料/设备代换设计确认书',
        files: []
      },
      {
        title: '四方签认现场洽商记录',
        files: []
      }
    ]
  },
  {
    title: '参建方技术往来与管控函件',
    icon: Document,
    children: [
      {
        title: '工作联系函',
        files: []
      },
      {
        title: '设计相关监理指令及回复文件',
        files: []
      },
      {
        title: '参建各方设计相关往来函件',
        files: []
      }
    ]
  },
  {
    title: '专项与二次深化设计管控文件',
    icon: FolderOpened,
    children: [
      {
        title: '专项设计图纸及审查文件',
        children: [
          {
            title: '消防专项设计',
            files: []
          },
          {
            title: '人防专项设计',
            files: []
          },
          {
            title: '钢结构/幕墙专项设计',
            files: []
          },
          {
            title: '精装/智能化专项设计',
            files: []
          },
          {
            title: '园林景观专项设计',
            files: []
          }
        ]
      },
      {
        title: '二次深化设计文件',
        children: [
          {
            title: '机电管线综合深化',
            files: []
          },
          {
            title: '支吊架系统深化',
            files: []
          },
          {
            title: '幕墙节点深化',
            files: []
          }
        ]
      },
      {
        title: '深化设计图纸设计审核确认文件',
        files: []
      }
    ]
  },
  {
    title: '竣工验收与归档配套文件',
    icon: Files,
    children: [
      {
        title: '设计单位竣工验收质量检查报告',
        files: []
      },
      {
        title: '竣工图设计审核签认文件',
        files: []
      },
      {
        title: '设计相关竣工归档全套资料',
        files: []
      }
    ]
  }
])

const toggleCategory = (type, index) => {
  if (type === 'design') {
    expandedDesignCategories.value[index] = !expandedDesignCategories.value[index]
  } else if (type === 'cost') {
    expandedCostCategories.value[index] = !expandedCostCategories.value[index]
  } else if (type === 'supervisor') {
    expandedSupervisorCategories.value[index] = !expandedSupervisorCategories.value[index]
  } else {
    expandedHighlightCategories.value[index] = !expandedHighlightCategories.value[index]
  }
}

const toggleSubcategory = (type, catIndex, subIndex) => {
  const key = `${catIndex}-${subIndex}`
  if (type === 'design') {
    expandedDesignSubcategories.value[key] = !expandedDesignSubcategories.value[key]
  } else if (type === 'cost') {
    expandedCostSubcategories.value[key] = !expandedCostSubcategories.value[key]
  } else if (type === 'supervisor') {
    expandedSupervisorSubcategories.value[key] = !expandedSupervisorSubcategories.value[key]
  } else {
    expandedHighlightSubcategories.value[key] = !expandedHighlightSubcategories.value[key]
  }
}

const toggleFolder = (type, catIndex, subIndex, itemIndex) => {
  const key = `${catIndex}-${subIndex}-${itemIndex}`
  if (type === 'design') {
    expandedDesignFolders.value[key] = !expandedDesignFolders.value[key]
  } else if (type === 'cost') {
    expandedCostFolders.value[key] = !expandedCostFolders.value[key]
  } else {
    expandedHighlightFolders.value[key] = !expandedHighlightFolders.value[key]
  }
}

const toggleSubFolder = (type, catIndex, subIndex, itemIndex, subItemIndex) => {
  const key = `${catIndex}-${subIndex}-${itemIndex}-${subItemIndex}`
  if (type === 'design') {
    expandedDesignSubFolders.value[key] = !expandedDesignSubFolders.value[key]
  } else if (type === 'cost') {
    expandedCostSubFolders.value[key] = !expandedCostSubFolders.value[key]
  } else {
    expandedHighlightSubFolders.value[key] = !expandedHighlightSubFolders.value[key]
  }
}

const getFileIcon = (typeOrFilename) => {
  // 支持传入文件名或类型
  let type = typeOrFilename
  if (typeof typeOrFilename === 'string' && typeOrFilename.includes('.')) {
    type = getFileType(typeOrFilename)
  }
  
  const iconMap = {
    pdf: Document,
    dwg: Notebook,
    dxf: Notebook,
    word: Document,
    excel: Document,
    ppt: Document,
    image: Picture,
    video: Picture,
    audio: Picture,
    archive: Document,
    document: Document
  }
  return iconMap[type] || Document
}

const getFileIconClass = (typeOrFilename) => {
  let type = typeOrFilename
  if (typeof typeOrFilename === 'string' && typeOrFilename.includes('.')) {
    type = getFileType(typeOrFilename)
  }
  
  const classMap = {
    pdf: 'pdf-icon',
    dwg: 'dwg-icon',
    dxf: 'dwg-icon',
    word: 'word-icon',
    excel: 'excel-icon',
    ppt: 'ppt-icon',
    image: 'image-icon',
    video: 'video-icon',
    audio: 'audio-icon',
    archive: 'archive-icon',
    document: 'document-icon'
  }
  return classMap[type] || 'document-icon'
}

const previewFile = (file) => {
  if (!file || !file.url) {
    ElMessage.warning('文件信息不完整，无法预览')
    return
  }
  previewFileData.value = file
  previewDialogVisible.value = true
}

const downloadFile = async (file) => {
  if (!file || !file.url) {
    ElMessage.error('文件下载链接无效')
    return
  }
  
  try {
    ElMessage.info(`正在准备下载: ${file.name}...`)
    
    // 构建完整的下载URL
    const baseUrl = window.location.origin
    const downloadUrl = `${baseUrl}${file.url}`
    
    // 创建临时链接并触发下载
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = file.name || 'download'
    link.target = '_blank'
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link)
    }, 100)
    
    ElMessage.success(`开始下载：${file.name}`)
    console.log(`[FileManagement] Download initiated for: ${file.name} -> ${downloadUrl}`)
  } catch (error) {
    console.error('[FileManagement] Download error:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 辅助函数：判断是否为图片文件
const isImageFile = (filename) => {
  if (!filename) return false
  const ext = filename.split('.').pop().toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
  return imageExts.includes(ext)
}

// 辅助函数：获取完整的文件URL
const getFullUrl = (url) => {
  if (!url) return ''
  
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 否则拼接当前域名
  return `${window.location.origin}${url}`
}

// 辅助函数：处理图片加载错误
const handleImageError = (e) => {
  console.warn('[FileManagement] Image load error:', e.target.src)
  e.target.alt = '图片加载失败'
  e.target.style.display = 'none'
}

// 删除文件函数（仅管理员可用）
const deleteFile = async (file, type, categoryIndex, subIndex, itemIndex = -1, subItemIndex = -1) => {
  if (!isAdmin.value) {
    ElMessage.warning('只有管理员可以删除文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${file.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 1. 使用正确的数据结构（.children）从对应的数组中移除文件
    const targetArray = getTargetArray(type, categoryIndex, subIndex, itemIndex, subItemIndex)

    if (targetArray) {
      const fileIndex = targetArray.findIndex(f => f.id === file.id)
      if (fileIndex > -1) {
        const removedFile = targetArray[fileIndex]
        targetArray.splice(fileIndex, 1)
        console.log(`[FileManagement] Removed file metadata: ${removedFile.name} (id: ${removedFile.id})`)
      } else {
        console.warn('[FileManagement] File not found by id, trying name+url fallback:', file.name)
        const fallbackIndex = targetArray.findIndex(f => f.name === file.name && f.url === file.url)
        if (fallbackIndex > -1) {
          targetArray.splice(fallbackIndex, 1)
          console.log(`[FileManagement] Removed file via fallback: ${file.name}`)
        } else {
          ElMessage.warning('未找到该文件记录')
          return
        }
      }
    } else {
      ElMessage.error('无法定位文件所在位置')
      return
    }

    // 2. 调用后端API删除服务器上的文件（使用正确的端点）
    if (file.url) {
      try {
        const urlParts = file.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        await uploadApi.deleteImage(filename)
        console.log(`[FileManagement] Server file deleted: ${filename}`)
      } catch (deleteErr) {
        console.warn('[FileManagement] Server file deletion failed:', deleteErr)
        // 即使服务器删除失败，也继续删除元数据
      }
    }

    // 3. 保存更新后的数据到服务器
    await saveFileData()

    ElMessage.success(`文件 "${file.name}" 已删除`)
    console.log(`[FileManagement] File deleted successfully: ${file.name}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('[FileManagement] Delete error:', error)
      ElMessage.error('删除失败：' + (error.message || '未知错误'))
    }
  }
}

const showUploadDialog = (type, categoryIndex, subIndex, itemIndex = -1, subItemIndex = -1) => {
  currentUploadTarget.value = { type, categoryIndex, subIndex, itemIndex, subItemIndex }
  currentUploadFiles.value = []
  uploadDialogVisible.value = true
}

const handleFileChange = (file) => {
  currentUploadFiles.value.push(file.raw)
  return false
}

const handleFileRemove = (file) => {
  const index = currentUploadFiles.value.findIndex(f => f.name === file.name)
  if (index > -1) {
    currentUploadFiles.value.splice(index, 1)
  }
}

const uploadFiles = async () => {
  if (currentUploadFiles.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  uploadLoading.value = true
  let successCount = 0
  let failCount = 0
  
  const { type, categoryIndex, subIndex, itemIndex, subItemIndex } = currentUploadTarget.value
  
  for (const file of currentUploadFiles.value) {
    try {
      const reader = new FileReader()
      const fileContent = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      const filename = file.name
      const category = type
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('zhihui_site_token')}`
        },
        body: JSON.stringify({ 
          image: fileContent, 
          filename,
          category
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '上传失败')
      }
      
      const result = await response.json()
      
      const newFile = {
        id: 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10) + '_' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        type: getFileType(file.name),
        date: new Date().toLocaleDateString(),
        url: result.url,
        size: formatFileSize(file.size)
      }
      
      let targetArray
      if (subItemIndex >= 0) {
        targetArray = getTargetArray(type, categoryIndex, subIndex, itemIndex, subItemIndex)
      } else if (itemIndex >= 0) {
        targetArray = getTargetArray(type, categoryIndex, subIndex, itemIndex)
      } else {
        targetArray = getTargetArray(type, categoryIndex, subIndex)
      }
      
      if (targetArray) {
        targetArray.push(newFile)
      }
      
      successCount++
    } catch (error) {
      console.error('上传文件失败:', error)
      failCount++
    }
  }
  
  uploadLoading.value = false
  uploadDialogVisible.value = false
  currentUploadFiles.value = []
  
  if (successCount > 0) {
    // 立即保存文件数据到服务器（确保局域网同步）
    await saveFileData()
    
    if (failCount === 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件，已同步到服务器`)
    } else {
      ElMessage.warning(`成功 ${successCount} 个，失败 ${failCount} 个（已成功的文件已同步）`)
    }
  } else {
    ElMessage.error('所有文件上传失败，请重试')
  }
}

const getTargetArray = (type, categoryIndex, subIndex, itemIndex = -1, subItemIndex = -1) => {
  let categories
  switch (type) {
    case 'design':
      categories = designCategories.value
      break
    case 'cost':
      categories = costCategories.value
      break
    case 'supervisor':
      categories = supervisorCategories.value
      break
    case 'highlight':
      categories = highlightCategories.value
      break
    default:
      return null
  }
  
  if (subItemIndex >= 0) {
    if (!categories[categoryIndex].children[subIndex].children[itemIndex].children[subItemIndex].files) {
      categories[categoryIndex].children[subIndex].children[itemIndex].children[subItemIndex].files = []
    }
    return categories[categoryIndex].children[subIndex].children[itemIndex].children[subItemIndex].files
  } else if (itemIndex >= 0) {
    if (!categories[categoryIndex].children[subIndex].children[itemIndex].files) {
      categories[categoryIndex].children[subIndex].children[itemIndex].files = []
    }
    return categories[categoryIndex].children[subIndex].children[itemIndex].files
  } else {
    if (!categories[categoryIndex].children[subIndex].files) {
      categories[categoryIndex].children[subIndex].files = []
    }
    return categories[categoryIndex].children[subIndex].files
  }
}

const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const typeMap = {
    pdf: 'pdf',
    dwg: 'dwg',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image'
  }
  return typeMap[ext] || 'document'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 数据持久化函数
const saveFileData = async () => {
  try {
    const fileData = {
      design: designCategories.value,
      cost: costCategories.value,
      supervisor: supervisorCategories.value,
      highlight: highlightCategories.value,
      lastUpdated: new Date().toISOString()
    }
    await dataService.set('fileManagement', fileData)
    console.log('[FileManagement] 文件数据已保存到服务器')
  } catch (error) {
    console.error('[FileManagement] 保存文件数据失败:', error)
  }
}

// 数据加载函数
const loadFileData = async () => {
  try {
    const savedData = await dataService.get('fileManagement', null)

    if (savedData && savedData.design && savedData.design.length > 0) {
      console.log('[FileManagement] 从服务器加载文件数据')
      designCategories.value = savedData.design
      costCategories.value = savedData.cost || costCategories.value
      supervisorCategories.value = savedData.supervisor || supervisorCategories.value
      highlightCategories.value = savedData.highlight || highlightCategories.value

      restoreCategoryIcons()

      ElMessage.success('已从服务器同步文件数据')
    } else {
      console.log('[FileManagement] 使用默认文件结构')
    }
  } catch (error) {
    console.error('[FileManagement] 加载文件数据失败:', error)
  }
}

const designIconMap = [Files, Notebook, Paperclip, Document, FolderOpened, Files]
const costIconMap = [Document, Document]
const supervisorIconMap = [Document, Calendar, Warning, Document, CircleCheck, View]
const highlightIconMap = [Document, Document, Document, Document, Document, Document]

function restoreCategoryIcons() {
  if (designCategories.value) {
    designCategories.value.forEach((cat, i) => {
      if (i < designIconMap.length && cat) cat.icon = designIconMap[i]
    })
  }
  if (costCategories.value) {
    costCategories.value.forEach((cat, i) => {
      if (i < costIconMap.length && cat) cat.icon = costIconMap[i]
    })
  }
  if (supervisorCategories.value) {
    supervisorCategories.value.forEach((cat, i) => {
      if (i < supervisorIconMap.length && cat) cat.icon = supervisorIconMap[i]
    })
  }
  if (highlightCategories.value) {
    highlightCategories.value.forEach((cat, i) => {
      if (i < highlightIconMap.length && cat) cat.icon = highlightIconMap[i]
    })
  }
}

// 监听数据变化并自动保存（防抖）
let saveTimeout = null
watch([designCategories, costCategories, supervisorCategories, highlightCategories], () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveFileData()
  }, 1000) // 1秒防抖，避免频繁保存
}, { deep: true })

onMounted(async () => {
  nextTick(() => {
    isMounted.value = true
  })
  
  // 加载已保存的文件数据
  await loadFileData()
  
  // 数据加载后，检查文件是否存在并自动清理无效记录
  setTimeout(() => {
    checkAndCleanInvalidFilesInManagement()
  }, 2000)
})

// 检查文件管理中的无效文件并清理
const checkAndCleanInvalidFilesInManagement = async () => {
  console.log('[FileManagement] Starting file integrity check...')
  
  try {
    // 收集所有文件URL
    const urlsToCheck = []
    
    const collectUrls = (categories) => {
      categories.forEach(cat => {
        if (cat.files) {
          cat.files.forEach(file => {
            if (file.url) urlsToCheck.push(file.url)
          })
        }
        if (cat.subcategories) {
          cat.subcategories.forEach(subCat => {
            if (subCat.files) {
              subCat.files.forEach(file => {
                if (file.url) urlsToCheck.push(file.url)
              })
            }
            if (subCat.items) {
              subCat.items.forEach(item => {
                if (item.files) {
                  item.files.forEach(file => {
                    if (file.url) urlsToCheck.push(file.url)
                  })
                }
                if (item.children) {
                  item.children.forEach(child => {
                    if (child.files) {
                      child.files.forEach(file => {
                        if (file.url) urlsToCheck.push(file.url)
                      })
                    }
                  })
                }
              })
            }
          })
        }
        if (cat.children) {
          collectUrls(cat.children)
        }
      })
    }
    
    collectUrls(designCategories.value)
    collectUrls(costCategories.value)
    
    supervisorCategories.value.forEach(cat => {
      if (cat.children) {
        cat.children.forEach(subCat => {
          if (subCat.files) {
            subCat.files.forEach(file => {
              if (file.url) urlsToCheck.push(file.url)
            })
          }
        })
      }
    })
    
    highlightCategories.value.forEach(cat => {
      if (cat.children) {
        cat.children.forEach(subCat => {
          if (subCat.children) {
            subCat.children.forEach(item => {
              if (item.files) {
                item.files.forEach(file => {
                  if (file.url) urlsToCheck.push(file.url)
                })
              }
              if (item.children) {
                item.children.forEach(child => {
                  if (child.files) {
                    child.files.forEach(file => {
                      if (file.url) urlsToCheck.push(file.url)
                    })
                  }
                })
              }
            })
          }
          if (subCat.files) {
            subCat.files.forEach(file => {
              if (file.url) urlsToCheck.push(file.url)
            })
          }
        })
      }
    })
    
    if (urlsToCheck.length === 0) {
      console.log('[FileManagement] No files to check')
      return
    }
    
    // 调用后端API批量检查
    const token = localStorage.getItem('zhihui_site_token')
    const response = await fetch('/api/check-files-exist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ urls: urlsToCheck })
    })
    
    if (!response.ok) {
      console.warn('[FileManagement] File check API failed:', response.status)
      return
    }
    
    const result = await response.json()
    
    if (!result.success || !result.results) {
      return
    }
    
    // 找出所有不存在的文件URL
    const invalidUrls = Object.entries(result.results)
      .filter(([url, data]) => !data.exists)
      .map(([url]) => url)
    
    if (invalidUrls.length > 0) {
      console.warn(`[FileManagement] Found ${invalidUrls.length} invalid files, cleaning up...`)
      
      // 递归清理函数
      const cleanInvalidFromArray = (arr) => {
        const beforeLength = arr.length
        const cleaned = arr.filter(item => !item.url || !invalidUrls.includes(item.url))
        return { cleaned, changed: cleaned.length !== beforeLength }
      }
      
      let totalCleaned = 0
      
      // 清理各分类中的无效文件（简化处理：直接重新过滤）
      designCategories.value.forEach(cat => {
        if (cat.subcategories) {
          cat.subcategories.forEach(subCat => {
            if (subCat.files) {
              const { cleaned, changed } = cleanInvalidFromArray(subCat.files)
              if (changed) { subCat.files = cleaned; totalCleaned += changed }
            }
            if (subCat.items) {
              subCat.items.forEach(item => {
                if (item.files) {
                  const { cleaned, changed } = cleanInvalidFromArray(item.files)
                  if (changed) { item.files = cleaned; totalCleaned += changed }
                }
                if (item.children) {
                  item.children.forEach(child => {
                    if (child.files) {
                      const { cleaned, changed } = cleanInvalidFromArray(child.files)
                      if (changed) { child.files = cleaned; totalCleaned += changed }
                    }
                  })
                }
              })
            }
          })
        }
      })
      
      costCategories.value.forEach(cat => {
        if (cat.subcategories) {
          cat.subcategories.forEach(subCat => {
            if (subCat.files) {
              const { cleaned, changed } = cleanInvalidFromArray(subCat.files)
              if (changed) { subCat.files = cleaned; totalCleaned += changed }
            }
            if (subCat.items) {
              subCat.items.forEach(item => {
                if (item.files) {
                  const { cleaned, changed } = cleanInvalidFromArray(item.files)
                  if (changed) { item.files = cleaned; totalCleaned += changed }
                }
              })
            }
          })
        }
      })
      
      if (totalCleaned > 0) {
        await saveFileData()
        console.log(`[FileManagement] Cleaned ${totalCleaned} invalid files`)
        ElMessage.warning(`已自动清理 ${totalCleaned} 个失效文件记录`)
      }
    } else {
      console.log('[FileManagement] All files are valid)')
    }
  } catch (error) {
    console.error('[FileManagement] File integrity check error:', error)
  }
}
</script>

<style scoped>
.file-management {
  padding: 0;
  position: relative;
  width: 100%;
  max-width: 100%;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease-out;
}

.main-tabs {
  margin-bottom: 24px;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 16px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.main-tabs :deep(.el-tabs__item) {
  color: #4E5969;
  font-weight: 500;
  border-radius: 12px;
  margin: 0 4px;
  padding: 0 24px;
  transition: all 0.3s ease;
}

.main-tabs :deep(.el-tabs__item:hover) {
  color: var(--future-primary);
  background: rgba(102, 0, 153, 0.08);
}

.main-tabs :deep(.el-tabs__item.is-active) {
  color: var(--future-primary);
  font-weight: 600;
  background: linear-gradient(135deg, rgba(102, 0, 153, 0.15) 0%, rgba(102, 0, 153, 0.08) 100%);
}

.main-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.file-management.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.page-header {
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
  background: var(--future-primary);
  border-radius: 9999px;
}

.file-tree-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-card {
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
  transition: all 0.3s ease;
}

.category-card:hover {
  box-shadow:
    0 12px 48px rgba(102, 0, 153, 0.25),
    0 4px 16px rgba(102, 0, 153, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(102, 0, 153, 0.08);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.category-header:hover {
  background: rgba(102, 0, 153, 0.05);
}

.category-icon {
  font-size: 24px;
  color: var(--future-primary);
  transition: transform 0.2s ease;
}

.category-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.expand-icon {
  font-size: 16px;
  color: #86909C;
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(90deg);
  color: var(--future-primary);
}

.category-content {
  padding: 0 24px 24px;
}

.subcategory {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid rgba(102, 0, 153, 0.1);
}

.subcategory:last-child {
  margin-bottom: 0;
}

.subcategory-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subcategory-header:hover {
  background: rgba(102, 0, 153, 0.05);
}

.subcategory-icon {
  font-size: 18px;
  color: var(--future-secondary);
}

.subcategory-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.subcategory-content {
  padding: 0 20px 20px;
}

.folder-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid rgba(102, 0, 153, 0.08);
}

.folder-item:last-child {
  margin-bottom: 0;
}

.folder-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.folder-item-header:hover {
  background: rgba(102, 0, 153, 0.05);
}

.folder-icon {
  font-size: 16px;
  color: var(--future-primary);
}

.folder-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #4E5969;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.folder-content {
  padding: 0 18px 18px;
}

.subfolder-item {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid rgba(102, 0, 153, 0.06);
}

.subfolder-item:last-child {
  margin-bottom: 0;
}

.subfolder-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subfolder-item-header:hover {
  background: rgba(102, 0, 153, 0.05);
}

.subfolder-icon {
  font-size: 14px;
  color: var(--future-secondary);
}

.subfolder-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #6E737F;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.file-list {
  padding: 0 18px 18px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(102, 0, 153, 0.06);
  transition: all 0.2s ease;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(102, 0, 153, 0.15);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 0, 153, 0.1);
}

.file-icon {
  font-size: 20px;
  color: #86909C;
}

.file-icon.pdf-icon {
  color: #F53F3F;
}

.file-icon.dwg-icon {
  color: #165DFF;
}

.file-icon.word-icon {
  color: #165DFF;
}

.file-icon.excel-icon {
  color: #00B42A;
}

.file-icon.image-icon {
  color: #FF7D00;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #1D2129;
  font-weight: 500;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.file-date {
  font-size: 12px;
  color: #86909C;
  margin-right: 16px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.preview-dialog {
  border-radius: 20px;
}

.preview-content {
  padding: 20px 0;
}

.preview-info {
  margin-bottom: 24px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 16px;
  border: 1px dashed rgba(102, 0, 153, 0.2);
}

.preview-icon {
  font-size: 64px;
  color: var(--future-primary);
  margin-bottom: 16px;
}

.preview-text {
  font-size: 16px;
  color: #4E5969;
  margin-bottom: 24px;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, sans-serif;
}

.preview-hint {
  font-size: 13px;
  color: #86909C;
  margin-bottom: 20px;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  max-height: 70vh;
  overflow: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .page-header h2 {
    font-size: 20px;
  }

  .file-tree-container {
    padding: 8px;
  }

  .category-header {
    padding: 12px 16px;
  }

  .category-title {
    font-size: 15px;
  }

  .file-item {
    padding: 10px 12px;
  }

  .file-name {
    max-width: 200px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .main-tabs :deep(.el-tabs__nav) {
    white-space: nowrap;
    overflow-x: auto;
  }

  .main-tabs :deep(.el-tabs__item) {
    padding: 0 16px;
    font-size: 13px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-header h2 {
    font-size: 18px;
  }

  .file-tree-container {
    padding: 4px;
  }

  .category-card {
    margin-bottom: 8px;
  }

  .category-header {
    padding: 10px 12px;
  }

  .category-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .category-title {
    font-size: 14px;
  }

  .subcategory-header {
    padding: 8px 12px 8px 24px;
  }

  .subcategory-title {
    font-size: 13px;
  }

  .file-item {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }

  .file-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .file-name {
    width: 100%;
    max-width: unset;
    font-size: 12px;
    order: 1;
  }

  .file-date {
    font-size: 11px;
    order: 2;
  }

  .file-actions {
    width: 100%;
    justify-content: flex-end;
    order: 3;
  }

  .preview-dialog {
    width: 95% !important;
  }
}

@media (max-width: 480px) {
  .main-tabs :deep(.el-tabs__item) {
    padding: 0 12px;
    font-size: 12px;
  }

  .page-header h2 {
    font-size: 16px;
  }

  .category-header {
    padding: 8px 10px;
  }

  .category-title {
    font-size: 13px;
  }

  .file-actions {
    flex-direction: column;
    gap: 4px;
  }

  .file-actions .el-button {
    width: 100%;
    padding: 4px 8px;
    font-size: 11px;
  }
}

.upload-file-btn {
  padding: 12px 16px;
  text-align: center;
  border-top: 1px dashed rgba(102, 0, 153, 0.15);
  margin-top: 8px;
}

.upload-dialog {
  border-radius: 16px;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 2px dashed rgba(102, 0, 153, 0.3);
  background: rgba(245, 247, 250, 0.5);
  transition: all 0.3s ease;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--future-primary);
  background: rgba(102, 0, 153, 0.05);
}

.upload-area :deep(.el-icon--upload) {
  font-size: 48px;
  color: var(--future-primary);
  margin-bottom: 16px;
}

.upload-area :deep(.el-upload__text) {
  font-size: 14px;
  color: #4E5969;
}

.upload-area :deep(.el-upload__text em) {
  color: var(--future-primary);
  font-style: normal;
}

.upload-area :deep(.el-upload__tip) {
  font-size: 12px;
  color: #86909C;
  margin-top: 8px;
}
</style>
