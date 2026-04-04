<template>
  <div class="app-container">
    <SpaceBackground />
    <svg style="position: absolute; width: 0; height: 0;">
      <defs>
        <filter id="liquid-glass-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur1" />
          <feColorMatrix in="blur1" mode="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 18 -7
          " result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <filter id="soft-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
      </defs>
    </svg>

    
    <div class="top-dock-container">
      <div class="top-dock-wrapper">
        <div class="top-dock">
          <div class="top-dock-content">
            <div class="logo-section">
              <div class="logo-text">
                <img src="@/assets/images/yto-logo.png" alt="圆通速递" class="main-yto-logo" />
                <div class="logo-text-content">
                  <h1 class="main-title">
                    <span>智慧工地控制中心</span>
                  </h1>
                  <span class="project-name">圆通淮安3号集运中心</span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <div class="status-indicators">
                <div class="status-item">
                  <el-icon class="status-icon"><Cpu /></el-icon>
                  <span class="status-text">系统正常</span>
                </div>
                <div class="time-display">
                  <span class="time">{{ currentTime }}</span>
                  <span class="date">{{ currentDate }}</span>
                </div>
              </div>
              <div class="user-profile">
                <div class="user-dropdown" @click="toggleDropdown">
                  <div class="user-avatar">
                      <el-icon><User /></el-icon>
                    </div>
                  <span class="username">{{ username }}</span>
                  <el-icon class="dropdown-icon" :class="{ 'rotated': dropdownVisible }"><ArrowDown /></el-icon>
                </div>
                <div v-if="dropdownVisible" class="custom-dropdown-menu">
                  <div 
                    @click.stop="handleLogoutClick" 
                    class="custom-dropdown-item"
                  >
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <main class="content-area">
      <div class="breadcrumb-section">
        <el-breadcrumb separator="" class="breadcrumb">
          <el-breadcrumb-item class="breadcrumb-item" @click="activeMenu = 'dashboard'">
            <el-icon class="breadcrumb-icon"><House /></el-icon>
            <span class="breadcrumb-text">首页</span>
          </el-breadcrumb-item>
          <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
          <el-breadcrumb-item class="breadcrumb-item">
            <span class="breadcrumb-text active">{{ menuTitle }}</span>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      
      <div class="page-content">
        <transition :name="transitionName" mode="out-in">
          <div :key="activeMenu">
            <Dashboard v-if="activeMenu === 'dashboard'" @navigate="handleNavigate" />
            <PersonnelManagement v-if="activeMenu === 'personnel'" :action="navigateAction" />
            <EquipmentManagement v-if="activeMenu === 'equipment'" :action="navigateAction" />
            <SafetyInspection v-if="activeMenu === 'safety'" :action="navigateAction" />
            <ProgressManagement v-if="activeMenu === 'progress'" :action="navigateAction" />
            <MaterialManagement v-if="activeMenu === 'materials'" :action="navigateAction" />
            <FileManagement v-if="activeMenu === 'files"" />
            <MajorEvents v-if="activeMenu === 'events"" />
            <QualityManagement v-if="activeMenu === 'quality'" />
            <SystemInfo v-if="activeMenu === 'system'" />
            <BugFeedback v-if="activeMenu === 'feedback'" />
            <LogSystem v-if="activeMenu === 'logs' && isAdmin" />
          </div>
        </transition>
      </div>
    </main>
    
    <BottomDock :active-menu="activeMenu" @menu-select="handleDockSelect" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House, Monitor, User, SwitchButton, ArrowDown, Cpu, DataBoard, Tools, Warning, Document, Goods } from '@element-plus/icons-vue'
import BottomDock from './BottomDock.vue'
import dataService from '../services/dataService'
import Dashboard from './Dashboard.vue'
import PersonnelManagement from './PersonnelManagement.vue'
import EquipmentManagement from './EquipmentManagement.vue'
import SafetyInspection from './SafetyInspection.vue'
import ProgressManagement from './ProgressManagement.vue'
import MaterialManagement from './MaterialManagement.vue'
import SystemInfo from './SystemInfo.vue'
import BugFeedback from './BugFeedback.vue'
import LogSystem from './LogSystem.vue'
import MajorEvents from './MajorEvents.vue'

import SpaceBackground from './SpaceBackground.vue'
import QualityManagement from './QualityManagement.vue'

const FileManagement = defineAsyncComponent(() =>
  import('./FileManagement.vue')
)

const router = useRouter()
const route = useRoute()
const activeMenu = ref('dashboard')
const navigateAction = ref('')
const username = ref(localStorage.getItem('zhihui_site_username') || 'admin')
const currentTransition = ref('fade')
const transitionName = computed(() => currentTransition.value)
const currentTime = ref('')
const currentDate = ref('')
const dropdownVisible = ref(false)
let timeInterval = null

watch(() => route.path, (newPath) => {
  console.log('路由变化:', newPath)
  if (newPath === '/dashboard') {
    activeMenu.value = 'dashboard'
  } else if (newPath.includes('/personnel')) {
    activeMenu.value = 'personnel'
  } else if (newPath.includes('/equipment')) {
    activeMenu.value = 'equipment'
  } else if (newPath.includes('/safety')) {
    activeMenu.value = 'safety'
  } else if (newPath.includes('/progress')) {
    activeMenu.value = 'progress'
  } else if (newPath.includes('/materials')) {
    activeMenu.value = 'materials'
  } else if (newPath.includes('/files')) {
    activeMenu.value = 'files'
  } else if (newPath.includes('/events')) {
    activeMenu.value = 'events'
  } else if (newPath.includes('/quality')) {
    activeMenu.value = 'quality'
  } else if (newPath.includes('/system')) {
    activeMenu.value = 'system'
  } else if (newPath.includes('/feedback')) {
    activeMenu.value = 'feedback'
  } else if (newPath.includes('/logs')) {
    activeMenu.value = 'logs'
  }
})

const isAdmin = computed(() => {
  const userId = localStorage.getItem('zhihui_site_userid')
  return userId === 'admin'
})

const toggleDropdown = (event) => {
  console.log('toggleDropdown被点击')
  event.stopPropagation()
  
  dropdownVisible.value = !dropdownVisible.value
  console.log('dropdownVisible现在是:', dropdownVisible.value)
  
  if (dropdownVisible.value) {
    try {
      document.removeEventListener('click', closeDropdown)
    } catch (e) {
      console.log('移除事件监听器失败:', e)
    }
    document.addEventListener('click', closeDropdown)
  } else {
    try {
      document.removeEventListener('click', closeDropdown)
    } catch (e) {
      console.log('移除事件监听器失败:', e)
    }
  }
}

const closeDropdown = (event) => {
  console.log('closeDropdown被触发')
  const userProfile = document.querySelector('.user-profile')
  if (userProfile && !userProfile.contains(event.target)) {
    console.log('点击在userProfile外部，关闭下拉菜单')
    dropdownVisible.value = false
    try {
      document.removeEventListener('click', closeDropdown)
    } catch (e) {
      console.log('移除事件监听器失败:', e)
    }
  }
}

const addLog = async (message, level = 'info', details = null) => {
  try {
    await dataService.addLog(level, message, details)
  } catch (error) {
    console.error('添加日志失败:', error)
  }
}

const handleLogoutClick = () => {
  console.log('handleLogoutClick被点击')
  logout()
}

const logout = () => {
  try {
    const userName = localStorage.getItem('zhihui_site_username') || '未知用户'
    
    localStorage.removeItem('zhihui_site_logged_in')
    localStorage.removeItem('zhihui_site_username')
    localStorage.removeItem('zhihui_site_userid')
    
    dropdownVisible.value = false
    try {
      document.removeEventListener('click', closeDropdown)
    } catch (e) {
    }
    
    ElMessage.success('已成功退出登录')
    router.push('/login')
    
    setTimeout(() => {
      addLog(`${userName} 退出登录`, 'info', {
        user: userName,
        logoutTime: new Date().toLocaleString('zh-CN')
      }).catch(error => {
        console.error('记录退出登录日志失败:', error)
      })
    }, 0)
  } catch (error) {
    console.error('退出登录出错:', error)
    ElMessage.error('退出登录失败，请重试')
  }
}

const handleNavigate = (menu) => {
  const transitions = ['fade', 'slide', 'scale']
  currentTransition.value = transitions[Math.floor(Math.random() * transitions.length)]
  
  if (typeof menu === 'object' && menu.menu) {
    activeMenu.value = menu.menu
    navigateAction.value = menu.action || ''
    if (menu.action === 'add') {
      console.log(`Navigate to ${menu.menu} with action ${menu.action}`)
    }
  } else {
    activeMenu.value = menu
    navigateAction.value = ''
  }
}

const handleDockSelect = (menu) => {
  const transitions = ['fade', 'slide', 'scale']
  currentTransition.value = transitions[Math.floor(Math.random() * transitions.length)]
  activeMenu.value = menu
  navigateAction.value = ''
}

const menuTitle = computed(() => {
  const menuMap = {
    dashboard: '数据看板',
    personnel: '人员管理',
    equipment: '设备管理',
    safety: '安全巡检',
    progress: '进度管理',
    materials: '材料进场',
    files: '文件管理',
    events: '工地大事件',
    quality: '工程质量',
    system: '系统信息',
    feedback: 'Bug反馈',
    logs: '系统日志'
  }
  return menuMap[activeMenu.value] || '首页'
})

const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  })
}

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  
  console.log('MainLayout挂载时的登录状态:', {
    loggedIn: localStorage.getItem('zhihui_site_logged_in'),
    username: localStorage.getItem('zhihui_site_username'),
    userid: localStorage.getItem('zhihui_site_userid')
  })
  
  console.log('MainLayout挂载时的路由:', route.path)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  overflow: hidden;
}








.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: var(--future-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.logo-text {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
}

.logo-text-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.main-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #000000;
  margin: 0;
  letter-spacing: 1px;
}

.main-yto-logo {
  height: 60px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.project-name {
  font-size: 0.875rem;
  color: #000000;
  letter-spacing: 0.5px;
  margin-left: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
  position: relative;
  z-index: 9999;
  overflow: visible;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.2s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  height: 60px;
  min-width: 120px;
}

.status-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

.status-icon {
  color: #00B42A;
  font-size: 1.125rem;
}

.status-text {
  font-size: 0.875rem;
  color: var(--future-text-primary);
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  min-width: 130px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  transition: all 0.2s ease;
  height: 60px;
}

.time-display .time {
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  letter-spacing: 1px;
}

.time-display .date {
  font-size: 0.75rem;
  color: #000000;
}

.user-profile {
  position: relative;
  z-index: 9999;
  overflow: visible;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  height: 60px;
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--future-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar .el-icon {
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.username {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--future-text-primary);
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.user-dropdown:hover .dropdown-icon {
  color: var(--future-secondary);
}

.dropdown-icon.rotated {
  color: var(--future-secondary);
  transform: rotate(180deg);
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  animation: slideInUp 0.25s ease-out;
  z-index: 9999;
  min-width: 160px;
  white-space: nowrap;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-dropdown-item {
  padding: 0.875rem 1.5rem;
  color: #000000;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.custom-dropdown-item:hover {
  background: rgba(0, 0, 0, 0.12);
  color: #000000;
}

.custom-dropdown-item .el-icon {
  color: #000000;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.custom-dropdown-item:hover .el-icon {
  transform: scale(1.1);
}

.content-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow-y: auto;
  padding: 2rem;
  padding-bottom: 100px;
  margin-top: 100px;
  position: relative;
  z-index: 1;
}

.breadcrumb-section {
  margin-bottom: 2rem;
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 8px;
  border: 1px solid rgba(229, 230, 235, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.breadcrumb-item:hover {
  transform: translateY(-1px);
}

.breadcrumb-icon {
  color: var(--future-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.breadcrumb-item:hover .breadcrumb-icon {
  transform: scale(1.2);
}

.breadcrumb-text {
  font-size: 0.875rem;
  color: #4E5969;
  transition: all 0.2s ease;
}

.breadcrumb-item:hover .breadcrumb-text {
  color: var(--future-primary);
}

.breadcrumb-text.active {
  color: #1D2129;
  font-weight: 600;
}

.breadcrumb-separator {
  color: #86909C;
  font-size: 0.75rem;
}

.page-content {
  min-height: calc(100vh - 200px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active,
  .scale-enter-active,
  .scale-leave-active {
    transition: none;
  }
  .fade-enter-from,
  .fade-leave-to,
  .slide-enter-from,
  .slide-leave-to,
  .scale-enter-from,
  .scale-leave-to {
    opacity: 1;
    transform: none;
  }
}


@media (max-width: 1200px) {
  .top-dock-container {
    width: calc(100% - 3rem);
  }
  
  .floating-header {
    width: 92%;
  }
  
  .floating-content {
    padding: 0 1.5rem;
  }
  
  .content-area {
    padding: 1.5rem;
    padding-bottom: 120px;
    margin-top: 90px;
  }
}

@media (max-width: 768px) {
  .top-dock-container {
    width: calc(100% - 2rem);
  }
  
  .app-container {
    height: 100vh;
    overflow: auto;
  }
  
  .content-area {
    flex: 1;
    width: 100%;
    padding: 1rem;
    padding-bottom: 140px;
    margin-top: 80px;
  }
  
  .floating-header {
    width: 95%;
  }
  
  .floating-content {
    padding: 0 1rem;
    height: 56px;
  }
  
  .main-title {
    font-size: 1.1rem;
  }
  
  .project-name {
    display: none;
  }
  
  .status-indicators {
    gap: 0.5rem;
  }
  
  .status-item {
    padding: 0.4rem;
    min-width: auto;
  }
  
  .status-text {
    display: none;
  }
  
  .time-display {
    min-width: 80px;
    padding: 0.4rem;
  }
  
  .time-display .time {
    font-size: 0.9rem;
  }
  
  .time-display .date {
    font-size: 0.6rem;
  }
  
  .user-dropdown {
    padding: 0.5rem;
  }
  
  .username {
    display: none;
  }
  
  .breadcrumb-section {
    margin-bottom: 1rem;
  }
  
  .breadcrumb {
    padding: 0.8rem 1rem;
  }
  
  .breadcrumb-text {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .top-dock-container {
    width: calc(100% - 1.5rem);
  }
  
  .floating-header {
    width: 98%;
  }
  
  .floating-content {
    padding: 0 0.8rem;
    height: 52px;
  }
  
  .content-area {
    padding: 0.8rem;
    padding-bottom: 160px;
    margin-top: 70px;
  }
  
  .main-title {
    font-size: 1rem;
  }
  
  .status-indicators {
    display: none;
  }
  
  .time-display {
    min-width: 70px;
  }
  
  .time-display .time {
    font-size: 0.8rem;
  }
  
  .breadcrumb {
    padding: 0.6rem 0.8rem;
  }
  
  .breadcrumb-text {
    font-size: 0.75rem;
  }
}

/* Top Dock Styles */
.top-dock-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  pointer-events: none;
  perspective: 1200px;
  perspective-origin: 50% 50%;
  width: calc(100% - 8rem);
  max-width: 1800px;
}

.top-dock-wrapper {
  pointer-events: auto;
}

.top-dock {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 16px 32px;
  position: relative;
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 12px 48px rgba(102, 0, 153, 0.25),
    0 4px 16px rgba(102, 0, 153, 0.15),
    inset 0 2px 8px rgba(255, 255, 255, 0.5),
    inset 0 -4px 12px rgba(102, 0, 153, 0.08);
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.top-dock:hover {
  transform: translateY(-4px) rotateX(5deg);
  box-shadow:
    0 16px 56px rgba(102, 0, 153, 0.35),
    0 8px 24px rgba(102, 0, 153, 0.25),
    inset 0 2px 8px rgba(255, 255, 255, 0.5),
    inset 0 -4px 12px rgba(102, 0, 153, 0.08);
}

.top-dock::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    rgba(255, 255, 255, 0.05) 70%,
    rgba(255, 255, 255, 0.2) 100%
  );
  z-index: 0;
  pointer-events: none;
}

.top-dock::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    rgba(102, 0, 153, 0.4) 0%,
    rgba(255, 255, 255, 0.6) 25%,
    rgba(102, 0, 153, 0.3) 50%,
    rgba(255, 255, 255, 0.4) 75%,
    rgba(255, 102, 0, 0.3) 100%
  );
  z-index: -1;
  filter: blur(1px);
  opacity: 0.6;
  animation: liquidBorder 8s ease-in-out infinite;
}

.top-dock-inner-liquid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
}

.top-dock-liquid-shimmer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 255, 255, 0.15) 60deg,
    transparent 120deg,
    rgba(255, 255, 255, 0.1) 180deg,
    transparent 240deg,
    rgba(255, 255, 255, 0.08) 300deg,
    transparent 360deg
  );
  animation: liquidShimmer 12s linear infinite;
}

.top-dock-liquid-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    to top,
    rgba(102, 0, 153, 0.08) 0%,
    transparent 100%
  );
  animation: liquidWave 6s ease-in-out infinite;
}

.top-dock > * {
  position: relative;
  z-index: 1;
}

.top-dock-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 2rem;
}

.logo-section {
  display: flex;
  align-items: center;
  z-index: 2;
}
</style>