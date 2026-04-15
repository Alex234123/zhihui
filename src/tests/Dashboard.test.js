// Dashboard组件测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Dashboard from '../components/Dashboard.vue';
import dataService from '../services/dataService';

// 模拟数据服务
vi.mock('../services/dataService', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    generateId: vi.fn(() => 'test-id')
  }
}));

// 模拟Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mount the component', async () => {
    // Arrange
    dataService.get.mockResolvedValue([]);

    // Act
    const wrapper = mount(Dashboard);

    // Assert
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('数据看板');
  });

  it('should load data on mount', async () => {
    // Arrange
    const mockPersonnel = [{ id: 1, name: 'Test Person' }];
    const mockEquipment = [{ id: 1, name: 'Test Equipment' }];
    const mockSafety = [{ id: 1, inspector: 'Test Inspector' }];
    const mockProgress = [{ id: 1, block: 'A', progress: 50 }];
    const mockMaterials = [{ id: 1, name: 'Test Material' }];

    dataService.get
      .mockResolvedValueOnce(mockPersonnel)
      .mockResolvedValueOnce(mockEquipment)
      .mockResolvedValueOnce(mockSafety)
      .mockResolvedValueOnce(mockProgress)
      .mockResolvedValueOnce(mockMaterials);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(dataService.get).toHaveBeenCalledTimes(5);
    expect(dataService.get).toHaveBeenCalledWith('personnel', []);
    expect(dataService.get).toHaveBeenCalledWith('equipment', []);
    expect(dataService.get).toHaveBeenCalledWith('safety', []);
    expect(dataService.get).toHaveBeenCalledWith('progress', []);
    expect(dataService.get).toHaveBeenCalledWith('materials', []);
  });

  it('should calculate personnel count correctly', async () => {
    // Arrange
    const mockPersonnel = [{ id: 1, name: 'Person 1' }, { id: 2, name: 'Person 2' }];
    dataService.get
      .mockResolvedValueOnce(mockPersonnel)
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([]);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(wrapper.vm.personnelCount).toBe(2);
  });

  it('should calculate equipment count correctly', async () => {
    // Arrange
    const mockEquipment = [{ id: 1, name: 'Equipment 1' }, { id: 2, name: 'Equipment 2' }, { id: 3, name: 'Equipment 3' }];
    dataService.get
      .mockResolvedValue([])
      .mockResolvedValueOnce(mockEquipment)
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([]);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(wrapper.vm.equipmentCount).toBe(3);
  });

  it('should calculate safety count correctly', async () => {
    // Arrange
    const mockSafety = [{ id: 1, inspector: 'Inspector 1' }];
    dataService.get
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValueOnce(mockSafety)
      .mockResolvedValue([])
      .mockResolvedValue([]);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(wrapper.vm.safetyCount).toBe(1);
  });

  it('should calculate material count correctly', async () => {
    // Arrange
    const mockMaterials = [{ id: 1, name: 'Material 1' }, { id: 2, name: 'Material 2' }, { id: 3, name: 'Material 3' }, { id: 4, name: 'Material 4' }];
    dataService.get
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValueOnce(mockMaterials);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(wrapper.vm.materialCount).toBe(4);
  });

  it('should calculate progress count correctly', async () => {
    // Arrange
    const mockProgress = [{ id: 1, progress: 100 }, { id: 2, progress: 50 }, { id: 3, progress: 75 }];
    dataService.get
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValue([])
      .mockResolvedValueOnce(mockProgress)
      .mockResolvedValue([]);

    // Act
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();

    // Assert
    expect(wrapper.vm.progressCount).toBe(75); // (100 + 50 + 75) / 3 = 75
  });
});
