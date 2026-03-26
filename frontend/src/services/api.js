import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor: handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message || 'Terjadi kesalahan'

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (status === 403) {
      ElMessage.error('Anda tidak memiliki akses untuk melakukan tindakan ini')
    } else if (status === 404) {
      // Let component handle 404
    } else if (status >= 500) {
      ElMessage.error('Terjadi kesalahan server. Coba lagi nanti.')
    }

    return Promise.reject(error)
  }
)

// ===== API Modules =====

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const teacherAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
}

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

export const classAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
}

export const academicYearAPI = {
  getAll: () => api.get('/academic-years'),
  getActive: () => api.get('/academic-years/active'),
  create: (data) => api.post('/academic-years', data),
  activate: (id) => api.patch(`/academic-years/${id}/activate`),
  delete: (id) => api.delete(`/academic-years/${id}`),
}

export const timeSlotAPI = {
  getAll: (params) => api.get('/time-slots', { params }),
  create: (data) => api.post('/time-slots', data),
  bulkCreate: (data) => api.post('/time-slots/bulk', data),
  update: (id, data) => api.put(`/time-slots/${id}`, data),
  delete: (id) => api.delete(`/time-slots/${id}`),
}

export const assignmentAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  create: (data) => api.post('/assignments', data),
  bulkSet: (data) => api.post('/assignments/bulk', data),
  delete: (id) => api.delete(`/assignments/${id}`),
}

export const scheduleAPI = {
  getDashboard: () => api.get('/schedule/dashboard'),
  generate: (data) => api.post('/schedule/generate', data),
  getJobs: (params) => api.get('/schedule/jobs', { params }),
  getStatus: (jobId) => api.get(`/schedule/status/${jobId}`),
  activateJob: (jobId) => api.patch(`/schedule/activate/${jobId}`),
  getByClass: (classId, params) => api.get(`/schedule/by-class/${classId}`, { params }),
  getByTeacher: (teacherId, params) => api.get(`/schedule/by-teacher/${teacherId}`, { params }),
  exportPDF: (classId, params) => api.get(`/schedule/export/pdf/${classId}`, { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/schedule/export/excel', { params, responseType: 'blob' }),
}

export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.patch(`/users/${id}/reset-password`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export default api
