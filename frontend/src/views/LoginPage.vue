<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <div class="school-logo">📚</div>
        <h1>MIS At-Taqwa</h1>
        <p>Sistem Informasi Penjadwalan Otomatis</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="Username"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Password"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-alert v-if="errorMsg" :title="errorMsg" type="error" :closable="false" class="mb-4" />

        <el-button
          type="primary"
          :loading="authStore.loading"
          @click="handleLogin"
          class="login-btn"
          size="large"
        >
          Masuk
        </el-button>
      </el-form>

      <div class="login-footer">
        <small>Versi 1.0 &bull; Maret 2026</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const errorMsg = ref('')
const form = ref({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: 'Username wajib diisi', trigger: 'blur' }],
  password: [{ required: true, message: 'Password wajib diisi', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  errorMsg.value = ''
  const result = await authStore.login(form.value)
  if (result.success) {
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } else {
    errorMsg.value = result.message
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%);
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.school-logo {
  font-size: 48px;
  margin-bottom: 8px;
}

.login-header h1 {
  margin: 0 0 4px;
  font-size: 22px;
  color: #1e3a5f;
  font-weight: 700;
}

.login-header p {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: #1e3a5f;
  border-color: #1e3a5f;
}

.login-btn:hover {
  background: #2d6a9f;
  border-color: #2d6a9f;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #bbb;
}

.mb-4 { margin-bottom: 16px; }
</style>
