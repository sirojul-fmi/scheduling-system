import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isGuru = computed(() => user.value?.role === 'guru')
  const isWaliKelas = computed(() => user.value?.role === 'wali_kelas')

  async function login(credentials) {
    loading.value = true
    try {
      const res = await authAPI.login(credentials)
      token.value = res.data.data.token
      user.value = res.data.data.user
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login gagal' }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  async function fetchMe() {
    try {
      const res = await authAPI.getMe()
      user.value = res.data.data
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch {
      logout()
    }
  }

  return { token, user, loading, isAuthenticated, isAdmin, isGuru, isWaliKelas, login, logout, fetchMe }
})
