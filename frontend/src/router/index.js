import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardPage.vue'),
        meta: { title: 'Dashboard' }
      },
      // Admin-only routes
      {
        path: 'teachers',
        name: 'Teachers',
        component: () => import('@/views/TeacherManagementPage.vue'),
        meta: { title: 'Manajemen Guru', roles: ['admin'] }
      },
      {
        path: 'subjects',
        name: 'Subjects',
        component: () => import('@/views/SubjectManagementPage.vue'),
        meta: { title: 'Mata Pelajaran', roles: ['admin'] }
      },
      {
        path: 'classes',
        name: 'Classes',
        component: () => import('@/views/ClassManagementPage.vue'),
        meta: { title: 'Manajemen Kelas', roles: ['admin'] }
      },
      {
        path: 'time-slots',
        name: 'TimeSlots',
        component: () => import('@/views/TimeSlotManagementPage.vue'),
        meta: { title: 'Slot Waktu', roles: ['admin'] }
      },
      {
        path: 'assignments',
        name: 'Assignments',
        component: () => import('@/views/AssignmentPage.vue'),
        meta: { title: 'Penugasan Guru', roles: ['admin'] }
      },
      {
        path: 'generate',
        name: 'Generate',
        component: () => import('@/views/GenerateSchedulePage.vue'),
        meta: { title: 'Generate Jadwal', roles: ['admin'] }
      },
      {
        path: 'academic-years',
        name: 'AcademicYears',
        component: () => import('@/views/AcademicYearPage.vue'),
        meta: { title: 'Tahun Ajaran', roles: ['admin'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UserManagementPage.vue'),
        meta: { title: 'Manajemen Pengguna', roles: ['admin'] }
      },
      // Schedule views (shared)
      {
        path: 'schedule/class',
        name: 'ScheduleByClass',
        component: () => import('@/views/ScheduleByClassPage.vue'),
        meta: { title: 'Jadwal Per Kelas', roles: ['admin', 'wali_kelas'] }
      },
      {
        path: 'schedule/teacher',
        name: 'ScheduleByTeacher',
        component: () => import('@/views/ScheduleByTeacherPage.vue'),
        meta: { title: 'Jadwal Per Guru', roles: ['admin', 'guru'] }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // Role-based access
  if (to.meta.roles && authStore.user) {
    if (!to.meta.roles.includes(authStore.user.role)) {
      return next({ name: 'Dashboard' })
    }
  }

  next()
})

export default router
