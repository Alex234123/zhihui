import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import MainLayout from '../components/MainLayout.vue'

function clearAuthData() {
  localStorage.removeItem('zhihui_site_token')
  localStorage.removeItem('zhihui_site_username')
}

const routes = [
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/', name: 'MainLayout', component: MainLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../components/Dashboard.vue') },
      { path: 'personnel', name: 'PersonnelManagement', component: () => import('../components/PersonnelManagement.vue') },
      { path: 'equipment', name: 'EquipmentManagement', component: () => import('../components/EquipmentManagement.vue') },
      { path: 'safety', name: 'SafetyInspection', component: () => import('../components/SafetyInspection.vue') },
      { path: 'progress', name: 'ProgressManagement', component: () => import('../components/ProgressManagement.vue') },
      { path: 'progress-pro', name: 'ProgressManagementPro', component: () => import('../components/ProgressManagementPro.vue') },
      { path: 'materials', name: 'MaterialManagement', component: () => import('../components/MaterialManagement.vue') },
      { path: 'file-management', name: 'FileManagement', component: () => import('../components/FileManagement.vue') },
      { path: 'quality', name: 'QualityManagement', component: () => import('../components/QualityManagement.vue') },
      { path: 'events', name: 'MajorEvents', component: () => import('../components/MajorEvents.vue') },
      { path: 'feedback', name: 'FeedbackForm', component: () => import('../components/FeedbackForm.vue') },
      { path: 'bug-feedback', name: 'BugFeedback', component: () => import('../components/BugFeedback.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({ history: createWebHistory(), routes })

let isVerifying = false;
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('zhihui_site_token');
  if (to.path === '/login' || to.path === '/') return next();
  if (!token) { clearAuthData(); return next('/login'); }
  if (isVerifying) return next();
  isVerifying = true;
  try {
    const res = await fetch(`${window.location.origin}/api/verify-token`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!data.success || !data.valid) { clearAuthData(); return next('/login'); }
    next();
  } catch(e) { console.warn('[Router] Token验证失败，使用本地缓存判断:', e); const u=localStorage.getItem('zhihui_site_username'); if(u){next();}else{clearAuthData();next('/login');} }
  finally { isVerifying = false; }
});
export default router