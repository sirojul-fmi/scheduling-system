<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span style="font-weight:600;color:#1e3a5f">Pengaturan Slot Waktu Harian</span>
        <div style="display:flex;gap:8px">
          <el-button @click="openBulkDialog">Atur Template Otomatis</el-button>
          <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Slot</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-tabs v-model="activeDay">
        <el-tab-pane v-for="(dayName, idx) in DAY_NAMES" :key="idx" :label="dayName" :name="String(idx)">
          <el-table :data="slotsByDay[idx] || []" v-loading="loading" stripe size="small">
            <el-table-column label="Jam" width="60" align="center">
              <template #default="{row}"><strong>{{ row.slot_index + 1 }}</strong></template>
            </el-table-column>
            <el-table-column prop="start_time" label="Mulai" width="90" align="center">
              <template #default="{row}">{{ row.start_time?.substring(0,5) }}</template>
            </el-table-column>
            <el-table-column prop="end_time" label="Selesai" width="90" align="center">
              <template #default="{row}">{{ row.end_time?.substring(0,5) }}</template>
            </el-table-column>
            <el-table-column label="Kategori" width="130" align="center">
              <template #default="{row}">
                <el-tag :type="catColor(row.category)" size="small">{{ catLabel(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="label" label="Keterangan" min-width="120" />
            <el-table-column label="Aksi" width="90" align="center">
              <template #default="{row}">
                <el-button-group>
                  <el-button size="small" :icon="Edit" @click="openDialog(row)" />
                  <el-button size="small" :icon="Delete" type="danger" @click="confirmDelete(row)" />
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Slot Waktu' : 'Tambah Slot Waktu'" width="420px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Hari" prop="day_index">
          <el-select v-model="form.day_index" style="width:100%">
            <el-option v-for="(d,i) in DAY_NAMES" :key="i" :label="d" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="No. Slot" prop="slot_index">
          <el-input-number v-model="form.slot_index" :min="0" :max="20" />
          <span class="hint">0 = Jam ke-1</span>
        </el-form-item>
        <el-form-item label="Mulai" prop="start_time">
          <el-time-picker v-model="form.start_time" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="Selesai" prop="end_time">
          <el-time-picker v-model="form.end_time" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <el-form-item label="Kategori" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio label="lesson">Pelajaran</el-radio>
            <el-radio label="break">Istirahat</el-radio>
            <el-radio label="prayer">Sholat</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Keterangan">
          <el-input v-model="form.label" placeholder="Opsional" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Batal</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Simpan</el-button>
      </template>
    </el-dialog>

    <!-- Bulk template dialog -->
    <el-dialog v-model="bulkDialogVisible" title="Buat Template Slot Waktu Otomatis" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">
        Ini akan <strong>menghapus semua slot waktu</strong> yang ada dan menggantinya dengan template standar MIS At-Taqwa.
      </el-alert>
      <p style="color:#555;font-size:13px">Template terdiri dari 10 slot per hari (Senin-Sabtu), mencakup:</p>
      <ul style="color:#555;font-size:13px">
        <li>Jam 1-3: 07:00 – 08:45 (Pelajaran)</li>
        <li>Jam 4: 08:45 – 09:00 (Istirahat)</li>
        <li>Jam 5-7: 09:00 – 10:45 (Pelajaran)</li>
        <li>Jam 8: 10:45 – 11:00 (Sholat Dhuha)</li>
        <li>Jam 9-10: 11:00 – 12:10 (Pelajaran)</li>
      </ul>
      <template #footer>
        <el-button @click="bulkDialogVisible = false">Batal</el-button>
        <el-button type="warning" :loading="saving" @click="applyTemplate">Terapkan Template</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { timeSlotAPI } from '@/services/api'

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const timeSlots = ref([])
const loading = ref(false), saving = ref(false)
const dialogVisible = ref(false), bulkDialogVisible = ref(false)
const editingId = ref(null), activeDay = ref('0'), formRef = ref(null)

const defaultForm = () => ({ day_index: 0, slot_index: 0, start_time: '07:00', end_time: '07:35', category: 'lesson', label: '' })
const form = ref(defaultForm())

const rules = {
  day_index: [{ required: true }],
  slot_index: [{ required: true }],
  start_time: [{ required: true, message: 'Waktu mulai wajib diisi' }],
  end_time: [{ required: true, message: 'Waktu selesai wajib diisi' }],
  category: [{ required: true }],
}

const slotsByDay = computed(() => {
  const map = {}
  for (const s of timeSlots.value) {
    if (!map[s.day_index]) map[s.day_index] = []
    map[s.day_index].push(s)
  }
  for (const k of Object.keys(map)) map[k].sort((a, b) => a.slot_index - b.slot_index)
  return map
})

const catColor = (c) => ({ lesson: 'success', break: 'warning', prayer: 'primary' }[c] || 'info')
const catLabel = (c) => ({ lesson: 'Pelajaran', break: 'Istirahat', prayer: 'Sholat' }[c] || c)

async function fetch() {
  loading.value = true
  try { timeSlots.value = (await timeSlotAPI.getAll()).data.data }
  finally { loading.value = false }
}

function openDialog(row = null) {
  editingId.value = row?.id || null
  form.value = row ? {
    day_index: row.day_index, slot_index: row.slot_index,
    start_time: row.start_time?.substring(0, 5), end_time: row.end_time?.substring(0, 5),
    category: row.category, label: row.label || ''
  } : { ...defaultForm(), day_index: parseInt(activeDay.value) }
  dialogVisible.value = true
}

function openBulkDialog() { bulkDialogVisible.value = true }

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await timeSlotAPI.update(editingId.value, form.value) : await timeSlotAPI.create(form.value)
    ElMessage.success('Berhasil disimpan')
    dialogVisible.value = false; fetch()
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
  finally { saving.value = false }
}

async function applyTemplate() {
  saving.value = true
  const dailySchedule = [
    { slot_index: 0, start_time: '07:00', end_time: '07:35', category: 'lesson' },
    { slot_index: 1, start_time: '07:35', end_time: '08:10', category: 'lesson' },
    { slot_index: 2, start_time: '08:10', end_time: '08:45', category: 'lesson' },
    { slot_index: 3, start_time: '08:45', end_time: '09:00', category: 'break', label: 'Istirahat' },
    { slot_index: 4, start_time: '09:00', end_time: '09:35', category: 'lesson' },
    { slot_index: 5, start_time: '09:35', end_time: '10:10', category: 'lesson' },
    { slot_index: 6, start_time: '10:10', end_time: '10:45', category: 'lesson' },
    { slot_index: 7, start_time: '10:45', end_time: '11:00', category: 'prayer', label: 'Sholat Dhuha' },
    { slot_index: 8, start_time: '11:00', end_time: '11:35', category: 'lesson' },
    { slot_index: 9, start_time: '11:35', end_time: '12:10', category: 'lesson' },
  ]
  const slots = []
  for (let day = 0; day <= 5; day++) {
    for (const s of dailySchedule) slots.push({ ...s, day_index: day })
  }
  try {
    await timeSlotAPI.bulkCreate({ slots })
    ElMessage.success(`${slots.length} slot waktu berhasil dibuat`)
    bulkDialogVisible.value = false; fetch()
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
  finally { saving.value = false }
}

async function confirmDelete(row) {
  await ElMessageBox.confirm('Hapus slot waktu ini?', 'Konfirmasi', { type: 'warning' })
  try { await timeSlotAPI.delete(row.id); ElMessage.success('Dihapus'); fetch() }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
}

onMounted(fetch)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.mt-3 { margin-top: 12px; }
.hint { font-size: 11px; color: #999; margin-left: 8px; }
</style>
