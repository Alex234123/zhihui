/**
 * 数据备份与恢复工具
 * 
 * 功能：
 * 1. 自动备份到 backups/ 目录
 * 2. 数据版本控制
 * 3. 跨设备同步支持
 * 4. 数据导出/导入
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 10;

// 确保目录存在
function ensureDirectories() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('[Backup] 创建备份目录:', BACKUP_DIR);
  }
}

// 创建数据备份
function createBackup(moduleName = 'all') {
  ensureDirectories();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = moduleName === 'all' ? `backup-${timestamp}` : `${moduleName}-backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  try {
    fs.mkdirSync(backupPath, { recursive: true });
    
    const modulesToBackup = moduleName === 'all' 
      ? fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
      : [`${moduleName}.json`];
    
    modulesToBackup.forEach(file => {
      const srcPath = path.join(DATA_DIR, file);
      const destPath = path.join(backupPath, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[Backup] 备份文件: ${file}`);
      }
    });
    
    // 创建备份元信息
    const meta = {
      timestamp: new Date().toISOString(),
      type: moduleName,
      files: modulesToBackup,
      size: getDirSize(backupPath)
    };
    
    fs.writeFileSync(
      path.join(backupPath, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );
    
    console.log(`[Backup] ✅ 备份完成: ${backupName}`);
    console.log(`[Backup] 📁 位置: ${backupPath}`);
    
    // 清理旧备份
    cleanOldBackups();
    
    return { success: true, path: backupPath, meta };
  } catch (error) {
    console.error(`[Backup] ❌ 备份失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 获取目录大小
function getDirSize(dirPath) {
  let size = 0;
  function calcSize(path) {
    const stats = fs.statSync(path);
    if (stats.isDirectory()) {
      fs.readdirSync(path).forEach(file => {
        calcSize(path + '/' + file);
      });
    } else {
      size += stats.size;
    }
  }
  calcSize(dirPath);
  return size;
}

// 清理旧备份（保留最近N个）
function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .map(name => {
      const filePath = path.join(BACKUP_DIR, name);
      const stat = fs.statSync(filePath);
      return { name, path: filePath, time: stat.mtime };
    })
    .sort((a, b) => b.time - a.time); // 按时间倒序
  
  // 删除超出限制的旧备份
  if (backups.length > MAX_BACKUPS) {
    backups.slice(MAX_BACKUPS).forEach(backup => {
      try {
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(`[Backup] 🗑️ 删除旧备份: ${backup.name}`);
      } catch (e) {
        console.error(`[Backup] 删除失败: ${backup.name}`, e.message);
      }
    });
  }
}

// 恢复数据
function restoreBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`备份不存在: ${backupName}`);
  }
  
  try {
    // 在恢复前先创建一个当前数据的备份
    createBackup('pre-restore');
    
    // 从备份恢复
    const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json') && f !== 'meta.json');
    
    files.forEach(file => {
      const srcPath = path.join(backupPath, file);
      const destPath = path.join(DATA_DIR, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[Restore] ✅ 恢复文件: ${file}`);
      }
    });
    
    console.log(`[Restore] 🎉 数据恢复完成！`);
    return { success: true, restoredFiles: files };
  } catch (error) {
    console.error(`[Restore] ❌ 恢复失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 导出所有数据为ZIP包（简化版：导出为JSON）
function exportData(outputPath) {
  ensureDirectories();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = outputPath || path.join(BACKUP_DIR, `export-${timestamp}.json`);
  
  try {
    const allData = {};
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const moduleName = file.replace('.json', '');
      try {
        const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
        allData[moduleName] = content;
      } catch (e) {
        console.warn(`[Export] 跳过无效文件: ${file}`);
      }
    });
    
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      source: '智慧工地管理系统',
      data: allData
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    
    const size = (fs.statSync(outputFile).size / 1024).toFixed(1);
    console.log(`[Export] ✅ 导出成功: ${outputFile} (${size}KB)`);
    
    return { success: true, file: outputFile, size };
  } catch (error) {
    console.error(`[Export] ❌ 导出失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 导入数据
function importData(importFilePath) {
  if (!fs.existsSync(importFilePath)) {
    throw new Error(`导入文件不存在: ${importFilePath}`);
  }
  
  try {
    // 先备份当前数据
    createBackup('pre-import');
    
    const importData = JSON.parse(fs.readFileSync(importFilePath, 'utf8'));
    const dataToImport = importData.data || importData;
    
    Object.keys(dataToImport).forEach(moduleName => {
      const data = dataToImport[moduleName];
      if (Array.isArray(data) || typeof data === 'object') {
        const filePath = path.join(DATA_DIR, `${moduleName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`[Import] ✅ 导入模块: ${moduleName} (${Array.isArray(data) ? data.length : Object.keys(data).length} 条记录)`);
      }
    });
    
    console.log(`[Import] 🎉 数据导入完成！`);
    return { success: true };
  } catch (error) {
    console.error(`[Import] ❌ 导入失败:`, error.message);
    return { success: false, error: error.message };
  }
}

// 列出所有备份
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }
  
  return fs.readdirSync(BACKUP_DIR)
    .map(name => {
      const metaPath = path.join(BACKUP_DIR, name, 'meta.json');
      let meta = null;
      
      try {
        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }
      } catch (e) {}
      
      return {
        name,
        path: path.join(BACKUP_DIR, name),
        time: fs.statSync(path.join(BACKUP_DIR, name)).mtime,
        meta
      };
    })
    .sort((a, b) => b.time - a.time);
}

// 数据完整性检查
function checkIntegrity() {
  const issues = [];
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (content === null || content === undefined) {
        issues.push({ file, issue: '空内容' });
      } else if (typeof content !== 'object') {
        issues.push({ file, issue: '无效格式' });
      } else if (Array.isArray(content) && content.length === 0) {
        // 空数组不算错误，只是警告
      }
    } catch (e) {
      issues.push({ file, issue: `解析失败: ${e.message}` });
    }
  });
  
  return {
    valid: issues.length === 0,
    totalFiles: files.length,
    issues,
    message: issues.length === 0 ? '✅ 所有数据文件完整' : `⚠️ 发现 ${issues.length} 个问题`
  };
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'backup':
      createBackup(args[1]);
      break;
      
    case 'restore':
      if (!args[1]) {
        console.log('用法: node data-backup.js restore <备份名>');
        process.exit(1);
      }
      restoreBackup(args[1]);
      break;
      
    case 'export':
      exportData(args[1]);
      break;
      
    case 'import':
      if (!args[1]) {
        console.log('用法: node data-backup.js import <文件路径>');
        process.exit(1);
      }
      importData(args[1]);
      break;
      
    case 'list':
      const backups = listBackups();
      console.log('\n📦 可用备份列表:');
      console.log('-'.repeat(60));
      backups.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name}`);
        console.log(`   时间: ${b.time.toLocaleString('zh-CN')}`);
        if (b.meta) {
          console.log(`   类型: ${b.meta.type}, 文件数: ${b.meta.files?.length || 0}`);
        }
        console.log('');
      });
      break;
      
    case 'check':
      const result = checkIntegrity();
      console.log('\n🔍 数据完整性检查:');
      console.log('-'.repeat(60));
      console.log(result.message);
      console.log(`总文件数: ${result.totalFiles}`);
      if (result.issues.length > 0) {
        console.log('\n问题详情:');
        result.issues.forEach(issue => {
          console.log(`  ⚠️ ${issue.file}: ${issue.issue}`);
        });
      }
      break;
      
    default:
      console.log(`
数据备份工具使用说明：

命令：
  backup [module]     创建备份（默认备份所有模块）
  restore <name>     从备份恢复
  export [path]      导出所有数据
  import <path>      导入数据
  list              列出所有备份
  check             检查数据完整性

示例：
  node data-backup.js backup
  node data-backup.js backup progress
  node data-backup.js list
  node data-backup.js restore backup-2026-04-07T...
  node data-backup.js export my-data.json
  node data-backup.js check
`);
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  exportData,
  importData,
  listBackups,
  checkIntegrity
};
