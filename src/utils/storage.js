const STORAGE_KEY_PREFIX = 'zhihui_site_';

export function setItem(key, value) {
  try { localStorage.setItem(STORAGE_KEY_PREFIX + key, typeof value === 'string' ? value : JSON.stringify(value)); return true; } catch(e) { console.error('[Storage] Set error:', e); return false; }
}

export function getItem(key, defaultValue = null) {
  try { const val = localStorage.getItem(STORAGE_KEY_PREFIX + key); if (val === null || val === undefined) return defaultValue; try { return JSON.parse(val); } catch { return val; } } catch(e) { console.error('[Storage] Get error:', e); return defaultValue; }
}

export function removeItem(key) { try { localStorage.removeItem(STORAGE_KEY_PREFIX + key); } catch(e) { console.error('[Storage] Remove error:', e); } }

export function clearAll() { Object.keys(localStorage).filter(k=>k.startsWith(STORAGE_KEY_PREFIX)).forEach(k=>localStorage.removeItem(k)); }

export function generateId(prefix = '') { return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2,9); }