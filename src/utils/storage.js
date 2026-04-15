const STORAGE_PREFIX = 'zhihui_site_'

export function setItem(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error('存储失败:', e)
    return false
  }
}

export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch (e) {
    console.error('读取失败:', e)
    return defaultValue
  }
}

export function removeItem(key) {
  localStorage.removeItem(STORAGE_PREFIX + key)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
