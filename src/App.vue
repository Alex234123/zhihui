<template>
  <div class="app-wrapper" @mousemove="handleMouseMove">
    <!-- Fluid Animation Background -->
    <div class="fluid-bg">
      <div class="fluid-layer layer-1"></div>
      <div class="fluid-layer layer-2"></div>
      <div class="fluid-layer layer-3"></div>
      <div class="fluid-layer layer-4"></div>
    </div>
    
    <!-- Mouse Interaction Effect -->
    <div class="mouse-interaction" :style="{ left: mouseX + 'px', top: mouseY + 'px' }"></div>
    
    <!-- Background Grid -->
    <div class="bg-grid"></div>
    
    <!-- Content with Page Transition -->
    <router-view v-slot="{ Component, route }">
      <transition :name="getTransitionName(route)" mode="out-in" appear>
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { provide, ref } from 'vue'

// 应用启动时记录开始时间
const startTime = Date.now()

// 提供全局开始时间，供SystemInfo组件使用
provide('appStartTime', startTime)

// Mouse interaction
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const getTransitionName = (route) => {
  if (route.path === '/dashboard') {
    return 'login-to-dashboard'
  } else if (route.path === '/login') {
    return 'dashboard-to-login'
  }
  return 'fade'
}
</script>

<style>
/* Import Futuristic Fonts */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');

/* Futuristic Tech Design System - Unified Color Palette */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Unified Color Palette - YTO Brand Design */
:root {
  /* Primary Colors - YTO Brand */
  --future-primary: #660099;
  --future-primary-dark: #550080;
  --future-primary-light: #9933CC;
  --future-secondary: #FF6600;
  --future-secondary-dark: #e65c00;
  --future-accent: #FF6600;
  --future-danger: #F53F3F;
  --future-danger-light: #FF6B6B;
  --future-warning: #FF7D00;
  --future-warning-light: #FFB84D;
  --future-info: #165DFF;
  --future-info-light: #4080FF;
  --future-success: #00B42A;
  --future-success-light: #23C343;
  
  /* Light Backgrounds - YTO Professional Theme */
  --future-bg-primary: #F5F7FA;
  --future-bg-secondary: #FFFFFF;
  --future-bg-tertiary: #E5E6EB;
  --future-bg-card: #FFFFFF;
  --future-bg-hover: #F8F2FF;
  
  /* Text Colors - Professional Readability */
  --future-text-primary: #1D2129;
  --future-text-secondary: #4E5969;
  --future-text-muted: #86909C;
  
  /* Spacing */
  --future-spacing-xs: 4px;
  --future-spacing-sm: 8px;
  --future-spacing-md: 16px;
  --future-spacing-lg: 24px;
  --future-spacing-xl: 32px;
  --future-spacing-2xl: 48px;
  
  /* Typography - YTO Brand */
  --future-font-family: 'Noto Sans SC', 'Microsoft YaHei', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --future-font-family-secondary: 'Noto Sans SC', 'Microsoft YaHei', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Border Radius - YTO Brand */
  --future-radius-sm: 4px;
  --future-radius-md: 6px;
  --future-radius-lg: 8px;
  --future-radius-xl: 12px;
  --future-radius-2xl: 16px;
  --future-radius-full: 9999px;
  
  /* Shadows */
  --future-shadow-sm: 0 1px 3px rgba(102, 126, 234, 0.15);
  --future-shadow-md: 0 4px 8px -2px rgba(102, 126, 234, 0.25), 0 2px 4px -1px rgba(102, 126, 234, 0.15);
  --future-shadow-lg: 0 12px 20px -6px rgba(102, 126, 234, 0.35), 0 4px 8px -4px rgba(102, 126, 234, 0.25);
  --future-shadow-xl: 0 24px 32px -8px rgba(102, 126, 234, 0.45), 0 12px 16px -8px rgba(102, 126, 234, 0.35);
  --future-shadow-glow: 0 0 30px rgba(102, 126, 234, 0.5);
  
  /* Animations - YTO Brand */
  --future-transition-fast: 0.15s;
  --future-transition-normal: 0.2s;
  --future-transition-slow: 0.3s;
  --future-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --future-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --future-easing-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

/* Base Styles */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: var(--future-font-family);
  font-size: 16px;
  line-height: 1.5;
  color: var(--future-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* App Wrapper with YTO Brand Background */
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #660099 0%, #FF6600 100%);
}

/* Subtle Brand Background - YTO Professional */
.fluid-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  will-change: transform;
}

.fluid-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  border-radius: 50%;
  opacity: 0.15;
  will-change: transform, opacity;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.layer-1 {
  background: radial-gradient(circle, rgba(102, 0, 153, 0.15) 0%, transparent 70%);
  animation: fluidMove1 25s infinite;
}

.layer-2 {
  background: radial-gradient(circle, rgba(255, 102, 0, 0.1) 0%, transparent 70%);
  animation: fluidMove2 30s infinite;
}

.layer-3 {
  background: radial-gradient(circle, rgba(102, 0, 153, 0.08) 0%, transparent 70%);
  animation: fluidMove3 35s infinite;
}

.layer-4 {
  background: radial-gradient(circle, rgba(255, 102, 0, 0.08) 0%, transparent 70%);
  animation: fluidMove4 40s infinite;
}

/* Fluid Animation Keyframes - Optimized for Performance */
@keyframes fluidMove1 {
  0% {
    transform: translate(-30%, -30%) scale(1);
  }
  50% {
    transform: translate(10%, -20%) scale(1.1);
  }
  100% {
    transform: translate(-20%, 10%) scale(1);
  }
}

@keyframes fluidMove2 {
  0% {
    transform: translate(20%, -40%) scale(1.1);
  }
  50% {
    transform: translate(-10%, 30%) scale(0.9);
  }
  100% {
    transform: translate(30%, -10%) scale(1.1);
  }
}

@keyframes fluidMove3 {
  0% {
    transform: translate(-20%, 20%) scale(1);
  }
  50% {
    transform: translate(30%, 10%) scale(1.2);
  }
  100% {
    transform: translate(10%, -30%) scale(1);
  }
}

@keyframes fluidMove4 {
  0% {
    transform: translate(40%, 10%) scale(0.9);
  }
  50% {
    transform: translate(-30%, -20%) scale(1.1);
  }
  100% {
    transform: translate(20%, 30%) scale(0.9);
  }
}

/* Mouse Interaction Effect - YTO Brand */
.mouse-interaction {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 0, 153, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease-out;
  will-change: left, top;
  mix-blend-mode: multiply;
}

/* Background Grid - Subtle YTO */
.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(102, 0, 153, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 0, 153, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

/* Ensure content is above background */
#app > * {
  position: relative;
  z-index: 2;
}

/* Professional Scrollbar - YTO */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--future-bg-tertiary);
  border-radius: var(--future-radius-full);
}

::-webkit-scrollbar-thumb {
  background: rgba(102, 0, 153, 0.4);
  border-radius: var(--future-radius-full);
  transition: all var(--future-transition-fast) var(--future-easing);
  border: 2px solid var(--future-bg-tertiary);
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 0, 153, 0.6);
  box-shadow: 0 0 10px rgba(102, 0, 153, 0.3);
}

/* Professional Text Selection - YTO */
::selection {
  background: rgba(102, 0, 153, 0.2);
  color: var(--future-text-primary);
}

/* Professional Focus Outline - YTO */
*:focus {
  outline: 2px solid var(--future-primary);
  outline-offset: 2px;
  box-shadow: 0 0 8px rgba(102, 0, 153, 0.3);
}

/* Futuristic Animations */
@keyframes futurismFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes futurismSlideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes futurismSlideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes futurismSlideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes futurismPulse {
  0%, 100% {
    opacity: 1;
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.8);
  }
  50% {
    opacity: 0.7;
    text-shadow: 0 0 30px rgba(0, 229, 255, 1);
  }
}

@keyframes futurismGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 229, 255, 0.8);
  }
}

@keyframes futurismShine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* ========================================
   Page Transition Animations - 2024 Modern Design
   ======================================== */

/* Fade Transition (Default) */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Login to Dashboard Transition (2024 Modern Design) */
.login-to-dashboard-enter-active,
.login-to-dashboard-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-to-dashboard-leave-from {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.login-to-dashboard-leave-to {
  opacity: 0;
  transform: scale(0.9);
  filter: blur(20px);
}

.login-to-dashboard-enter-from {
  opacity: 0;
  transform: scale(1.1) translateY(20px);
  filter: blur(10px);
}

.login-to-dashboard-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
  filter: blur(0);
}

/* Dashboard to Login Transition */
.dashboard-to-login-enter-active,
.dashboard-to-login-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.dashboard-to-login-leave-from {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

.dashboard-to-login-leave-to {
  opacity: 0;
  transform: translateX(50px);
  filter: blur(15px);
}

.dashboard-to-login-enter-from {
  opacity: 0;
  transform: translateX(-30px);
  filter: blur(5px);
}

.dashboard-to-login-enter-to {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

/* ========================================
   Liquid Glass Effect - Unified System
   ======================================== */

/* Liquid Glass Card Base */
.liquid-glass-card {
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
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.35s ease;
  will-change: transform, box-shadow;
}

.liquid-glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}

.liquid-glass-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 255, 255, 0.12) 45deg,
    transparent 90deg,
    rgba(255, 255, 255, 0.08) 135deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.06) 225deg,
    transparent 270deg,
    rgba(255, 255, 255, 0.1) 315deg,
    transparent 360deg
  );
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: liquidShimmer 8s linear infinite;
}

.liquid-glass-card:hover {
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

.liquid-glass-card:hover::after {
  opacity: 1;
}

/* Liquid Glass Button */
.liquid-glass-button {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: #1D2129;
  font-weight: 500;
  font-family: var(--future-font-family);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
  will-change: transform, box-shadow;
}

.liquid-glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.liquid-glass-button:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow:
    0 8px 24px rgba(102, 0, 153, 0.2),
    0 2px 8px rgba(102, 0, 153, 0.12);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 100%
  );
  border-color: rgba(255, 255, 255, 0.45);
}

.liquid-glass-button:active {
  transform: translateY(-1px) scale(0.99);
}

/* Liquid Glass Primary Button */
.liquid-glass-button-primary {
  background: linear-gradient(
    135deg,
    rgba(102, 0, 153, 0.95) 0%,
    rgba(139, 92, 246, 0.95) 100%
  );
  border: 1px solid rgba(102, 0, 153, 0.5);
  color: #FFFFFF;
  box-shadow:
    0 4px 16px rgba(102, 0, 153, 0.3),
    0 2px 8px rgba(102, 0, 153, 0.2);
}

.liquid-glass-button-primary::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    transparent 50%
  );
}

.liquid-glass-button-primary:hover {
  background: linear-gradient(
    135deg,
    rgba(85, 0, 128, 0.98) 0%,
    rgba(124, 58, 237, 0.98) 100%
  );
  box-shadow:
    0 12px 32px rgba(102, 0, 153, 0.4),
    0 4px 12px rgba(102, 0, 153, 0.25);
  transform: translateY(-4px) scale(1.04);
}

/* Liquid Glass Input */
.liquid-glass-input {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: #1D2129;
  font-family: var(--future-font-family);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.liquid-glass-input:hover {
  border-color: rgba(102, 0, 153, 0.35);
  background: rgba(255, 255, 255, 0.3);
}

.liquid-glass-input:focus {
  outline: none;
  border-color: rgba(102, 0, 153, 0.6);
  box-shadow:
    0 0 0 3px rgba(102, 0, 153, 0.15),
    0 4px 16px rgba(102, 0, 153, 0.12);
  background: rgba(255, 255, 255, 0.35);
}

/* Liquid Glass Container with Perspective */
.liquid-glass-container {
  perspective: 1200px;
  perspective-origin: 50% 30%;
}

/* Liquid Glass Shimmer Animation */
@keyframes liquidShimmer {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Liquid Glass Table */
.liquid-glass-table {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  overflow: hidden;
}

/* Liquid Glass Dialog */
.liquid-glass-dialog {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px !important;
  box-shadow:
    0 20px 60px rgba(102, 0, 153, 0.3),
    0 8px 24px rgba(102, 0, 153, 0.2);
}

/* Liquid Glass Tag */
.liquid-glass-tag {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
}

/* Performance Optimized Classes */
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Browser Compatibility Fallbacks */
@supports not (backdrop-filter: blur(10px)) {
  .liquid-glass-card,
  .liquid-glass-button,
  .liquid-glass-input {
    background: rgba(255, 255, 255, 0.95);
  }
}

@supports not (-webkit-backdrop-filter: blur(10px)) {
  .liquid-glass-card,
  .liquid-glass-button,
  .liquid-glass-input {
    background: rgba(255, 255, 255, 0.95);
  }
}

/* ========================================
   Dialog Customization - Fixed Center, High Z-index
   ======================================== */

/* 核心效果1: 用position: fixed固定定位，不随页面滚动而移动 */
/* 核心效果2: 在浏览器视口内水平+垂直双向居中，窗口缩放始终居中 */
/* 核心效果3: z-index设为9999，全局最顶层，不被任何页面元素遮挡 */

/* 1. Remove modal mask overlay - with highest priority */
body .el-overlay {
  background-color: transparent !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
}

body .el-overlay-dialog {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 2. Ensure dialog stays fixed in center and doesn't scroll - with highest priority */
body > .el-overlay .el-dialog__wrapper,
body .el-dialog__wrapper {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  overflow: hidden !important;
  z-index: 9999 !important;
  transform: none !important;
}

body > .el-overlay .el-dialog,
body .el-dialog {
  margin: 0 !important;
  max-height: 90vh !important;
  overflow: hidden !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  z-index: 9999 !important;
  border-radius: 16px !important;
  right: auto !important;
  bottom: auto !important;
}

/* Ensure dialog body can scroll but dialog container stays fixed */
body .el-dialog__body {
  max-height: calc(90vh - 120px) !important;
  overflow-y: auto !important;
}

/* Fix for dialog positioning - ensure no parent transform affects it */
body .el-dialog__wrapper,
body .el-overlay,
body .el-overlay-dialog {
  transform: none !important;
  will-change: auto;
}

/* Fade in animation for dialog */
@-webkit-keyframes dialog-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes dialog-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

body .el-dialog {
  animation: dialog-fade-in 0.3s ease-out;
}

/* Fallback for browsers that don't support flexbox */
@supports not (display: flex) {
  body .el-dialog__wrapper,
  body .el-overlay,
  body .el-overlay-dialog {
    display: block !important;
  }
  
  body .el-dialog {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
  }
}

/* Ensure custom dialog class doesn't override positioning */
body .custom-dialog {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  transform: none !important;
}

/* Message box and other popup components - same rules */
body .el-message-box__wrapper,
body .el-notification,
body .el-message {
  z-index: 9999 !important;
}

</style>
