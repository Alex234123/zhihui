<template>
  <div class="login-container" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <div class="login-box-wrapper" ref="loginBoxWrapperRef" :style="wrapperStyle">
      <div class="login-box" :class="{ 'transitioning': isTransitioning }">
        <div class="login-header">
          <img src="@/assets/images/yto-logo.png" alt="圆通速递" class="logo" ref="logoRef" />
          <h1 class="login-title">智慧工地管理系统</h1>
        </div>

        <div v-if="!showSuccess" class="fade-out-content">
          <el-form
            v-if="activeTab === 'login'"
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="loginForm.phone"
                placeholder="用户名/联系电话"
                prefix-icon="User"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                prefix-icon="Lock"
                show-password
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="submit-btn"
                size="large"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
            <div style="text-align: center; margin-top: 10px;">
              <el-link type="primary" @click="switchToRegister">
                还没有账号？立即注册
              </el-link>
            </div>
            <div style="text-align: center; margin-top: 5px;">
              <el-link type="primary" @click="switchToForgotPassword">
                忘记密码？
              </el-link>
            </div>
          </el-form>

          <el-form
            v-else-if="activeTab === 'forgot'"
            ref="forgotFormRef"
            :model="forgotForm"
            :rules="forgotRules"
            class="login-form"
          >
            <div style="margin-bottom: 20px; text-align: center;">
              <h3 style="margin: 0; color: #1D2129;">重置密码</h3>
              <p style="color: #86909C; font-size: 13px; margin-top: 8px;">
                验证密码格式：当前日期（如 {{ currentDateHint }}）
              </p>
            </div>

            <el-form-item prop="phone">
              <el-input
                v-model="forgotForm.phone"
                placeholder="请输入需要重置密码的手机号"
                prefix-icon="Phone"
                size="large"
              />
            </el-form-item>

            <el-form-item prop="verifyCode">
              <el-input
                v-model="forgotForm.verifyCode"
                placeholder="请输入验证密码（格式：YYYYMMDD）"
                prefix-icon="Key"
                size="large"
              />
            </el-form-item>

            <el-form-item prop="newPassword">
              <el-input
                v-model="forgotForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                prefix-icon="Lock"
                show-password
                size="large"
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="forgotForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                prefix-icon="Lock"
                show-password
                size="large"
                @keyup.enter="handleResetPassword"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="submit-btn"
                size="large"
                @click="handleResetPassword"
              >
                {{ loading ? '重置中...' : '确认重置' }}
              </el-button>
            </el-form-item>

            <div style="text-align: center; margin-top: 10px;">
              <el-link type="primary" @click="switchToLogin">
                返回登录
              </el-link>
            </div>
          </el-form>

          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="login-form"
          >
            <el-form-item prop="name">
              <el-input
                v-model="registerForm.name"
                placeholder="姓名"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="gender">
              <el-radio-group v-model="registerForm.gender" size="large">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="phone">
              <el-input
                v-model="registerForm.phone"
                placeholder="联系电话"
                prefix-icon="Phone"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码"
                prefix-icon="Lock"
                show-password
                size="large"
              />
            </el-form-item>
            <el-form-item prop="position">
              <el-input
                v-model="registerForm.position"
                placeholder="岗位"
                prefix-icon="OfficeBuilding"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="responsibility">
              <el-select
                v-model="registerForm.responsibility"
                placeholder="责任主体"
                style="width: 100%"
                size="large"
              >
                <el-option label="建设单位" value="建设单位" />
                <el-option label="监理单位" value="监理单位" />
                <el-option label="施工单位" value="施工单位" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="registerForm.responsibility === '施工单位'" prop="supervisor">
              <el-input
                v-model="registerForm.supervisor"
                placeholder="请输入负责人或所属负责人"
                prefix-icon="UserFilled"
                size="large"
              />
            </el-form-item>
            <el-form-item v-if="registerForm.responsibility === '施工单位'" prop="block">
              <el-select
                v-model="registerForm.block"
                placeholder="请选择负责区块"
                style="width: 100%"
                size="large"
              >
                <el-option label="区块A" value="A" />
                <el-option label="区块B" value="B" />
                <el-option label="区块C" value="C" />
                <el-option label="区块D" value="D" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="registerForm.responsibility === '施工单位'" prop="team">
              <el-input
                v-model="registerForm.team"
                placeholder="班组"
                prefix-icon="UserFilled"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="age">
              <el-input-number
                v-model="registerForm.age"
                placeholder="年龄"
                style="width: 100%"
                :min="18"
                :max="65"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item prop="entryDate">
              <el-date-picker
                v-model="registerForm.entryDate"
                type="date"
                placeholder="入职日期"
                style="width: 100%"
                size="large"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="submit-btn"
                size="large"
                @click="handleRegister"
              >
                {{ loading ? '注册中...' : '注册' }}
              </el-button>
            </el-form-item>
            <div style="text-align: center; margin-top: 10px;">
              <el-link type="primary" @click="switchToLogin">
                已有账号？立即登录
              </el-link>
            </div>
          </el-form>
        </div>

        <div v-else class="success-container fade-out-content">
          <el-icon class="success-icon" size="80"><Check /></el-icon>
          <h2>{{ successMessage }}</h2>
          <p>正在跳转...</p>
        </div>

        <div class="login-footer fade-out-content">
          <p>© 2026 智慧工地管理系统 | 圆通淮安 3 号集运中心</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, OfficeBuilding, UserFilled, Key } from '@element-plus/icons-vue'
import dataService from '../services/dataService'

const router = useRouter()
const loginFormRef = ref(null)
const registerFormRef = ref(null)
const forgotFormRef = ref(null)
const activeTab = ref('login')
const loading = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const loginBoxWrapperRef = ref(null)
const rotateX = ref(0)
const rotateY = ref(0)
const isTransitioning = ref(false)
const logoRef = ref(null)

const wrapperStyle = computed(() => {
  return {
    transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`
  }
})

const handleMouseMove = (e) => {
  if (!loginBoxWrapperRef.value) return
  
  const rect = loginBoxWrapperRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const deltaX = (e.clientX - centerX) / rect.width
  const deltaY = (e.clientY - centerY) / rect.height
  
  rotateY.value = deltaX * 6
  rotateX.value = -deltaY * 6
}

const handleMouseLeave = () => {
  rotateX.value = 0
  rotateY.value = 0
}

const loginForm = reactive({
  phone: '',
  password: '',
  rememberMe: false
})

const registerForm = reactive({
  name: '',
  gender: '男',
  phone: '',
  password: '',
  position: '',
  responsibility: '',
  supervisor: '',
  block: '',
  team: '',
  age: 30,
  entryDate: ''
})

const forgotForm = reactive({
  phone: '',
  verifyCode: '',
  newPassword: '',
  confirmPassword: ''
})

const currentDateHint = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
})

const loginRules = {
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  position: [
    { required: true, message: '请输入岗位', trigger: 'blur' },
    { min: 2, max: 50, message: '岗位长度应在2-50个字符之间', trigger: 'blur' }
  ],
  responsibility: [{ required: true, message: '请选择责任主体', trigger: 'change' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 18, max: 65, message: '年龄应在18-65岁之间', trigger: 'blur' }
  ],
  entryDate: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
}

const forgotRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证密码', trigger: 'blur' },
    { len: 8, message: '验证密码格式为8位数字（YYYYMMDD）', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== forgotForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const addLog = async (message, level = 'info', details = null) => {
  const logs = await dataService.get('logs', [])
  const newLog = {
    id: Date.now().toString(36),
    time: new Date().toLocaleString('zh-CN'),
    timestamp: new Date().toISOString(),
    level,
    message,
    details: {
      ...details,
      ip: '192.168.1.' + Math.floor(Math.random() * 255),
      userAgent: navigator.userAgent
    }
  }
  await dataService.set('logs', [newLog, ...logs])
}

const switchToRegister = () => {
  activeTab.value = 'register'
  showSuccess.value = false
}

const switchToLogin = () => {
  activeTab.value = 'login'
  showSuccess.value = false
}

const switchToForgotPassword = () => {
  activeTab.value = 'forgot'
  showSuccess.value = false
  forgotForm.phone = ''
  forgotForm.verifyCode = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: loginForm.phone,
        password: loginForm.password
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('登录成功，保存状态')
      localStorage.setItem('zhihui_site_logged_in', 'true')
      localStorage.setItem('zhihui_site_username', result.user.name)
      localStorage.setItem('zhihui_site_userid', result.user.id)
      localStorage.setItem('zhihui_site_token', result.token)

      if (loginForm.rememberMe) {
        localStorage.setItem('zhihui_site_remembered', 'true')
        localStorage.setItem('zhihui_site_remembered_phone', loginForm.phone)
        localStorage.setItem('zhihui_site_remembered_password', loginForm.password)
      }

      await addLog(`${result.user.name} 登录系统`, 'success', {
        userId: result.user.id,
        userName: result.user.name
      })

      await startTransition()
    } else {
      console.log('用户名或密码错误')
      ElMessage.error(result.message || '用户名或密码错误')
      await addLog('登录失败：用户名或密码错误', 'error', {
        phone: loginForm.phone
      })
    }
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  if (!forgotFormRef.value) return

  try {
    await forgotFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const correctCode = `${year}${month}${day}`

  if (forgotForm.verifyCode !== correctCode) {
    ElMessage.error('验证密码错误，请检查日期格式（YYYYMMDD）')
    await addLog('密码重置失败：验证码错误', 'error', {
      phone: forgotForm.phone,
      inputCode: forgotForm.verifyCode,
      correctCode: correctCode
    })
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: forgotForm.phone,
        newPassword: forgotForm.newPassword
      })
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      await addLog(`用户 ${forgotForm.phone} 密码已成功重置`, 'success', {
        phone: forgotForm.phone
      })

      setTimeout(() => {
        switchToLogin()
        loginForm.phone = forgotForm.phone
      }, 1500)
    } else {
      ElMessage.error(result.message || '密码重置失败')
      await addLog('密码重置失败', 'error', {
        phone: forgotForm.phone,
        error: result.message
      })
    }
  } catch (error) {
    console.error('密码重置错误:', error)
    ElMessage.error('密码重置失败，请重试')
  } finally {
    loading.value = false
  }
}

const startTransition = async () => {
  await nextTick()
  
  isTransitioning.value = true
  
  await nextTick()
  
  if (logoRef.value) {
    const logoRect = logoRef.value.getBoundingClientRect()
    
    const targetScale = 0.6
    
    logoRef.value.style.position = 'fixed'
    logoRef.value.style.top = `${logoRect.top}px`
    logoRef.value.style.left = `${logoRect.left}px`
    logoRef.value.style.zIndex = '99999'
    logoRef.value.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    logoRef.value.style.marginBottom = '0'
    logoRef.value.style.transform = 'scale(1)'
    
    await nextTick()
    
    logoRef.value.style.top = '20px'
    logoRef.value.style.left = 'calc(50% - 900px)'
    logoRef.value.style.transform = `scale(${targetScale})`
  }
  
  setTimeout(() => {
    router.push('/dashboard')
  }, 800)
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()
  } catch (e) {
    console.log('表单验证失败', e)
    return
  }

  loading.value = true
  let syncSuccess = false

  try {
    const users = await dataService.get('users', [])
    const personnelList = await dataService.get('personnel', [])

    const userExists = users.some(u => u.phone === registerForm.phone)
    if (userExists) {
      ElMessage.error('该手机号已被注册')
      loading.value = false
      return
    }

    const phoneExistsInPersonnel = personnelList.some(p => p.phone === registerForm.phone)
    if (phoneExistsInPersonnel) {
      ElMessage.error('该手机号已在人员管理中存在，请使用其他手机号')
      loading.value = false
      return
    }

    const generatePersonnelId = () => {
      const prefixMap = {
        '建设单位': 'JS',
        '监理单位': 'JL',
        '施工单位': 'SG'
      }
      const prefix = prefixMap[registerForm.responsibility] || 'RY'
      const date = new Date()
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
      
      const samePrefixIds = personnelList
        .filter(p => p.id && p.id.startsWith(prefix))
        .map(p => parseInt(p.id.split('-').pop()) || 0)
      
      const nextNum = samePrefixIds.length > 0 ? Math.max(...samePrefixIds) + 1 : 1
      const numStr = String(nextNum).padStart(3, '0')
      
      return `${prefix}-${dateStr}-${numStr}`
    }
    
    const userId = generatePersonnelId()
    
    const newUser = {
      id: userId,
      name: registerForm.name,
      phone: registerForm.phone,
      password: registerForm.password,
      responsibility: registerForm.responsibility,
      age: registerForm.age,
      createdAt: new Date().toISOString()
    }

    const newPersonnel = {
      id: userId,
      name: registerForm.name,
      gender: registerForm.gender,
      age: registerForm.age,
      position: registerForm.position,
      responsibility: registerForm.responsibility,
      supervisor: registerForm.supervisor || '',
      block: registerForm.block || '',
      team: registerForm.team || '',
      phone: registerForm.phone,
      entryDate: registerForm.entryDate
    }

    users.push(newUser)
    await dataService.set('users', users)

    personnelList.push(newPersonnel)
    await dataService.set('personnel', personnelList)

    syncSuccess = true

    await addLog(`新用户注册：${registerForm.name} - 数据已同步到人员管理`, 'success', {
      userId: userId,
      userName: registerForm.name,
      phone: registerForm.phone,
      personnelId: newPersonnel.id,
      syncSuccess: true
    })

    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: registerForm.phone,
        password: registerForm.password
      })
    })
    const loginResult = await loginResponse.json()

    localStorage.setItem('zhihui_site_logged_in', 'true')
    localStorage.setItem('zhihui_site_username', newUser.name)
    localStorage.setItem('zhihui_site_userid', newUser.id)
    if (loginResult.success && loginResult.token) {
      localStorage.setItem('zhihui_site_token', loginResult.token)
    }

    showSuccess.value = true
    successMessage.value = '注册成功，数据已同步到人员管理'

    setTimeout(() => {
      activeTab.value = 'login'
      showSuccess.value = false
      loginForm.phone = registerForm.phone
      registerForm.name = ''
      registerForm.gender = '男'
      registerForm.phone = ''
      registerForm.password = ''
      registerForm.position = ''
      registerForm.responsibility = ''
      registerForm.supervisor = ''
      registerForm.block = ''
      registerForm.team = ''
      registerForm.age = 30
      registerForm.entryDate = ''
      ElMessage.success('注册成功，数据已同步，正在跳转...')
      router.push('/dashboard')
    }, 2000)
  } catch (error) {
    console.error('注册错误:', error)
    
    if (!syncSuccess) {
      ElMessage.error('注册失败，数据同步异常，请重试')
      await addLog('注册失败：数据同步异常', 'error', {
        error: error.message,
        syncSuccess: false
      })
    } else {
      ElMessage.error('注册失败，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #660099 0%, #FF6600 100%);
  padding: 20px;
  perspective: 1000px;
}

.login-box-wrapper {
  transform-style: preserve-3d;
  transition: transform 0.3s ease-out;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 8px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12), 
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 20px 40px rgba(102, 0, 153, 0.15),
    0 0 0 1px rgba(102, 0, 153, 0.1) inset;
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-smoothing: antialiased;
}

.login-box:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  height: 80px;
  margin-bottom: 15px;
  transition: transform 0.2s ease;
}

.login-box:hover .logo {
  transform: scale(1.05);
}

.login-box.transitioning .logo {
  position: fixed !important;
  z-index: 99999 !important;
}

.login-box.transitioning .login-title,
.login-box.transitioning .fade-out-content {
  opacity: 0 !important;
  filter: blur(10px);
  transition: all 0.6s ease-out;
}

.login-header .login-title {
  font-size: 24px;
  color: #1D2129;
  margin: 0;
  font-weight: 700;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transform: translateZ(0);
}

.login-form,
.login-form * {
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transform: translateZ(0);
}

.login-form {
  margin-top: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 0 0 1px #E5E6EB inset;
  background: #FFFFFF;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #660099 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #660099;
}

.submit-btn {
  width: 100%;
  border-radius: 8px;
  background: #660099;
  border: none;
  height: 48px;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background: #550080;
  transform: rotate(1deg);
}

.submit-btn:active {
  transform: scale(0.98);
}

.success-container {
  text-align: center;
  padding: 60px 20px;
}

.success-icon {
  color: #00B42A;
  margin-bottom: 20px;
  animation: successPulse 1s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-container h2 {
  font-size: 24px;
  color: #1D2129;
  margin: 10px 0;
  font-weight: 600;
}

.success-container p {
  color: #86909C;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  color: #86909C;
  font-size: 12px;
}

.login-footer p {
  margin: 0;
}

.login-form :deep(.el-link) {
  font-weight: 500;
  color: #660099;
  transition: all 0.2s ease;
  position: relative;
}

.login-form :deep(.el-link:hover) {
  color: #FF6600;
}

.login-form :deep(.el-link:hover::after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #FF6600;
  transform: skewX(-5deg);
}

.login-form :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #660099;
  border-color: #660099;
}

.login-form :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #660099;
  border-color: #660099;
}

.login-form :deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #660099;
}

.login-form :deep(.el-select) {
  --el-select-input-height: 40px;
}

.login-form :deep(.el-select .el-input__wrapper) {
  height: 40px !important;
  box-sizing: border-box !important;
}

.login-form :deep(.el-select .el-select__wrapper) {
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
}

.login-form :deep(.el-select .el-select__selected-item),
.login-form :deep(.el-select .el-select__placeholder) {
  display: inline-flex !important;
  align-items: center !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.login-form :deep(.el-select .el-input__inner) {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.login-form :deep(.el-select .el-input__suffix) {
  height: 100%;
  display: flex;
  align-items: center;
}

.login-form :deep(.el-date-editor.el-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #660099;
}

.login-form :deep(.el-textarea__inner) {
  border-radius: 6px;
  border-color: #E5E6EB;
  transition: all 0.2s ease;
}

.login-form :deep(.el-textarea__inner:hover) {
  border-color: #660099;
}

.login-form :deep(.el-textarea__inner:focus) {
  border-color: #660099;
  box-shadow: 0 0 0 2px #660099;
}

.login-form :deep(.el-select-dropdown__item.selected) {
  background: #F8F2FF;
  color: #660099;
}

.login-form :deep(.el-select-dropdown__item:hover) {
  background: #F5F7FA;
}
</style>
