<template>
  <div>
    <el-row :gutter="16">
      <!-- Config Panel -->
      <el-col :md="10">
        <el-card shadow="never">
          <template #header>
            <span>⚙️ Konfigurasi Algoritma Genetika</span>
          </template>
          <el-form :model="gaParams" label-width="160px" size="default">
            <el-form-item label="Tahun Ajaran">
              <el-select v-model="gaParams.academic_year_id" placeholder="Pilih tahun ajaran" style="width:100%">
                <el-option v-for="y in academicYears" :key="y.id" :label="`${y.year} Sem ${y.semester}`" :value="y.id" />
              </el-select>
            </el-form-item>
            <el-divider><span style="font-size:11px;color:#999">Parameter GA</span></el-divider>
            <el-form-item label="Ukuran Populasi">
              <el-slider v-model="gaParams.population_size" :min="50" :max="500" :step="50" show-input input-size="small" />
            </el-form-item>
            <el-form-item label="Jumlah Generasi">
              <el-slider v-model="gaParams.max_generations" :min="50" :max="1000" :step="50" show-input input-size="small" />
            </el-form-item>
            <el-form-item label="Crossover Rate">
              <el-slider v-model="gaParams.crossover_rate" :min="0.5" :max="1.0" :step="0.05" :format-tooltip="v => v.toFixed(2)" show-input input-size="small" />
            </el-form-item>
            <el-form-item label="Mutation Rate">
              <el-slider v-model="gaParams.mutation_rate" :min="0.01" :max="0.2" :step="0.01" :format-tooltip="v => v.toFixed(2)" show-input input-size="small" />
            </el-form-item>
            <el-form-item label="Elitism Rate">
              <el-slider v-model="gaParams.elitism_rate" :min="0.05" :max="0.3" :step="0.05" :format-tooltip="v => v.toFixed(2)" show-input input-size="small" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :icon="MagicStick" :loading="isRunning" :disabled="!gaParams.academic_year_id" @click="startGenerate" style="width:100%">
                {{ isRunning ? 'Sedang Berjalan...' : '🚀 Generate Jadwal' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- Progress Panel -->
      <el-col :md="14">
        <el-card shadow="never" style="min-height:400px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>📈 Progress Generate</span>
              <el-tag v-if="currentJob" :type="statusTagType" size="default">{{ statusLabel }}</el-tag>
            </div>
          </template>

          <div v-if="!currentJob">
            <el-empty description="Belum ada proses yang berjalan" :image-size="100" />
          </div>

          <div v-else>
            <!-- Progress bar -->
            <el-progress
              :percentage="progressPercent"
              :status="currentJob.status === 'done' ? 'success' : currentJob.status === 'failed' ? 'exception' : undefined"
              :stroke-width="16"
              striped
              :striped-flow="isRunning"
              style="margin-bottom:16px"
            />

            <!-- Stats -->
            <el-row :gutter="12" class="mb-3">
              <el-col :span="8">
                <el-statistic title="Generasi" :value="lastLog?.generation || 0" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="Best Fitness" :value="lastLog?.bestFitness || 0" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="Hard Violations" :value="lastLog?.hardViolations ?? '-'" :value-style="{ color: lastLog?.hardViolations === 0 ? '#67c23a' : '#f56c6c' }" />
              </el-col>
            </el-row>

            <!-- Chart -->
            <div v-if="chartData.labels.length > 0" style="height:200px">
              <LineChart :data="chartData" :options="chartOptions" />
            </div>

            <!-- Log terminal -->
            <div class="log-terminal" ref="logTerminal">
              <div v-for="(log, i) in gaLogs" :key="i" class="log-line">
                <span class="log-gen">Gen {{ log.generation }}</span>
                <span class="log-fit">Fitness: {{ log.bestFitness }}</span>
                <span class="log-avg">Avg: {{ log.avgFitness }}</span>
                <span :class="['log-viol', log.hardViolations === 0 ? 'ok' : 'err']">
                  Violations: {{ log.hardViolations }}
                </span>
              </div>
            </div>

            <!-- Done actions -->
            <div v-if="currentJob.status === 'done'" style="margin-top:16px;display:flex;gap:8px">
              <el-button type="success" :icon="Check" @click="activateSchedule">Aktifkan Jadwal Ini</el-button>
              <el-button :icon="Grid" @click="$router.push('/schedule/class')">Lihat Jadwal</el-button>
            </div>

            <el-alert v-if="currentJob.status === 'failed'" :title="currentJob.error_message || 'Proses gagal'" type="error" :closable="false" style="margin-top:12px" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Previous jobs table -->
    <el-card shadow="never" class="mt-3">
      <template #header><span>Riwayat Generate</span></template>
      <el-table :data="jobs" size="small" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="Tahun Ajaran" width="150">
          <template #default="{row}">{{ row.academicYear?.year }} Sem {{ row.academicYear?.semester }}</template>
        </el-table-column>
        <el-table-column label="Status" width="100">
          <template #default="{row}">
            <el-tag :type="statusColor(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="best_fitness" label="Best Fitness" width="120" align="center" />
        <el-table-column prop="total_generations" label="Generasi" width="90" align="center" />
        <el-table-column label="Selesai" min-width="150">
          <template #default="{row}">{{ formatDate(row.finished_at) }}</template>
        </el-table-column>
        <el-table-column label="Aktif" width="70" align="center">
          <template #default="{row}">
            <el-tag v-if="row.is_active" type="success" size="small">✓</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Aksi" width="80" align="center">
          <template #default="{row}">
            <el-button v-if="row.status==='done' && !row.is_active" size="small" @click="activateById(row.id)">Aktifkan</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, Check, Grid } from '@element-plus/icons-vue'
import { Line as LineChart } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { scheduleAPI, academicYearAPI } from '@/services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const academicYears = ref([])
const jobs = ref([])
const currentJob = ref(null)
const gaLogs = ref([])
const lastLog = ref(null)
const isRunning = ref(false)
const logTerminal = ref(null)
let pollTimer = null

const gaParams = ref({
  academic_year_id: null,
  population_size: 100,
  max_generations: 200,
  crossover_rate: 0.8,
  mutation_rate: 0.05,
  elitism_rate: 0.1,
  tournament_size: 3,
})

const statusTagType = computed(() => {
  const map = { pending:'info', running:'warning', done:'success', failed:'danger' }
  return map[currentJob.value?.status] || 'info'
})

const statusLabel = computed(() => {
  const map = { pending:'Menunggu', running:'Berjalan', done:'Selesai', failed:'Gagal' }
  return map[currentJob.value?.status] || '-'
})

const progressPercent = computed(() => {
  if (!currentJob.value || !lastLog.value) return 0
  const maxGen = currentJob.value.ga_params?.max_generations || 200
  if (currentJob.value.status === 'done') return 100
  return Math.min(100, Math.round((lastLog.value.generation / maxGen) * 100))
})

const chartData = computed(() => {
  const logs = gaLogs.value
  return {
    labels: logs.map(l => `${l.generation}`),
    datasets: [
      { label: 'Best Fitness', data: logs.map(l => l.best_fitness), borderColor: '#1e3a5f', backgroundColor: 'rgba(30,58,95,0.1)', tension: 0.3, pointRadius: 2 },
      { label: 'Avg Fitness', data: logs.map(l => l.avg_fitness), borderColor: '#e6a23c', backgroundColor: 'rgba(230,162,60,0.1)', tension: 0.3, pointRadius: 2 },
    ]
  }
})

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: { x: { ticks: { maxTicksLimit: 10 } } }
}

const statusColor = (s) => ({ pending:'info', running:'warning', done:'success', failed:'danger' }[s] || 'info')
const formatDate = (dt) => dt ? new Date(dt).toLocaleString('id-ID') : '-'

async function startGenerate() {
  isRunning.value = true
  gaLogs.value = []
  currentJob.value = null
  lastLog.value = null
  try {
    const res = await scheduleAPI.generate(gaParams.value)
    const jobId = res.data.data.job_id
    startPolling(jobId)
    fetchJobs()
  } catch(e) {
    ElMessage.error(e.response?.data?.message || 'Gagal memulai generate')
    isRunning.value = false
  }
}

function startPolling(jobId) {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => pollStatus(jobId), 2000)
  pollStatus(jobId)
}

async function pollStatus(jobId) {
  try {
    const res = await scheduleAPI.getStatus(jobId)
    const job = res.data.data
    currentJob.value = job
    if (job.gaLogs && job.gaLogs.length > 0) {
      gaLogs.value = job.gaLogs
      lastLog.value = {
        generation: job.gaLogs[job.gaLogs.length-1].generation,
        bestFitness: job.gaLogs[job.gaLogs.length-1].best_fitness,
        avgFitness: job.gaLogs[job.gaLogs.length-1].avg_fitness,
        hardViolations: job.gaLogs[job.gaLogs.length-1].hard_violations,
      }
      nextTick(() => {
        if (logTerminal.value) logTerminal.value.scrollTop = logTerminal.value.scrollHeight
      })
    }
    if (job.status === 'done' || job.status === 'failed') {
      clearInterval(pollTimer)
      isRunning.value = false
      fetchJobs()
      if (job.status === 'done') ElMessage.success('Generate jadwal selesai!')
    }
  } catch { /* silent */ }
}

async function activateSchedule() {
  if (!currentJob.value) return
  await activateById(currentJob.value.id)
}

async function activateById(id) {
  try {
    await scheduleAPI.activateJob(id)
    ElMessage.success('Jadwal berhasil diaktifkan')
    fetchJobs()
    if (currentJob.value?.id === id) currentJob.value.is_active = true
  } catch(e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
}

async function fetchJobs() {
  try { jobs.value = (await scheduleAPI.getJobs({ academic_year_id: gaParams.value.academic_year_id })).data.data }
  catch { /* silent */ }
}

onMounted(async () => {
  try {
    const [ayRes] = await Promise.all([academicYearAPI.getAll()])
    academicYears.value = ayRes.data.data
    const active = academicYears.value.find(y => y.is_active)
    if (active) gaParams.value.academic_year_id = active.id
  } catch { /* silent */ }
  fetchJobs()
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
.mb-3 { margin-bottom: 12px; }
.mt-3 { margin-top: 16px; }
.log-terminal {
  background: #1a1a2e; border-radius: 8px; padding: 12px;
  max-height: 140px; overflow-y: auto; font-family: monospace;
  margin-top: 12px;
}
.log-line { display: flex; gap: 16px; padding: 2px 0; font-size: 12px; }
.log-gen { color: #8baac7; width: 70px; }
.log-fit { color: #67c23a; width: 130px; }
.log-avg { color: #e6a23c; width: 130px; }
.log-viol.ok { color: #67c23a; }
.log-viol.err { color: #f56c6c; }
</style>
