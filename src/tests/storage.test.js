// 存储工具测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setItem, getItem, removeItem, generateId } from '../utils/storage';

// 模拟localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setItem', () => {
    it('should save item to localStorage', () => {
      // Arrange
      const key = 'test';
      const value = { id: 1, name: 'Test' };

      // Act
      const result = setItem(key, value);

      // Assert
      expect(result).toBe(true);
      expect(localStorage.getItem('zhihui_site_test')).toBe(JSON.stringify(value));
    });

    it('should return false when localStorage fails', () => {
      // Arrange
      const key = 'test';
      const value = { id: 1, name: 'Test' };
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Act
      const result = setItem(key, value);

      // Assert
      expect(result).toBe(false);

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getItem', () => {
    it('should get item from localStorage', () => {
      // Arrange
      const key = 'test';
      const value = { id: 1, name: 'Test' };
      localStorage.setItem('zhihui_site_test', JSON.stringify(value));

      // Act
      const result = getItem(key, null);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return defaultValue when item not found', () => {
      // Arrange
      const key = 'test';
      const defaultValue = { id: 0, name: 'Default' };

      // Act
      const result = getItem(key, defaultValue);

      // Assert
      expect(result).toEqual(defaultValue);
    });

    it('should return defaultValue when localStorage fails', () => {
      // Arrange
      const key = 'test';
      const defaultValue = { id: 0, name: 'Default' };
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      // Act
      const result = getItem(key, defaultValue);

      // Assert
      expect(result).toEqual(defaultValue);

      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      // Arrange
      const key = 'test';
      localStorage.setItem('zhihui_site_test', 'test value');

      // Act
      removeItem(key);

      // Assert
      expect(localStorage.getItem('zhihui_site_test')).toBeNull();
    });
  });

  describe('generateId', () => {
    it('should generate a unique id', () => {
      // Act
      const id1 = generateId();
      const id2 = generateId();

      // Assert
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });
});
