const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

const app = express();

function validateInput(req, res, next) {
  if (req.path === '/api/upload' || req.path.startsWith('/api/upload/')) return next();
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
      }
    }
  }
  next();
}

async function hashPassword(p) { return await bcrypt.hash(p, SALT_ROUNDS); }
async function verifyPassword(p, h) { try { return await bcrypt.compare(p, h); } catch(e) { return p === h; } }
async function migratePasswordIfPlaintext(user) {
  if (user.password && !user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
    user.password = await hashPassword(user.password);
    const users = readModuleData('users'); const i = users.findIndex(u => u.phone === user.phone); if (i !== -1) { users[i] = user; saveModuleData('users', users); }
  }
  return user;
}

const activeTokens = new Map();
const TOKEN_EXPIRE_TIME = 24 * 60 * 60 * 1000;
function generateToken(uid, name) { const t = crypto.randomBytes(32).toString('hex'); activeTokens.set(t, { userId: uid, username: name, expires: Date.now() + TOKEN_EXPIRE_TIME }); return t; }
function verifyToken(t) { const d = activeTokens.get(t); if (!d || Date.now() > d.expires) { activeTokens.delete(t); return null; } return d; }
function authMiddleware(req, res, next) {
  const h = req.headers.authorization; if (!h?.startsWith('Bearer ')) return res.status(401).json({ success:false,message:'未登录或登录已过期' });
  const td = verifyToken(h.substring(7)); if (!td) return res.status(401).json({ success:false,message:'未登录或登录已过期' });
  req.user = td; next();
}

const PROJECT_DIR = __dirname, DATA_DIR = path.join(PROJECT_DIR,'data'), UPLOADS_DIR = path.join(PROJECT_DIR,'uploads'), STATIC_DIR = path.join(PROJECT_DIR,'dist');
const PORT = process.env.PORT||3001, HOST = process.env.HOST||'0.0.0.0';
const DATA_MODULES = ['personnel','equipment','safety','progress','progressDetail','materials','feedback','quality','materialUsage','excellentPhotos','problemPhotos','blockPhotos','events','workflowApplications','logs','users','workflow','fileManagement','constructionSchedulePro'];
const FILE_CATEGORIES = ['design','cost','supervisor','highlight','images','documents','others'];

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  DATA_MODULES.forEach(m => { const f=path.join(DATA_DIR,`${m}.json`); if(!fs.existsSync(f)) fs.writeFileSync(f,JSON.stringify([],null,2)); });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR,{recursive:true});
  FILE_CATEGORIES.forEach(c => { const d=path.join(UPLOADS_DIR,c); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); });
}
ensureDirectories();

app.use(cors()); app.use(express.json({limit:'100mb'})); app.use(express.urlencoded({extended:true,limit:'100mb'}));
app.use(express.static(STATIC_DIR)); app.use('/uploads',express.static(UPLOADS_DIR));

function readModuleData(m) { try { const f=path.join(DATA_DIR,`${m}.json`); return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):[]; } catch(e){console.error(`Read ${m}:`,e);return[];} }
function saveModuleData(m,d) { try{fs.writeFileSync(path.join(DATA_DIR,`${m}.json`),JSON.stringify(d,null,2));return true;}catch(e){console.error(`Save ${m}:`,e);return false;} }
function readAllData(){const d={};DATA_MODULES.forEach(m=>d[m]=readModuleData(m));return d;}
function saveAllData(d){let s=true;DATA_MODULES.forEach(m=>{if(d[m]!==undefined){if(!saveModuleData(m,d[m]))s=false;}});return s;}
function getFileCategory(fn){const e=path.extname(fn).toLowerCase();if(['.jpg','.jpeg','.png','.gif','.bmp','.webp','.svg'].includes(e))return 'images';if(['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt','.dwg','.dxf'].includes(e))return'documents';return'others';}

app.post('/api/login',validateInput,async(req,res)=>{
  const{phone,password}=req.body;if(!phone||!password)return res.status(400).json({success:false,message:'请提供用户名和密码'});
  if(phone!=='admin'&&!/^1[3-9]\d{9}$/.test(phone))return res.status(400).json({success:false,message:'手机号格式不正确'});
  try{
    let u=null;if(phone==='admin'&&password==='admin'){u={id:'admin',name:'管理员',phone:'admin',password:'admin'};}else{const us=readModuleData('users');const fu=us.find(x=>x.phone===phone);if(fu){await migratePasswordIfPlaintext(fu);if(await verifyPassword(password,fu.password)){u=fu;if(!u.id)u.id=u.phone||`user_${Date.now()}`;}}}
    if(u){const t=generateToken(u.id,u.name);res.json({success:true,message:'登录成功',token:t,user:{id:u.id,name:u.name}});}else{res.status(401).json({success:false,message:'用户名或密码错误'});}
  }catch(e){console.error('Login:',e);res.status(500).json({success:false,message:'服务器内部错误'});}
});
app.post('/api/logout',(req,res)=>{if(req.headers.authorization?.startsWith('Bearer '))activeTokens.delete(req.headers.authorization.substring(7));res.json({success:true,message:'登出成功'});});
app.post('/api/reset-password',validateInput,async(req,res)=>{
  const{phone,np}=req.body;if(!phone||!np)return res.status(400).json({success:false,message:'请提供手机号和新密码'});
  if(!/^1[3-9]\d{9}$/.test(phone))return res.status(400).json({success:false,message:'手机号格式不正确'});
  if(np.length<6)return res.status(400).json({success:false,message:'密码长度至少6个字符'});
  if(!/(?=.*[a-zA-Z])(?=.*\d)/.test(np))return res.status(400).json({success:false,message:'密码需同时包含字母和数字'});
  try{const us=readModuleData('users');const i=us.findIndex(u=>u.phone===phone);if(i<0)return res.status(404).json({success:false,message:'该手机号未注册'});
    us[i].password=await hashPassword(np);us[i].passwordChangedAt=new Date().toISOString();saveModuleData('users',us);res.json({success:true,message:'密码重置成功'});}catch(e){console.error('Reset:',e);res.status(500).json({success:false,message:'服务器内部错误'});}
});
app.get('/api/current-user',authMiddleware,(req,res)=>res.json({success:true,user:req.user}));
app.get('/api/data',authMiddleware,(req,res)=>res.json(readAllData()));
app.post('/api/data',authMiddleware,(req,res)=>res.json(saveAllData(req.body)?{success:true,message:'数据保存成功'}:{status:500,success:false,message:'数据保存失败'}));
function createAPI(m){app.get(`/api/${m}`,authMiddleware,(req,res)=>res.json(readModuleData(m)));app.post(`/api/${m}`,authMiddleware,(req,res)=>res.json(saveModuleData(m,req.body)?{success:true,`${m}数据保存成功`}:{status:500,success:false,`${m}数据保存失败`}));}
DATA_MODULES.forEach(createAPI);
app.post('/api/logs/add',authMiddleware,(req,res)=>{const l=readModuleData('logs');l.unshift(req.body);saveModuleData('logs',l);res.json({success:true,message:'日志添加成功'});});

app.post('/api/upload',authMiddleware,(req,res)=>{
  try{const{image,filename,category}=req.body;if(!image||!filename)return res.status(400).json({success:false,message:'缺少必要参数'});
    const bl=image.includes(';base64,')?image.split(';base64,')[1].length:image.length;const sz=Math.round(bl*0.75);if(sz>50*1024*1024)return res.status(413).json({success:false,message:`文件过大（约${Math.round(sz/1024/1024)}MB）`});
    let td=(category&&FILE_CATEGORIES.includes(category))?path.join(UPLOADS_DIR,category):path.join(UPLOADS_DIR,getFileCategory(filename));if(!fs.existsSync(td))fs.mkdirSync(td,{recursive:true});
    let buf=image.includes(';base64,')?Buffer.from(image.split(';base64,')[1],'base64'):Buffer.from(image,'base64');
    const ext=path.extname(filename),bn=path.basename(filename,ext),uf=`${bn}_${Date.now()}_${Math.random().toString(36).substr(2,8)}${ext}`;fs.writeFileSync(path.join(td,uf),buf);
    const rd=path.relative(UPLOADS_DIR,td);res.json({success:true,message:'文件上传成功',filename:uf,originalFilename:filename,url:`/uploads/${rd}/${uf}`.replace(/\\/g,'/'),size:buf.length});
  }catch(e){console.error('Upload:',e);res.status(500).json({success:false,message:'文件上传失败:'+e.message});}
});
app.delete('/api/upload/:cat/:fn',authMiddleware,(req,res)=>{try{const fp=path.join(UPLOADS_DIR,req.params.cat,req.params.fn);if(fs.existsSync(fp)){fs.unlinkSync(fp);res.json({success:true,message:'文件删除成功'});}else res.status(404).json({success:false,message:'文件不存在'});}catch(e){res.status(500).json({success:false,message:'文件删除失败'});}});
app.delete('/api/upload/:fn',authMiddleware,(req,res)=>{try{let f=false;for(const c of FILE_CATEGORIES){const fp=path.join(UPLOADS_DIR,c,req.params.fn);if(fs.existsSync(fp)){fs.unlinkSync(fp);f=true;break;}}if(!f){const fp=path.join(UPLOADS_DIR,req.params.fn);if(fs.existsSync(fp)){fs.unlinkSync(fp);f=true;}}f?res.json({success:true,message:'文件删除成功'}):res.status(404).json({success:false,message:'文件不存在'});}catch(e){res.status(500).json({success:false,message:'文件删除失败'});}});
app.get('/api/uploads',authMiddleware,(req,res)=>{const fl=[];FILE_CATEGORIES.forEach(c=>{const d=path.join(UPLOADS_DIR,c);if(fs.existsSync(d))fs.readdirSync(d).forEach(f=>{const s=fs.statSync(path.join(d,f));if(s.isFile())fl.push({filename:f,category:c,size:s.size,createdAt:s.birthtime,url:`/uploads/${c}/${f}`});});});res.json(fl);});
app.post('/api/check-files-exist',authMiddleware,(req,res)=>{const{urls}=req.body;if(!Array.isArray(urls))return res.status(400).json({success:false,message:'请提供URL数组'});const r={};urls.forEach(u=>{if(!u||typeof u!=='string'){r[u]={exists:false};return;}r[u]={exists:fs.existsSync(u.startsWith('/uploads/')?path.join(UPLOADS_DIR,u.substring('/uploads/'.length)):path.join(UPLOADS_DIR,u))};});res.json({success:true,results:r});});
app.get('/api/health',(req,res)=>res.json({status:'healthy',timestamp:new Date().toISOString(),uptime:process.uptime(),version:'1.0.0'}));
app.get('/api/verify-token',(req,res)=>{const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return res.status(401).json({success:false,valid:false,message:'未提供Token'});const td=verifyToken(h.substring(7));td?res.json({success:true,valid:true,user:td,expiresIn:Math.max(0,td.expires-Date.now())}):res.status(401).json({success:false,valid:false,message:'Token无效或已过期'});});
app.get('*',(req,res)=>{const ip=path.join(STATIC_DIR,'index.html');fs.existsSync(ip)?res.sendFile(ip):res.status(404).send('Not Found');});
app.listen(PORT,HOST,()=>{console.log(`=================================`);console.log(`服务器已启动！端口:${PORT}`);console.log(`本地访问:http://localhost:${PORT}`);console.log(`=================================`);});