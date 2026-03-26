<template>
  <div>
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card" shadow="never">
          <div class="stat-inner">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4">
      <el-col :md="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>Status Jadwal Aktif</span>
              <el-tag v-if="dashData?.active_schedule?.status === 'done'" type="success">Aktif</el-tag>
              <el-tag v-else-if="dashData?.active_schedule?.status === 'running'" type="warning">Berjalan</el-tag>
              <el-tag v-else type="info">Belum Ada</el-tag>
            </div>
          </template>
          <div v-if="dashData?.active_schedule">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="Tahun Ajaran">
                {{ dashData.active_schedule.academicYear?.year }} Sem {{ dashData.active_schedule.academicYear?.semester }}
              </el-descriptions-item>
              <el-descriptions-item label="Fitness Terbaik">
                {{ dashData.active_schedule.best_fitness?.toLocaleString() || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="Total Generasi">
                {{ dashData.active_schedule.total_generations || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="Selesai">
                {{ formatDate(dashData.active_schedule.finished_at) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="Belum ada jadwal yang digenerate" :image-size="80" />
        </el-card>
      </el-col>

      <el-col :md="10">
        <el-card shadow="never">
          <template #header><span>Aksi Cepat</span></template>
          <div class="quick-actions">
            <el-button v-if="authStore.isAdmin" type="primary" icon="MagicStick" @click="$router.push('/generate')" class="qa-btn">
              Generate Jadwal Baru
            </el-button>
            <el-button type="default" icon="Grid" @click="$router.push('/schedule/class')" class="qa-btn">
              Lihat Jadwal Kelas
            </el-button>
            <el-button v-if="authStore.isAdmin || authStore.isGuru" type="default" icon="UserFilled" @click="$router.push('/schedule/teacher')" class="qa-btn">
              Lihat Jadwal Guru
            </el-button>
            <el-button v-if="authStore.isAdmin" type="default" icon="Connection" @click="$router.push('/assignments')" class="qa-btn">
              Penugasan Guru
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-4" v-if="authStore.isAdmin">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header><span>Panduan Penggunaan</span></template>
          <el-steps :active="setupStep" align-center>
            <el-step title="Tahun Ajaran" description="Buat & aktifkan tahun ajaran" icon="Calendar" />
            <el-step title="Data Guru" description="Tambah guru & preferensi hari" icon="User" />
            <el-step title="Mata Pelajaran" description="Tambah mapel & jam per minggu" icon="Reading" />
            <el-step title="Kelas & Slot" description="Atur kelas dan slot waktu" icon="OfficeBuilding" />
            <el-step title="Penugasan" description="Tugaskan guru ke mapel & kelas" icon="Connection" />
            <el-step title="Generate!" description="Jalankan Algoritma Genetika" icon="MagicStick" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { scheduleAPI } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const dashData = ref(null)

const stats = computed(() => [
  { label: 'Total Guru', value: dashData.value?.teacher_count ?? '-', icon: 'User', color: '#1e3a5f' },
  { label: 'Total Kelas', value: dashData.value?.class_count ?? '-', icon: 'OfficeBuilding', color: '#2d9f6a' },
  { label: 'Mata Pelajaran', value: dashData.value?.subject_count ?? '-', icon: 'Reading', color: '#d48f0f' },
  { label: 'Status Jadwal', value: dashData.value?.active_schedule ? 'Aktif' : 'Kosong', icon: 'Grid', color: '#9f2d2d' },
])

const setupStep = computed(() => {
  if (!dashData.value) return 0
  if (dashData.value.active_schedule?.status === 'done') return 6
  if (dashData.value.teacher_count > 0 && dashData.value.class_count > 0) return 4
  if (dashData.value.active_academic_year) return 1
  return 0
})

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID')
}

onMounted(async () => {
  try {
    const res = await scheduleAPI.getDashboard()
    dashData.value = res.data.data
  } catch { /* silent */ }
})
</script>

<style scoped>
.stats-row { margin-bottom: 4px; }
.stat-card { border-radius: 10px; }
.stat-inner { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-value { font-size: 26px; font-weight: 700; color: #1e3a5f; line-height: 1; }
.stat-label { font-size: 12px; color: #888; margin-top: 4px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.mt-4 { margin-top: 16px; }
.quick-actions { display: flex; flex-direction: column; gap: 8px; }
.qa-btn { width: 100%; justify-content: flex-start; }
</style>
