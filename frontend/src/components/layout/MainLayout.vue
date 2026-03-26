<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="sidebar-header">
        <div class="logo-wrap" v-if="!sidebarCollapsed">
          <div class="logo-icon">📚</div>
          <div class="logo-text">
            <div class="logo-title">MIS At-Taqwa</div>
            <div class="logo-sub">Sistem Penjadwalan</div>
          </div>
        </div>
        <div class="logo-icon-only" v-else>📚</div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        router
        background-color="#1e3a5f"
        text-color="#c5d5e8"
        active-text-color="#ffffff"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>Dashboard</template>
        </el-menu-item>

        <!-- ADMIN MENU -->
        <template v-if="authStore.isAdmin">
          <el-menu-item-group title="Data Master" v-if="!sidebarCollapsed" />
          <el-menu-item index="/teachers">
            <el-icon><User /></el-icon>
            <template #title>Guru</template>
          </el-menu-item>
          <el-menu-item index="/subjects">
            <el-icon><Reading /></el-icon>
            <template #title>Mata Pelajaran</template>
          </el-menu-item>
          <el-menu-item index="/classes">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>Kelas</template>
          </el-menu-item>
          <el-menu-item index="/time-slots">
            <el-icon><Clock /></el-icon>
            <template #title>Slot Waktu</template>
          </el-menu-item>
          <el-menu-item index="/academic-years">
            <el-icon><Calendar /></el-icon>
            <template #title>Tahun Ajaran</template>
          </el-menu-item>

          <el-menu-item-group title="Penjadwalan" v-if="!sidebarCollapsed" />
          <el-menu-item index="/assignments">
            <el-icon><Connection /></el-icon>
            <template #title>Penugasan Guru</template>
          </el-menu-item>
          <el-menu-item index="/generate">
            <el-icon><MagicStick /></el-icon>
            <template #title>Generate Jadwal</template>
          </el-menu-item>
          <el-menu-item index="/schedule/class">
            <el-icon><Grid /></el-icon>
            <template #title>Jadwal Per Kelas</template>
          </el-menu-item>
          <el-menu-item index="/schedule/teacher">
            <el-icon><UserFilled /></el-icon>
            <template #title>Jadwal Per Guru</template>
          </el-menu-item>

          <el-menu-item-group title="Sistem" v-if="!sidebarCollapsed" />
          <el-menu-item index="/users">
            <el-icon><Setting /></el-icon>
            <template #title>Pengguna</template>
          </el-menu-item>
        </template>

        <!-- GURU MENU -->
        <template v-if="authStore.isGuru">
          <el-menu-item index="/schedule/teacher">
            <el-icon><UserFilled /></el-icon>
            <template #title>Jadwal Saya</template>
          </el-menu-item>
          <el-menu-item index="/schedule/class">
            <el-icon><Grid /></el-icon>
            <template #title>Jadwal Kelas</template>
          </el-menu-item>
        </template>

        <!-- WALI KELAS MENU -->
        <template v-if="authStore.isWaliKelas">
          <el-menu-item index="/schedule/class">
            <el-icon><Grid /></el-icon>
            <template #title>Jadwal Kelas</template>
          </el-menu-item>
        </template>
      </el-menu>

      <!-- Collapse toggle -->
      <div class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        <el-icon>
          <Fold v-if="!sidebarCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- Main content -->
    <el-container class="content-wrap">
      <!-- Topbar -->
      <el-header class="topbar">
        <div class="topbar-left">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <div class="topbar-right">
          <el-tag v-if="activeYear" type="info" size="small" class="year-tag">
            TA {{ activeYear.year }} | Sem {{ activeYear.semester }}
          </el-tag>
          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ authStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" disabled>
                  <el-icon><User /></el-icon>
                  {{ roleLabel }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Keluar
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Page content -->
      <el-main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { academicYearAPI } from '@/services/api'

const authStore = useAuthStore()
const route = useRoute()
const sidebarCollapsed = ref(false)
const activeYear = ref(null)

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => route.meta?.title || 'Dashboard')

const roleLabel = computed(() => {
  const map = { admin: 'Administrator', guru: 'Guru', wali_kelas: 'Wali Kelas' }
  return map[authStore.user?.role] || '-'
})

function handleUserCommand(cmd) {
  if (cmd === 'logout') authStore.logout()
}

onMounted(async () => {
  try {
    const res = await academicYearAPI.getActive()
    activeYear.value = res.data.data
  } catch { /* no active year */ }
})
</script>

<style scoped>
.main-layout { height: 100vh; overflow: hidden; }

.sidebar {
  background-color: #1e3a5f;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.logo-wrap { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 24px; }
.logo-icon-only { font-size: 24px; margin: auto; }
.logo-title { color: #fff; font-weight: 700; font-size: 13px; line-height: 1.3; }
.logo-sub { color: #8baac7; font-size: 11px; }

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.el-menu-item-group__title) {
  color: #4a6d8c !important;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 20px 4px;
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(255,255,255,0.15) !important;
  border-right: 3px solid #64b5f6;
}

:deep(.el-menu-item:hover) { background-color: rgba(255,255,255,0.08) !important; }

.collapse-btn {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8baac7;
  cursor: pointer;
  border-top: 1px solid rgba(255,255,255,0.1);
  transition: background 0.2s;
}
.collapse-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

.content-wrap { flex-direction: column; overflow: hidden; }

.topbar {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  flex-shrink: 0;
}

.page-title { margin: 0; font-size: 18px; color: #1e3a5f; font-weight: 600; }

.topbar-right { display: flex; align-items: center; gap: 12px; }

.year-tag { font-size: 11px; }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.user-info:hover { background: #f0f2f5; }

.avatar { background: #1e3a5f; color: #fff; font-weight: bold; font-size: 14px; }
.user-name { font-size: 13px; color: #333; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.page-content {
  padding: 24px;
  overflow-y: auto;
  background: #f0f2f5;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
