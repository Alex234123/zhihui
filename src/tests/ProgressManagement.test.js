// 进度管理组件测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressManagement from '../components/ProgressManagement.vue';
import dataService from '../services/dataService';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟数据服务
vi.mock('../services/dataService', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    batchGet: vi.fn(),
    generateId: vi.fn(() => 'test-id')
  }
}));

// 模拟Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}));

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

// 模拟navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('ProgressManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('组件初始化', () => {
    it('应该正确加载进度数据和人员数据', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' },
        { id: '2', block: 'B', manager: '李四', stage: '基础施工', progress: 80, targetDate: '2024-11-30', remark: '提前完成' }
      ];
      
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' },
        { id: '2', name: '李四', position: '施工队长' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 验证数据加载
      expect(dataService.batchGet).toHaveBeenCalledWith(['progress', 'personnel']);
      expect(wrapper.vm.progressList).toEqual(mockProgressData);
      expect(wrapper.vm.personnelList).toEqual(mockPersonnelData);
    });

    it('应该正确计算统计数据', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 100, targetDate: '2024-12-31', remark: '已完成' },
        { id: '2', block: 'B', manager: '李四', stage: '主体结构', progress: 50, targetDate: '2024-11-30', remark: '进行中' },
        { id: '3', block: 'C', manager: '王五', stage: '基础施工', progress: 30, targetDate: '2024-10-31', remark: '刚开始' }
      ];

      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' },
        { id: '2', name: '李四', position: '施工队长' },
        { id: '3', name: '王五', position: '技术员' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 验证统计数据计算
      expect(wrapper.vm.totalProgress).toBe(60); // (100 + 50 + 30) / 3
      expect(wrapper.vm.totalBlocks).toBe(3);
      expect(wrapper.vm.completedBlocks).toBe(1);
      expect(wrapper.vm.currentStage).toBe('主体结构');
    });
  });

  describe('添加进度', () => {
    it('应该正确添加新的进度记录', async () => {
      // 模拟数据
      const mockProgressData = [];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 模拟保存数据
      dataService.set.mockResolvedValue(true);

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 打开添加对话框
      await wrapper.vm.openDialog();

      // 填充表单数据
      wrapper.vm.form.block = 'A';
      wrapper.vm.form.manager = '张三';
      wrapper.vm.form.stage = '主体结构';
      wrapper.vm.form.progress = 50;
      wrapper.vm.form.targetDate = '2024-12-31';
      wrapper.vm.form.remark = '测试添加';

      // 提交表单
      await wrapper.vm.submitForm();

      // 验证数据保存
      expect(dataService.set).toHaveBeenCalledWith('progress', expect.arrayContaining([
        expect.objectContaining({
          block: 'A',
          manager: '张三',
          stage: '主体结构',
          progress: 50,
          targetDate: '2024-12-31',
          remark: '测试添加'
        })
      ]));
      expect(ElMessage.success).toHaveBeenCalledWith('添加成功');
    });
  });

  describe('编辑进度', () => {
    it('应该正确编辑现有进度记录', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' }
      ];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' },
        { id: '2', name: '李四', position: '施工队长' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 模拟保存数据
      dataService.set.mockResolvedValue(true);

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 打开编辑对话框
      await wrapper.vm.editProgress(mockProgressData[0]);

      // 修改表单数据
      wrapper.vm.form.progress = 75;
      wrapper.vm.form.remark = '进度更新';

      // 提交表单
      await wrapper.vm.submitForm();

      // 验证数据保存
      expect(dataService.set).toHaveBeenCalledWith('progress', expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          block: 'A',
          manager: '张三',
          stage: '主体结构',
          progress: 75,
          targetDate: '2024-12-31',
          remark: '进度更新'
        })
      ]));
      expect(ElMessage.success).toHaveBeenCalledWith('编辑成功');
    });
  });

  describe('删除进度', () => {
    it('管理员应该可以直接删除进度记录', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' }
      ];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 模拟保存数据
      dataService.set.mockResolvedValue(true);

      // 模拟localStorage
      localStorageMock.setItem('zhihui_site_userid', 'admin');

      // 模拟MessageBox.confirm
      ElMessageBox.confirm.mockResolvedValue();

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 执行删除操作
      await wrapper.vm.deleteProgress(mockProgressData[0]);

      // 验证数据保存
      expect(dataService.set).toHaveBeenCalledWith('progress', []);
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功');
    });

    it('普通用户应该提交删除申请', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' }
      ];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 模拟获取工作流数据
      dataService.get.mockResolvedValue([]);

      // 模拟保存工作流数据
      dataService.set.mockResolvedValue(true);

      // 模拟localStorage
      localStorageMock.setItem('zhihui_site_userid', 'user1');
      localStorageMock.setItem('zhihui_site_username', '普通用户');

      // 模拟MessageBox.confirm
      ElMessageBox.confirm.mockResolvedValue();

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 执行删除操作
      await wrapper.vm.deleteProgress(mockProgressData[0]);

      // 验证工作流创建
      expect(dataService.get).toHaveBeenCalledWith('workflow', []);
      expect(dataService.set).toHaveBeenCalledWith('workflow', expect.arrayContaining([
        expect.objectContaining({
          type: '进度删除申请',
          status: '待处理',
          targetId: '1',
          targetName: '区块 A'
        })
      ]));
      expect(ElMessage.success).toHaveBeenCalledWith('申请提交成功，请等待管理员处理');
    });
  });

  describe('搜索和过滤', () => {
    it('应该根据搜索关键词过滤进度记录', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' },
        { id: '2', block: 'B', manager: '李四', stage: '基础施工', progress: 80, targetDate: '2024-11-30', remark: '提前完成' }
      ];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' },
        { id: '2', name: '李四', position: '施工队长' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 设置搜索关键词
      wrapper.vm.searchQuery = '张三';

      // 等待计算属性更新
      await wrapper.vm.$nextTick();

      // 验证过滤结果
      expect(wrapper.vm.filteredAndSortedProgressList).toHaveLength(1);
      expect(wrapper.vm.filteredAndSortedProgressList[0].manager).toBe('张三');
    });

    it('应该根据施工阶段过滤进度记录', async () => {
      // 模拟数据
      const mockProgressData = [
        { id: '1', block: 'A', manager: '张三', stage: '主体结构', progress: 50, targetDate: '2024-12-31', remark: '正常进行' },
        { id: '2', block: 'B', manager: '李四', stage: '基础施工', progress: 80, targetDate: '2024-11-30', remark: '提前完成' }
      ];
      const mockPersonnelData = [
        { id: '1', name: '张三', position: '项目经理' },
        { id: '2', name: '李四', position: '施工队长' }
      ];

      // 模拟批量获取数据
      dataService.batchGet.mockResolvedValue({
        progress: mockProgressData,
        personnel: mockPersonnelData
      });

      // 挂载组件
      const wrapper = mount(ProgressManagement);

      // 等待组件初始化
      await wrapper.vm.$nextTick();

      // 设置阶段过滤
      wrapper.vm.stageFilter = '主体结构';

      // 等待计算属性更新
      await wrapper.vm.$nextTick();

      // 验证过滤结果
      expect(wrapper.vm.filteredAndSortedProgressList).toHaveLength(1);
      expect(wrapper.vm.filteredAndSortedProgressList[0].stage).toBe('主体结构');
    });
  });
});
