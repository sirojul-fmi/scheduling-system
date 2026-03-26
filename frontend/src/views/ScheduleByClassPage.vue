<template>
  <div>
    <!-- Filter bar -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <el-select v-model="selectedClass" placeholder="Pilih Kelas" style="width:150px" @change="fetchSchedule">
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="selectedJob" placeholder="Pilih Jadwal" style="width:220px" @change="fetchSchedule" clearable>
            <el-option v-for="j in jobs" :key="j.id" :label="`Job #${j.id} - ${j.academicYear?.year} Sem ${j.academicYear?.semester}`" :value="j.id">
              <span>Job #{{ j.id }}</span>
              <el-tag :type="j.is_active ? 'success' : 'info'" size="small" style="margin-left:8px">{{ j.is_active ? 'Aktif' : j.status }}</el-tag>
            </el-option>
          </el-select>
        </div>
        <div style="display:flex;gap:8px">
          <el-button :icon="Document" :disabled="!selectedClass" @click="exportPDF">Ekspor PDF</el-button>
          <el-button :icon="Download" type="success" :disabled="!selectedJob" @click="exportExcel">Ekspor Excel</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <div v-if="loading" v-loading="loading" style="min-height:300px" />
      <div v-else-if="!selectedClass">
        <el-empty description="Pilih kelas untuk melihat jadwal" />
      </div>
      <div v-else-if="scheduleGrid.length === 0">
        <el-empty description="Belum ada jadwal untuk kelas ini" />
      </div>
      <div v-else class="schedule-wrapper">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="time-header">Jam / Waktu</th>
              <th v-for="d in usedDays" :key="d" class="day-header">{{ DAY_NAMES[d] }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, si) in scheduleGrid" :key="si">
              <td class="time-cell">
                <div class="slot-num">Jam {{ row.slotIndex + 1 }}</div>
                <div class="slot-time">{{ row.startTime }} - {{ row.endTime }}</div>
              </td>
              <td
                v-for="d in usedDays" :key="d"
                :class="['schedule-cell', getCellClass(row, d)]"
              >
                <template v-if="row.category !== 'lesson'">
                  <div class="break-label">{{ row.category === 'prayer' ? '🕌 Sholat' : '☕ Istirahat' }}</div>
                </template>
                <template v-else>
                  <div v-if="getEntry(row.slotIndex, d)" class="cell-content">
                    <div class="subject-name" :class="{ religion: getEntry(row.slotIndex, d).subject?.type === 'keagamaan' }">
                      {{ getEntry(row.slotIndex, d).subject?.name }}
                    </div>
                    <div class="teacher-name">{{ getEntry(row.slotIndex, d).teacher?.name }}</div>
                  </div>
                  <div v-else class="empty-cell">—</div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Download } from '@element-plus/icons-vue'
import { scheduleAPI, classAPI, timeSlotAPI } from '@/services/api'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const classes = ref([])
const jobs = ref([])
const selectedClass = ref(null)
const selectedJob = ref(null)
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
    label: s.label,
  }))
})

const scheduleMap = computed(() => {
  const map = {}
  for (const s of schedules.value) {
    map[`${s.day_index}-${s.slot_index}`] = s
  }
  return map
})

const getEntry = (slotIdx, dayIdx) => scheduleMap.value[`${dayIdx}-${slotIdx}`] || null

const getCellClass = (row, dayIdx) => {
  if (row.category !== 'lesson') return 'break-cell'
  const entry = getEntry(row.slotIndex, dayIdx)
  if (!entry) return ''
  return ''
}

async function fetchSchedule() {
  if (!selectedClass.value) return
  loading.value = true
  try {
    const params = selectedJob.value ? { job_id: selectedJob.value } : {}
    const res = await scheduleAPI.getByClass(selectedClass.value, params)
    schedules.value = res.data.data.schedules
    if (!selectedJob.value && res.data.data.job_id) selectedJob.value = res.data.data.job_id
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Gagal memuat jadwal')
  } finally { loading.value = false }
}

async function exportPDF() {
  try {
    const params = selectedJob.value ? { job_id: selectedJob.value } : {}
    const res = await scheduleAPI.exportPDF(selectedClass.value, params)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url; a.download = `jadwal-kelas.pdf`; a.click()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('Gagal mengekspor PDF') }
}

async function exportExcel() {
  try {
    const params = selectedJob.value ? { job_id: selectedJob.value } : {}
    const res = await scheduleAPI.exportExcel(params)
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url; a.download = 'jadwal-pelajaran.xlsx'; a.click()
    URL.revokeObjectURL(url)
  } catch { ElMessage.error('Gagal mengekspor Excel') }
}

onMounted(async () => {
  try {
    const [cls, ts, jobsRes] = await Promise.all([
      classAPI.getAll(),
      timeSlotAPI.getAll(),
      scheduleAPI.getJobs(),
    ])
    classes.value = cls.data.data
    timeSlots.value = ts.data.data
    jobs.value = jobsRes.data.data.filter(j => j.status === 'done')

    const active = jobs.value.find(j => j.is_active)
    if (active) selectedJob.value = active.id
    if (classes.value.length > 0) {
      selectedClass.value = classes.value[0].id
      fetchSchedule()
    }
  } catch { /* silent */ }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.mt-3 { margin-top: 12px; }
.schedule-wrapper { overflow-x: auto; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 0; }
.day-header { background: #1e3a5f; color: #fff; text-align: center; padding: 10px; font-weight: 600; min-width: 130px; }
.time-header { background: #1e3a5f; color: #fff; text-align: center; padding: 10px; width: 90px; }
.time-cell { background: #f5f7fa; text-align: center; padding: 6px; }
.slot-num { font-weight: 700; font-size: 13px; color: #1e3a5f; }
.slot-time { font-size: 11px; color: #888; }
.schedule-cell { padding: 6px 8px; vertical-align: middle; min-height: 52px; }
.break-cell { background: #f0f0f0; }
.break-label { color: #888; font-size: 12px; text-align: center; padding: 8px; }
.cell-content { display: flex; flex-direction: column; gap: 2px; }
.subject-name { font-weight: 600; font-size: 12px; color: #1e3a5f; }
.subject-name.religion { color: #7d4e00; }
.teacher-name { font-size: 11px; color: #666; }
.empty-cell { color: #ccc; text-align: center; font-size: 18px; }
</style>
