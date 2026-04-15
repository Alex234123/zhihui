import { nextTick } from 'vue'

/**
 * 增强型点击处理器 - 解决DOM元素脱离导致的点击失败问题
 * @param {Function} handler - 实际的点击处理函数
 * @param {Object} options - 配置选项
 * @param {number} options.delay - 点击延迟时间(ms)，默认100ms
 * @param {number} options.retries - 重试次数，默认3次
 * @returns {Function} 增强后的处理函数
 */
export function createStableClickHandler(handler, options = {}) {
  const {
    delay = 100,
    retries = 3,
    checkElement = true
  } = options
  
  let isProcessing = false
  let lastClickTime = 0
  
  return async function stableHandler(event, ...args) {
    // 防止重复点击
    if (isProcessing) {
      console.log('[StableClick] 忽略重复点击')
      return
    }
    
    // 节流：300ms内只允许一次点击
    const now = Date.now()
    if (now - lastClickTime < 300) {
      console.log('[StableClick] 点击过于频繁，已节流')
      return
    }
    
    lastClickTime = now
    isProcessing = true
    
    try {
      // 检查事件目标是否仍然有效
      if (checkElement && event?.target) {
        const target = event.target
        if (!document.contains(target)) {
          console.warn('[StableClick] 目标元素已脱离DOM，尝试查找新元素')
          
          // 尝试通过选择器重新定位元素
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // 使用CSS路径或ID重新查找元素
            const selector = target.id ? `#${target.id}` : 
                            target.className ? `.${target.className.split(' ')[0]}` :
                            null
            
            if (selector) {
              const newTarget = document.querySelector(selector)
              if (newTarget && document.contains(newTarget)) {
                console.log(`[StableClick] 第${i + 1}次重试成功找到元素`)
                break
              }
            }
          }
        }
      }
      
      // 等待Vue更新DOM
      await nextTick()
      
      // 额外延迟确保DOM稳定
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // 执行实际的处理逻辑
      await handler.call(this, event, ...args)
      
    } catch (error) {
      console.error('[StableClick] 处理器执行失败:', error)
      
      // 如果失败，尝试重试
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`[StableClick] 第${i + 1}次重试...`)
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
          await nextTick()
          await handler.call(this, event, ...args)
          console.log(`[StableClick] 第${i + 1}次重试成功`)
          break
        } catch (retryError) {
          console.error(`[StableClick] 第${i + 1}次重试失败:`, retryError)
          if (i === retries - 1) {
            throw retryError
          }
        }
      }
    } finally {
      isProcessing = false
    }
  }
}

/**
 * 安全的弹窗打开函数 - 确保弹窗在DOM稳定后显示
 * @param {Ref<boolean>} visibleRef - 控制弹窗显示的响应式引用
 * @param {Object} options - 配置选项
 * @param {number} options.preDelay - 打开前延迟(ms)
 * @param {boolean} options.scrollToTop - 是否滚动到顶部
 */
export async function safeOpenDialog(visibleRef, options = {}) {
  const {
    preDelay = 50,
    scrollToTop = false
  } = options
  
  try {
    // 等待当前操作完成
    await nextTick()
    
    // 预延迟确保之前的动画/更新完成
    if (preDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, preDelay))
    }
    
    // 再次等待Vue更新
    await nextTick()
    
    // 显示弹窗
    visibleRef.value = true
    
    // 等待弹窗渲染完成
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 可选：滚动到顶部
    if (scrollToTop) {
      const dialogEl = document.querySelector('.el-dialog__wrapper, .el-drawer__wrapper')
      if (dialogEl) {
        dialogEl.scrollTop = 0
      }
    }
    
    console.log('[SafeOpenDialog] 弹窗已安全打开')
    return true
    
  } catch (error) {
    console.error('[SafeOpenDialog] 弹窗打开失败:', error)
    // 即使失败也尝试设置状态
    try {
      visibleRef.value = true
    } catch (e) {
      console.error('[SafeOpenDialog] 强制设置状态也失败:', e)
    }
    return false
  }
}

/**
 * 安全的弹窗关闭函数 - 确保弹窗完全关闭后再执行后续操作
 * @param {Ref<boolean>} visibleRef - 控制弹窗显示的响应式引用
 * @param {Function} onCloseCallback - 关闭后的回调函数
 * @param {Object} options - 配置选项
 */
export async function safeCloseDialog(visibleRef, onCloseCallback = null, options = {}) {
  const {
    postDelay = 150,
    waitForAnimation = true
  } = options
  
  try {
    // 关闭弹窗
    visibleRef.value = false
    
    if (waitForAnimation) {
      // 等待关闭动画完成（Element Plus 默认300ms）
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, postDelay))
    }
    
    // 执行回调
    if (onCloseCallback && typeof onCloseCallback === 'function') {
      await onCloseCallback()
    }
    
    console.log('[SafeCloseDialog] 弹窗已安全关闭')
    
  } catch (error) {
    console.error('[SafeCloseDialog] 弹窗关闭出错:', error)
    // 确保状态被重置
    try {
      visibleRef.value = false
    } catch (e) {}
    
    // 仍然尝试执行回调
    if (onCloseCallback) {
      try {
        await onCloseCallback()
      } catch (callbackError) {
        console.error('[SafeCloseDialog] 回调执行失败:', callbackError)
      }
    }
  }
}

/**
 * DOM元素稳定性检测器
 * @param {HTMLElement} element - 要检测的元素
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} 元素是否稳定
 */
export async function isElementStable(element, options = {}) {
  const {
    checks = 3,
    interval = 100
  } = options
  
  if (!element) return false
  if (!document.contains(element)) return false
  
  // 多次检测以确保稳定
  for (let i = 0; i < checks; i++) {
    await new Promise(resolve => setTimeout(resolve, interval))
    
    if (!document.contains(element)) {
      return false
    }
    
    // 检查元素是否可见
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      continue // 可能还在渲染中
    }
  }
  
  return true
}

/**
 * 创建防抖函数 - 用于频繁触发的事件
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间(ms)
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const context = this
    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(context, args)
  }
}

/**
 * 创建节流函数 - 限制函数执行频率
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制(ms)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle
  
  return function(...args) {
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
