import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import Login from '../components/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: MainLayout,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoggedIn = localStorage.getItem('zhihui_site_logged_in') === 'true'
  const token = localStorage.getItem('zhihui_site_token')

  console.log('路由守卫:', {
    to: to.path,
    from: from.path,
    requiresAuth,
    isLoggedIn,
    hasToken: !!token
  })

  // 检查localStorage中的登录状态
  console.log('localStorage登录状态:', {
    loggedIn: localStorage.getItem('zhihui_site_logged_in'),
    username: localStorage.getItem('zhihui_site_username'),
    userid: localStorage.getItem('zhihui_site_userid')
  })

  if (requiresAuth) {
    // 如果既没有登录状态也没有token，跳转到登录页
    if (!isLoggedIn && !token) {
      console.log('未登录且无Token，跳转到登录页')
      clearAuthData()
      return '/login'
    }

    // 如果有token但登录状态不一致，尝试用token恢复登录状态
    if (token && !isLoggedIn) {
      console.log('检测到Token但无登录状态，尝试恢复会话')
      // 继续执行下面的token验证逻辑
    }

    try {
      // 验证 Token 有效性（调用后端API）
      const apiBaseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3001'}`;
      const response = await fetch(`${apiBaseUrl}/api/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5秒超时
      })

      // 检查响应类型是否为 JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Token验证接口返回非JSON格式，可能API不存在或返回HTML');
        
        // 如果是404或其他错误页面，说明后端API可能未部署
        if (response.status === 404 || !response.ok) {
          console.warn('Token验证API未找到(404)，使用本地验证模式');
          // 本地验证：检查token格式和过期时间
          if (validateTokenLocally(token)) {
            console.log('本地Token验证通过');
            return true;
          } else {
            console.warn('本地Token验证失败');
            clearAuthData();
            return '/login';
          }
        }
        
        throw new Error(`Invalid response format: ${contentType}`);
      }

      if (!response.ok) {
        console.warn(`Token验证失败(HTTP ${response.status})，清除登录状态`);
        clearAuthData();
        return '/login';
      }

      const result = await response.json();

      if (!result.valid) {
        console.warn('Token已过期或无效');
        clearAuthData();
        return '/login';
      }

      // Token验证通过，恢复登录状态
      if (!isLoggedIn && result.user) {
        console.log('恢复登录状态:', result.user);
        localStorage.setItem('zhihui_site_logged_in', 'true');
        if (result.user.name) {
          localStorage.setItem('zhihui_site_username', result.user.name);
        }
        if (result.user.id) {
          localStorage.setItem('zhihui_site_userid', result.user.id);
        }
      }

      console.log('Token验证通过，允许访问:', result.user);
      return true;
    } catch (error) {
      console.error('Token验证请求失败:', error);
      
      // 网络错误时的降级策略
      if (error.name === 'AbortError') {
        console.warn('Token验证请求超时，降级为本地验证');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn('网络不可达，降级为本地验证');
      } else {
        console.warn(`Token验证异常: ${error.message}，尝试本地验证`);
      }
      
      // 使用本地验证作为后备方案
      if (validateTokenLocally(token)) {
        console.log('本地Token验证通过（降级模式）');
        return true;
      } else {
        console.warn('本地Token验证失败，需要重新登录');
        clearAuthData();
        return '/login';
      }
    }
  } else {
    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && isLoggedIn && token) {
      console.log('已登录用户访问登录页，重定向到首页')
      return '/dashboard'
    } else {
      return true
    }
  }
})

// 清除认证数据的辅助函数
function clearAuthData() {
  localStorage.removeItem('zhihui_site_logged_in')
  localStorage.removeItem('zhihui_site_username')
  localStorage.removeItem('zhihui_site_userid')
  localStorage.removeItem('zhihui_site_token')
}

// 本地Token验证（降级方案）
function validateTokenLocally(token) {
  if (!token) return false;
  
  try {
    // 尝试解析 JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Token格式不正确（非JWT格式）');
      // 如果不是JWT，检查是否是简单的token字符串
      return token.length > 10; // 基本长度检查
    }
    
    // 解码 payload 部分
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查过期时间
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('Token已过期');
      return false;
    }
    
    // 检查基本字段
    if (!payload.userId && !payload.sub && !payload.username) {
      console.warn('Token缺少用户标识');
      return false;
    }
    
    console.log('本地Token验证成功:', {
      userId: payload.userId || payload.sub,
      username: payload.username,
      exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '无过期时间'
    });
    
    return true;
  } catch (error) {
    console.error('Token解析失败:', error);
    // 如果无法解析，但token存在且不为空，暂时允许访问（宽松模式）
    return token.length > 0;
  }
}

export default router
