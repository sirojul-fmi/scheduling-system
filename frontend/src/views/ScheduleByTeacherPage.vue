<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div style="display:flex;gap:8px;align-items:center">
          <el-select
            v-if="authStore.isAdmin"
            v-model="selectedTeacher"
            filterable clearable placeholder="Pilih Guru"
            style="width:240px"
            @change="fetchSchedule"
          >
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <span v-else style="font-weight:600;color:#1e3a5f">Jadwal Mengajar: {{ authStore.user?.name }}</span>
        </div>
        <el-button :icon="Document" :disabled="!selectedTeacher" @click="exportPDF">Ekspor PDF</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <div v-if="loading" v-loading="loading" style="min-height:300px" />
      <div v-else-if="!selectedTeacher">
        <el-empty description="Pilih guru untuk melihat jadwal mengajar" />
      </div>
      <div v-else-if="schedules.length === 0">
        <el-empty description="Guru ini belum memiliki jadwal mengajar" />
      </div>
      <div v-else>
        <!-- Weekly summary chips -->
        <div class="weekly-summary">
          <el-tag v-for="d in usedDays" :key="d" type="info" size="large" style="margin-right:8px;margin-bottom:8px">
            {{ DAY_NAMES[d] }}: {{ dayCount(d) }} jam
          </el-tag>
          <el-tag type="success" size="large">Total: {{ schedules.length }} jam/minggu</el-tag>
        </div>

        <!-- Schedule grid -->
        <div class="schedule-wrapper">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="time-header">Jam / Waktu</th>
                <th v-for="d in usedDays" :key="d" class="day-header">{{ DAY_NAMES[d] }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in scheduleGrid" :key="row.slotIndex">
                <td class="time-cell">
                  <div class="slot-num">Jam {{ row.slotIndex + 1 }}</div>
                  <div class="slot-time">{{ row.startTime }} - {{ row.endTime }}</div>
                </td>
                <td
                  v-for="d in usedDays" :key="d"
                  :class="['schedule-cell', row.category !== 'lesson' ? 'break-cell' : '']"
                >
                  <template v-if="row.category !== 'lesson'">
                    <div class="break-label">{{ row.category === 'prayer' ? '🕌 Sholat' : '☕ Istirahat' }}</div>
                  </template>
                  <template v-else>
                    <div v-if="getEntry(row.slotIndex, d)" class="cell-content">
                      <div class="subject-name" :class="{ religion: getEntry(row.slotIndex, d).subject?.type === 'keagamaan' }">
                        {{ getEntry(row.slotIndex, d).subject?.name }}
                      </div>
                      <div class="class-name">{{ getEntry(row.slotIndex, d).class?.name }}</div>
                    </div>
                    <div v-else class="empty-cell">—</div>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { scheduleAPI, teacherAPI, timeSlotAPI } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const authStore = useAuthStore()

const teachers = ref([])
const selectedTeacher = ref(null)
const schedules = ref([])
const timeSlots = ref([])
const loading = ref(false)

const usedDays = computed(() => [...new Set(timeSlots.value.map(s => s.day_index))].sort())

const scheduleGrid = computed(() => {
  const unique = {}
  for (const s of timeSlots.value) {
    if (!unique[s.slot_index]) unique[s.slot_index] = s
  }
  return Object.values(unique).sort((a, b) => a.slot_index - b.slot_index).map(s => ({
    slotIndex: s.slot_index,
    startTime: s.start_time?.substring(0, 5) || '',
    endTime: s.end_time?.substring(0, 5) || '',
    category: s.category,
  }))
})

const scheduleMap = computed(() => {
  const map = {}
  for (const s of schedules.value) map[`${s.day_index}-${s.slot_index}`] = s
  return map
})

const getEntry = (slotIdx, dayIdx) => scheduleMap.value[`${dayIdx}-${slotIdx}`] || null
const dayCount = (d) => schedules.value.filter(s => s.day_index === d).length

async function fetchSchedule() {
  if (!selectedTeacher.value) return
  loading.value = true
  try {
    const res = await scheduleAPI.getByTeacher(selectedTeacher.value)
    schedules.value = res.data.data.schedules
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Gagal memuat jadwal')
  } finally { loading.value = false }
}

async function exportPDF() {
  ElMessage.info('Ekspor PDF jadwal guru akan segera tersedia')
}

onMounted(async () => {
  try {
    const tsRes = await timeSlotAPI.getAll()
    timeSlots.value = tsRes.data.data

    if (authStore.isAdmin) {
      const res = await teacherAPI.getAll()
      teachers.value = res.data.data
    } else if (authStore.user?.teacher_id) {
      selectedTeacher.value = authStore.user.teacher_id
      fetchSchedule()
    }
  } catch { /* silent */ }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.mt-3 { margin-top: 12px; }
.weekly-summary { margin-bottom: 16px; }
.schedule-wrapper { overflow-x: auto; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 0; }
.day-header { background: #1e3a5f; color: #fff; text-align: center; padding: 10px; font-weight: 600; min-width: 140px; }
.time-header { background: #1e3a5f; color: #fff; text-align: center; padding: 10px; width: 90px; }
.time-cell { background: #f5f7fa; text-align: center; padding: 6px; }
.slot-num { font-weight: 700; font-size: 13px; color: #1e3a5f; }
.slot-time { font-size: 11px; color: #888; }
.schedule-cell { padding: 8px; vertical-align: middle; min-height: 56px; }
.break-cell { background: #f0f0f0; }
.break-label { color: #888; font-size: 12px; text-align: center; padding: 8px; }
.cell-content { display: flex; flex-direction: column; gap: 3px; }
.subject-name { font-weight: 600; font-size: 12px; color: #1e3a5f; }
.subject-name.religion { color: #7d4e00; }
.class-name { font-size: 11px; background: #e8f4f8; color: #1e3a5f; border-radius: 4px; padding: 1px 6px; display: inline-block; }
.empty-cell { color: #ccc; text-align: center; font-size: 18px; }
</style>
