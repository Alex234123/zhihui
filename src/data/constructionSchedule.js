export const BLOCK_NAMES = ['A区','B区','C区','D区'];

export function initializeBlockData() {
  const blocks = {};
  BLOCK_NAMES.forEach(name => { blocks[name] = { areaId: `area-${name}`, block: name, manager: '', phone: '', stages: JSON.parse(JSON.stringify(constructionNodes)), totalTasks: 0, completedTasks: 0, progress: 0, estimatedCompletionDate: null }; });
  return blocks;
}

export function convertToDashboardProgress(areas) {
  return Object.values(areas).map(area => ({ block: area.block, progress: area.progress || 0, manager: area.manager || '', totalTasks: area.totalTasks || 0, completedTasks: area.completedTasks || 0 }));
}