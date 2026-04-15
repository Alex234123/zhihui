// 类型定义文件

// 人员类型
export const PersonnelType = {
  id: String,
  name: String,
  gender: String,
  age: Number,
  position: String,
  team: String,
  phone: String,
  entryDate: String,
};

// 设备类型
export const EquipmentType = {
  id: String,
  name: String,
  type: String,
  model: String,
  status: String,
  operator: String,
  purchaseDate: String,
};

// 安全巡检类型
export const SafetyType = {
  id: String,
  inspector: String,
  area: String,
  status: String,
  issue: String,
  inspectionDate: String,
};

// 进度管理类型
export const ProgressType = {
  id: String,
  block: String,
  manager: String,
  stage: String,
  progress: Number,
  targetDate: String,
  remark: String,
};

// 材料管理类型
export const MaterialType = {
  id: String,
  name: String,
  category: String,
  spec: String,
  unit: String,
  quantity: Number,
  supplier: String,
  entryDate: String,
  keeper: String,
};

// 数据类型验证函数
export function validateType(data, type) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  for (const [key, valueType] of Object.entries(type)) {
    if (data[key] !== undefined && typeof data[key] !== valueType.name.toLowerCase()) {
      return false;
    }
  }
  
  return true;
}
