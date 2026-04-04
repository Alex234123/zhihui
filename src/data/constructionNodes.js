export const constructionNodes = [
  {
    id: 'stage-1', name: '基础工程', progress: 0,
    subStages: [
      { id: 'sub-1-1', name: '场地平整', tasks: [{ id: 'task-1-1-1', name: '场地清理', status: 'not_started', startDate: null, endDate: null, files: [], remark: '', progress: 0 }] },
      { id: 'sub-1-2', name: '土方开挖', tasks: [{ id: 'task-1-2-1', name: '基坑开挖', status: 'not_started', startDate: null, endDate: null, files: [], remark: '', progress: 0 }, { id: 'task-1-2-2', name: '边坡支护', status: 'not_started', startDate: null, endDate: null, files: [], remark: '', progress: 0 }] }
    ]
  },
  { id: 'stage-2', name: '主体结构', progress: 0, subStages: [] },
  { id: 'stage-3', name: '装饰装修', progress: 0, subStages: [] },
  { id: 'stage-4', name: '机电安装', progress: 0, subStages: [] },
  { id: 'stage-5', name: '室外工程', progress: 0, subStages: [] },
  { id: 'stage-6', name: '竣工验收', progress: 0, subStages: [] }
];

export function getLeafNodes(nodes) { const leaves = []; function traverse(n) { if (!n.tasks || n.tasks.length === 0) { if (n.id) leaves.push({ ...n }); return; } n.tasks?.forEach(t => traverse(t)); } nodes.forEach(traverse); return leaves; }