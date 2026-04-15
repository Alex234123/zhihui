// 数据服务测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import dataService from '../services/dataService';
import * as storage from '../utils/storage';
import * as api from '../api/api';

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

// 模拟API
vi.mock('../api/api', () => ({
  dataApi: {
    getAllData: vi.fn(),
    saveAllData: vi.fn()
  },
  personnelApi: {
    getList: vi.fn(),
    saveList: vi.fn()
  },
  equipmentApi: {
    getList: vi.fn(),
    saveList: vi.fn()
  },
  safetyApi: {
    getList: vi.fn(),
    saveList: vi.fn()
  },
  progressApi: {
    getList: vi.fn(),
    saveList: vi.fn()
  },
  materialsApi: {
    getList: vi.fn(),
    saveList: vi.fn()
  }
}));

// 模拟storage
vi.mock('../utils/storage', () => ({
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
  generateId: vi.fn(() => 'test-id')
}));

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get method', () => {
    it('should get data from API when useApi is true', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test' }];
      api.personnelApi.getList.mockResolvedValue(mockData);
      storage.setItem.mockReturnValue(true);

      // Act
      const result = await dataService.get('personnel', []);

      // Assert
      expect(api.personnelApi.getList).toHaveBeenCalled();
      expect(storage.setItem).toHaveBeenCalledWith('personnel', mockData);
      expect(result).toEqual(mockData);
    });

    it('should fallback to localStorage when API fails', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test' }];
      api.personnelApi.getList.mockRejectedValue(new Error('API error'));
      storage.getItem.mockReturnValue(mockData);

      // Act
      const result = await dataService.get('personnel', []);

      // Assert
      expect(api.personnelApi.getList).toHaveBeenCalled();
      expect(storage.getItem).toHaveBeenCalledWith('personnel', []);
      expect(result).toEqual(mockData);
    });

    it('should return defaultValue when both API and localStorage fail', async () => {
      // Arrange
      const defaultValue = [];
      api.personnelApi.getList.mockRejectedValue(new Error('API error'));
      storage.getItem.mockReturnValue(null);

      // Act
      const result = await dataService.get('personnel', defaultValue);

      // Assert
      expect(api.personnelApi.getList).toHaveBeenCalled();
      expect(storage.getItem).toHaveBeenCalledWith('personnel', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('set method', () => {
    it('should save data to API when useApi is true', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test' }];
      api.personnelApi.saveList.mockResolvedValue({ success: true });
      storage.setItem.mockReturnValue(true);

      // Act
      const result = await dataService.set('personnel', mockData);

      // Assert
      expect(api.personnelApi.saveList).toHaveBeenCalledWith(mockData);
      expect(storage.setItem).toHaveBeenCalledWith('personnel', mockData);
      expect(result).toBe(true);
    });

    it('should fallback to localStorage when API fails', async () => {
      // Arrange
      const mockData = [{ id: 1, name: 'Test' }];
      api.personnelApi.saveList.mockRejectedValue(new Error('API error'));
      storage.setItem.mockReturnValue(true);

      // Act
      const result = await dataService.set('personnel', mockData);

      // Assert
      expect(api.personnelApi.saveList).toHaveBeenCalledWith(mockData);
      expect(storage.setItem).toHaveBeenCalledWith('personnel', mockData);
      expect(result).toBe(true);
    });
  });

  describe('remove method', () => {
    it('should call storage.removeItem', () => {
      // Act
      dataService.remove('personnel');

      // Assert
      expect(storage.removeItem).toHaveBeenCalledWith('personnel');
    });
  });

  describe('generateId method', () => {
    it('should call storage.generateId', () => {
      // Act
      const result = dataService.generateId();

      // Assert
      expect(storage.generateId).toHaveBeenCalled();
      expect(result).toBe('test-id');
    });
  });
});
