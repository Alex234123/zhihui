// 施工进度管理后端接口定义
// 圆通淮安3号集运中心

/**
 * 施工进度节点数据结构
 */
export interface ProgressNode {
  id: string;                    // 节点唯一ID
  name: string;                  // 节点名称
  children?: ProgressNode[];       // 子节点
  startDate?: string;          // 开始日期 (YYYY-MM-DD)
  endDate?: string;            // 结束日期 (YYYY-MM-DD)
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'delayed';  // 状态
  files?: Array<{               // 文件列表
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  remark?: string;              // 备注
}

/**
 * 区块数据结构
 */
export interface AreaData {
  id: string;                    // 区块ID (A/B/C/D)
  name: string;                // 区块名称
  startDate?: string;          // 区块开始日期
  endDate?: string;            // 区块结束日期
  nodes: ProgressNode[];       // 节点树
}

/**
 * API 接口定义
 */

// 1. 获取单个区块进度数据
// GET /api/progress/:areaId
// 参数: areaId - 区块ID (A/B/C/D)
// 返回: AreaData
export const getAreaProgress = async (areaId: string) => {
  // 实现示例
  // return await fetch(`/api/progress/${areaId}`).then(res => res.json());
};

// 2. 保存单个区块进度数据
// PUT /api/progress/:areaId
// 参数: areaId - 区块ID
// Body: AreaData
// 返回: { success: boolean }
export const saveAreaProgress = async (areaId: string, data: AreaData) => {
  // 实现示例
  // return await fetch(`/api/progress/${areaId}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // }).then(res => res.json());
};

// 3. 获取所有区块进度数据
// GET /api/progress
// 返回: { [key: string]: AreaData }
export const getAllProgress = async () => {
  // 实现示例
  // return await fetch('/api/progress').then(res => res.json());
};

// 4. 保存所有区块进度数据
// PUT /api/progress
// Body: { [key: string]: AreaData }
// 返回: { success: boolean }
export const saveAllProgress = async (data: { [key: string]: AreaData }) => {
  // 实现示例
  // return await fetch('/api/progress', {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // }).then(res => res.json());
};

// 5. 上传文件
// POST /api/progress/upload
// Body: FormData (file)
// 返回: { id: string, url: string, name: string }
export const uploadFile = async (file: File) => {
  // 实现示例
  // const formData = new FormData();
  // formData.append('file', file);
  // return await fetch('/api/progress/upload', {
  //   method: 'POST',
  //   body: formData
  // }).then(res => res.json());
};

// 6. 批量更新节点
// POST /api/progress/batch-update
// Body: {
//   areaId: string;
//   nodeIds: string[];
//   updates: Partial<ProgressNode>;
// }
// 返回: { success: boolean, modifiedCount: number }
export const batchUpdateNodes = async (params: {
  areaId: string;
  nodeIds: string[];
  updates: Partial<ProgressNode>;
}) => {
  // 实现示例
  // return await fetch('/api/progress/batch-update', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(params)
  // }).then(res => res.json());
};

// 7. 复制区块模板
// POST /api/progress/copy-template
// Body: {
//   sourceAreaId: string;
//   targetAreaIds: string[];
// }
// 返回: { success: boolean }
export const copyTemplate = async (params: {
  sourceAreaId: string;
  targetAreaIds: string[];
}) => {
  // 实现示例
  // return await fetch('/api/progress/copy-template', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(params)
  // }).then(res => res.json());
};