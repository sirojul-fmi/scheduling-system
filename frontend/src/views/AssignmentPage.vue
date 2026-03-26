<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-weight:600;color:#1e3a5f">Penugasan Guru → Mata Pelajaran → Kelas</span>
          <el-select v-model="selectedYear" placeholder="Tahun Ajaran" style="width:200px" @change="fetchData">
            <el-option v-for="y in academicYears" :key="y.id" :label="`${y.year} Sem ${y.semester}`" :value="y.id" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">Tambah Penugasan</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <div v-if="loading" v-loading="loading" style="min-height:200px" />
      <div v-else-if="!selectedYear">
        <el-empty description="Pilih tahun ajaran terlebih dahulu" />
      </div>
      <div v-else>
        <!-- Summary stats -->
        <el-row :gutter="12" class="mb-3">
          <el-col :span="6">
            <el-statistic title="Total Penugasan" :value="assignments.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Guru Aktif" :value="activeTeacherCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Mata Pelajaran" :value="activeSubjectCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="Kelas" :value="classes.length" />
          </el-col>
        </el-row>

        <el-table :data="assignments" stripe size="default" row-key="id">
          <el-table-column type="index" label="No." width="50" />
          <el-table-column label="Guru" min-width="160">
            <template #default="{row}">{{ row.teacher?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="Mata Pelajaran" min-width="160">
            <template #default="{row}">
              <div>{{ row.subject?.name || '-' }}</div>
              <el-tag :type="row.subject?.type === 'keagamaan' ? 'warning' : 'primary'" size="small">
                {{ row.subject?.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Kelas" width="90" align="center">
            <template #default="{row}">
              <el-tag type="info" size="default">{{ row.class?.name || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Jam/Minggu" width="110" align="center">
            <template #default="{row}">{{ row.subject?.hours_per_week || '-' }}</template>
          </el-table-column>
          <el-table-column label="Aksi" width="80" align="center" fixed="right">
            <template #default="{row}">
              <el-button size="small" :icon="Delete" type="danger" @click="confirmDelete(row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Add Assignment Dialog -->
    <el-dialog v-model="addDialogVisible" title="Tambah Penugasan Guru" width="460px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="Guru" prop="teacher_id">
          <el-select v-model="form.teacher_id" filterable placeholder="Pilih guru" style="width:100%">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Mata Pelajaran" prop="subject_id">
          <el-select v-model="form.subject_id" filterable placeholder="Pilih mata pelajaran" style="width:100%">
            <el-option-group label="Umum">
              <el-option v-for="s in subjects.filter(s=>s.type==='umum')" :key="s.id" :label="`${s.name} (${s.hours_per_week}j/mg)`" :value="s.id" />
            </el-option-group>
            <el-option-group label="Keagamaan">
              <el-option v-for="s in subjects.filter(s=>s.type==='keagamaan')" :key="s.id" :label="`${s.name} (${s.hours_per_week}j/mg)`" :value="s.id" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="Kelas" prop="class_id">
          <el-select v-model="form.class_id" placeholder="Pilih kelas" style="width:100%">
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">Batal</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Tambah</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { assignmentAPI, teacherAPI, subjectAPI, classAPI, academicYearAPI } from '@/services/api'

const assignments = ref([])
const teachers = ref([]), subjects = ref([]), classes = ref([]), academicYears = ref([])
const loading = ref(false), saving = ref(false)
const selectedYear = ref(null)
const addDialogVisible = ref(false), formRef = ref(null)
const form = ref({ teacher_id: null, subject_id: null, class_id: null })
const rules = {
  teacher_id: [{ required: true, message: 'Pilih guru' }],
  subject_id: [{ required: true, message: 'Pilih mata pelajaran' }],
  class_id: [{ required: true, message: 'Pilih kelas' }],
}

const activeTeacherCount = computed(() => new Set(assignments.value.map(a => a.teacher_id)).size)
const activeSubjectCount = computed(() => new Set(assignments.value.map(a => a.subject_id)).size)

async function fetchData() {
  if (!selectedYear.value) return
  loading.value = true
  try {
    assignments.value = (await assignmentAPI.getAll({ academic_year_id: selectedYear.value })).data.data
  } finally { loading.value = false }
}

function openAddDialog() {
  form.value = { teacher_id: null, subject_id: null, class_id: null }
  addDialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    await assignmentAPI.create({ ...form.value, academic_year_id: selectedYear.value })
    ElMessage.success('Penugasan berhasil ditambahkan')
    addDialogVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Gagal menambahkan penugasan')
  } finally { saving.value = false }
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(`Hapus penugasan "${row.teacher?.name} - ${row.subject?.name} - ${row.class?.name}"?`, 'Konfirmasi Hapus', { type: 'warning' })
  try {
    await assignmentAPI.delete(row.id)
    ElMessage.success('Penugasan dihapus')
    fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
}

onMounted(async () => {
  const [ay, tc, sb, cl] = await Promise.all([
    academicYearAPI.getAll(),
    teacherAPI.getAll(),
    subjectAPI.getAll(),
    classAPI.getAll(),
  ])
  academicYears.value = ay.data.data
  teachers.value = tc.data.data
  subjects.value = sb.data.data
  classes.value = cl.data.data

  const active = academicYears.value.find(y => y.is_active)
  if (active) { selectedYear.value = active.id; fetchData() }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.mt-3 { margin-top: 12px; }
.mb-3 { margin-bottom: 16px; }
</style>
