<template>
  <nav 
    class="dock-wrapper-container" 
    role="navigation" 
    :aria-label="'主导航菜单'"
  >
    <div
      class="dock-container"
      ref="dockRef"
      :class="{ 'is-collapsed': isCollapsed }"
      @mouseenter="handleDockHover"
      @mouseleave="handleDockLeave"
    >
      <div class="dock-wrapper">
        <ul 
          class="dock" 
          ref="dockItemsRef"
          role="menubar"
          aria-orientation="horizontal"
        >
          <li
            v-for="(item, index) in menuItems"
            :key="item.index"
            class="dock-item"
            :class="{ 'is-active': activeMenu === item.index }"
            role="menuitem"
            :tabindex="activeMenu === item.index ? 0 : -1"
            :aria-current="activeMenu === item.index ? 'page' : undefined"
            :aria-label="item.title"
            @click="handleItemClick(item.index)"
            @mouseenter="handleItemHover(index)"
            @mouseleave="handleItemLeave(index)"
            @keydown.enter="handleItemClick(item.index)"
            @keydown.space.prevent="handleItemClick(item.index)"
            @keydown.left="handleKeyboardNavigation(index, -1)"
            @keydown.right="handleKeyboardNavigation(index, 1)"
            @focus="handleItemFocus(index)"
          >
            <div
              class="dock-icon-wrapper"
              :style="{
                transform: `scale(${itemScales[index] || 1})
                            rotateX(${itemTilt[index] || 0}deg)
                            translateZ(${itemElevation[index] || 0}px)
                            translateY(-${itemElevation[index] || 0}px)`
              }"
              tabindex="-1"
            >
              <div class="dock-icon-glow"></div>
              <el-icon class="dock-icon" :aria-hidden="true">
                <component :is="item.icon" />
              </el-icon>
              <div class="dock-icon-reflection"></div>
            </div>
            <span class="dock-label">{{ item.title }}</span>
          </li>
        </ul>
      </div>
    </div>
    <button
      v-if="isCollapsed"
      class="dock-minibar"
      @mouseenter="handleDockHover"
      :aria-label="'展开菜单'"
      type="button"
    >
      <span class="sr-only">展开导航</span>
    </button>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { DataBoard, User, Tools, Warning, Document, Goods, Monitor, Document as DocumentIcon, Files, CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'dashboard'
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['menu-select'])

const dockRef = ref(null)
const dockItemsRef = ref(null)
const itemScales = ref({})
const itemTilt = ref({})
const itemElevation = ref({})
const showTooltips = ref({})
const isCollapsed = ref(false)
let collapseTimer = null

const menuItems = computed(() => {
  const items = [
    { index: 'dashboard', title: '数据看板', icon: DataBoard },
    { index: 'personnel', title: '人员管理', icon: User },
    { index: 'equipment', title: '设备管理', icon: Tools },
    { index: 'safety', title: '安全巡检', icon: Warning },
    { index: 'progress', title: '进度管理', icon: Document },
    { index: 'materials', title: '材料进场', icon: Goods },
    { index: 'events', title: '工地大事件', icon: Document },
    { index: 'quality', title: '工程质量', icon: CircleCheck },
    { index: 'files', title: '文件管理', icon: Files },
    { index: 'system', title: '系统信息', icon: Monitor },
    { index: 'feedback', title: 'Bug反馈', icon: Warning }
  ]

  if (props.isAdmin) {
    items.push({ index: 'logs', title: '系统日志', icon: DocumentIcon })
  }

  return items
})

const handleItemClick = (index) => {
  emit('menu-select', index)
}

const handleItemHover = (index) => {
  nextTick(() => {
    showTooltips.value[index] = true
    updateScales(index)
  })
}

const handleItemLeave = (index) => {
  showTooltips.value[index] = false
  resetScales()
}

// 键盘导航支持
const handleKeyboardNavigation = (currentIndex, direction) => {
  const items = menuItems.value
  let newIndex = currentIndex + direction
  
  // 循环导航
  if (newIndex < 0) newIndex = items.length - 1
  if (newIndex >= items.length) newIndex = 0
  
  // 聚焦到新的菜单项
  const dockItems = dockItemsRef.value?.querySelectorAll('.dock-item')
  if (dockItems && dockItems[newIndex]) {
    dockItems[newIndex].focus()
  }
}

const handleItemFocus = (index) => {
  updateScales(index)
}

const isMobile = ref(false)
let resizeObserver = null

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const updateScales = (hoveredIndex) => {
  const mobileScaleLimit = isMobile.value ? 1.15 : 1.5
  const mobileTiltLimit = isMobile.value ? -3 : -15
  const mobileElevationLimit = isMobile.value ? 5 : 20
  
  menuItems.value.forEach((_, index) => {
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) {
      itemScales.value[index] = isMobile.value ? 1.15 : 1.5
      itemTilt.value[index] = isMobile.value ? -2 : -15
      itemElevation.value[index] = isMobile.value ? 5 : 20
    } else if (distance === 1) {
      itemScales.value[index] = isMobile.value ? 1.08 : 1.3
      itemTilt.value[index] = isMobile.value ? -1 : -10
      itemElevation.value[index] = isMobile.value ? 2 : 15
    } else if (distance === 2) {
      itemScales.value[index] = isMobile.value ? 1.03 : 1.1
      itemTilt.value[index] = 0
      itemElevation.value[index] = isMobile.value ? 0 : 8
    } else {
      itemScales.value[index] = 1
      itemTilt.value[index] = 0
      itemElevation.value[index] = 0
    }
  })
}

const resetScales = () => {
  menuItems.value.forEach((_, index) => {
    itemScales.value[index] = 1
    itemTilt.value[index] = 0
    itemElevation.value[index] = 0
  })
}

const handleMouseMove = (e) => {
  if (!dockItemsRef.value) return

  const dockItems = dockItemsRef.value.querySelectorAll('.dock-item')
  
  const maxScale = isMobile.value ? 1.15 : 1.5
  const maxTilt = isMobile.value ? -2 : -15
  const maxElevation = isMobile.value ? 5 : 20
  const distanceThreshold = isMobile.value ? 500 : 300

  dockItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) +
      Math.pow(e.clientY - centerY, 2)
    )

    const scale = Math.max(1, Math.min(maxScale, maxScale - (isMobile.value ? distance / distanceThreshold : distance / 300)))
    const tilt = Math.max(maxTilt, Math.min(0, (1 - distance / (isMobile.value ? 400 : 200)) * maxTilt))
    const elevation = Math.max(0, Math.min(maxElevation, isMobile.value ? (maxElevation - distance / 40) : (20 - distance / 15)))

    itemScales.value[index] = scale
    itemTilt.value[index] = distance < 300 ? tilt : 0
    itemElevation.value[index] = distance < 300 ? elevation : 0
  })
}

let mouseMoveListener = null

const handleDockHover = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
    collapseTimer = null
  }
  isCollapsed.value = false
}

const handleDockLeave = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer)
  }
  collapseTimer = setTimeout(() => {
    isCollapsed.value = true
  }, 3000)
}

onMounted(() => {
  mouseMoveListener = handleMouseMove
  document.addEventListener('mousemove', mouseMoveListener)
  
  checkMobile()
  window.addEventListener('resize', checkMobile)

  collapseTimer = setTimeout(() => {
    isCollapsed.value = true
  }, 3000)
})

onUnmounted(() => {
  if (mouseMoveListener) {
    document.removeEventListener('mousemove', mouseMoveListener)
  }
  window.removeEventListener('resize', checkMobile)
  if (collapseTimer) {
    clearTimeout(collapseTimer)
  }
})
</script>

<style scoped>
.dock-wrapper-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.dock-container {
  position: absolute;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  perspective: 1200px;
  perspective-origin: 50% 50%;
  transition: bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dock-container.is-collapsed {
  bottom: calc(-120px + env(safe-area-inset-bottom, 0px));
}

.dock-minibar {
  position: absolute;
  bottom: env(safe-area-inset-bottom, 0px);
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 12px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px 12px 0 0;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 -2px 8px rgba(102, 0, 153, 0.1);
  pointer-events: auto;
  cursor: pointer;
  animation: barPulse 2s ease-in-out infinite;
}

@keyframes barPulse {
  0%, 100% {
    opacity: 0.7;
    box-shadow: 0 -4px 12px rgba(102, 0, 153, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow: 0 -4px 16px rgba(102, 0, 153, 0.4);
  }
}

.dock-wrapper {
  pointer-events: auto;
}

.dock {
  display: flex;
  align-items: flex-end;
  gap: 28px;
  padding: 20px 32px;
  position: relative;
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(102, 0, 153, 0.15),
    0 4px 12px rgba(102, 0, 153, 0.1),
    inset 0 2px 8px rgba(255, 255, 255, 0.4),
    inset 0 -4px 12px rgba(102, 0, 153, 0.05);
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dock:hover {
  transform: translateY(-4px) rotateX(5deg);
  box-shadow:
    0 16px 56px rgba(102, 0, 153, 0.35),
    0 8px 24px rgba(102, 0, 153, 0.25),
    inset 0 2px 8px rgba(255, 255, 255, 0.5),
    inset 0 -4px 12px rgba(102, 0, 153, 0.08);
}

.dock::before {
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

.dock::after {
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

@keyframes liquidBorder {
  0%, 100% {
    opacity: 0.4;
    filter: blur(1px);
  }
  25% {
    opacity: 0.6;
    filter: blur(0.5px);
  }
  50% {
    opacity: 0.5;
    filter: blur(1px);
  }
  75% {
    opacity: 0.7;
    filter: blur(0.5px);
  }
}

.dock-inner-liquid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
}

.dock-liquid-shimmer {
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

@keyframes liquidShimmer {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.dock-liquid-wave {
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

@keyframes liquidWave {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-5px);
  }
}

.dock > * {
  position: relative;
  z-index: 1;
}

.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.dock-label {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
}

.dock-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    rgba(102, 0, 153, 0.9) 0%,
    rgba(139, 92, 246, 0.9) 50%,
    rgba(167, 139, 250, 0.85) 100%
  );
  border-radius: 16px;
  box-shadow:
    0 6px 20px rgba(102, 0, 153, 0.4),
    0 2px 8px rgba(102, 0, 153, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.dock-icon-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.15) 30%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 2;
}

.dock-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(167, 139, 250, 0.3) 30%,
    transparent 70%
  );
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.6;
  }
}

.dock-icon-reflection {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 100%
  );
  pointer-events: none;
  z-index: 3;
  border-radius: 0 0 16px 16px;
}

.dock-icon {
  font-size: 28px;
  color: #FFFFFF;
  z-index: 1;
  position: relative;
}

.dock-item.is-active .dock-icon-wrapper {
  background: linear-gradient(
    145deg,
    rgba(255, 102, 0, 0.95) 0%,
    rgba(255, 138, 61, 0.95) 50%,
    rgba(255, 168, 100, 0.9) 100%
  );
  box-shadow:
    0 8px 24px rgba(255, 102, 0, 0.5),
    0 4px 12px rgba(255, 102, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.dock-item.is-active .dock-icon-wrapper::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #FF6600;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(255, 102, 0, 0.8);
  animation: activeDotPulse 2s ease-in-out infinite;
}

@keyframes activeDotPulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    box-shadow: 0 0 12px rgba(255, 102, 0, 0.8);
  }
  50% {
    transform: translateX(-50%) scale(1.2);
    box-shadow: 0 0 20px rgba(255, 102, 0, 1);
  }
}

.dock-item:hover .dock-icon-wrapper {
  box-shadow:
    0 10px 30px rgba(102, 0, 153, 0.5),
    0 4px 16px rgba(102, 0, 153, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.dock-item:hover .dock-icon-glow {
  opacity: 1;
}

.dock-item.is-active:hover .dock-icon-wrapper {
  box-shadow:
    0 12px 36px rgba(255, 102, 0, 0.6),
    0 6px 20px rgba(255, 102, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.dock-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: tooltipFadeIn 0.2s ease-out;
  pointer-events: none;
}

.dock-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 768px) {
  .dock-container {
    bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .dock {
    padding: 12px 16px;
    gap: 12px;
    border-radius: 20px;
  }

  .dock-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .dock-icon {
    font-size: 24px;
  }

  .dock-label {
    font-size: 11px;
    margin-top: 6px;
  }

  .dock-item {
    min-width: 60px;
  }

  .dock-tooltip {
    display: none;
  }
  
  /* 移动端优化：限制Hover放大幅度 */
  .dock:hover {
    transform: none;
  }
  
  .dock-item:hover .dock-icon-wrapper {
    box-shadow:
      0 8px 24px rgba(102, 0, 153, 0.4),
      0 4px 12px rgba(102, 0, 153, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 480px) {
  .dock {
    padding: 10px 12px;
    gap: 8px;
    border-radius: 16px;
  }

  .dock-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .dock-icon {
    font-size: 20px;
  }

  .dock-label {
    font-size: 10px;
    margin-top: 4px;
  }

  .dock-item {
    min-width: 50px;
  }
  
  /* 小屏幕优化：完全禁用3D效果 */
  .dock:hover {
    transform: none !important;
  }
  
  /* 减小图标阴影避免视觉膨胀 */
  .dock-item:hover .dock-icon-wrapper,
  .dock-item.is-active:hover .dock-icon-wrapper {
    box-shadow:
      0 4px 16px rgba(102, 0, 153, 0.35),
      0 2px 8px rgba(102, 0, 153, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }
  
  /* 禁用active状态下的额外动画 */
  .dock-item.is-active .dock-icon-wrapper::after {
    animation: none;
  }
}

/* 无障碍增强 - 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* 键盘焦点可见性 */
.dock-item:focus {
  outline: 2px solid #FF6600;
  outline-offset: 4px;
  border-radius: 18px;
}

.dock-item:focus-visible {
  outline: 2px solid #FF6600;
  outline-offset: 4px;
  border-radius: 18px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .dock-item {
    border: 2px solid currentColor;
  }
  
  .dock-item.is-active {
    border-color: #FF6600;
    border-width: 3px;
  }
  
  .dock-label {
    text-decoration: underline;
  }
}

/* 减少动画（尊重用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .dock-container,
  .dock,
  .dock-item,
  .dock-icon-wrapper,
  .dock-liquid-shimmer,
  .dock-liquid-wave,
  .dock-icon-glow,
  .dock-minibar {
    animation: none !important;
    transition: none !important;
  }
}
</style>
