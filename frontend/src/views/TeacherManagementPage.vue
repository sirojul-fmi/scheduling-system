<template>
  <div>
    <!-- Toolbar -->
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <el-input v-model="search" placeholder="Cari nama guru..." clearable :prefix-icon="Search" style="width: 280px" @input="fetchTeachers" />
        <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Guru</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" class="mt-3">
      <el-table :data="teachers" v-loading="loading" stripe row-key="id" size="default">
        <el-table-column prop="name" label="Nama Guru" min-width="180" />
        <el-table-column prop="nip" label="NIP" width="160" show-overflow-tooltip />
        <el-table-column prop="email" label="Email" min-width="170" show-overflow-tooltip />
        <el-table-column label="Maks Jam" width="130" align="center">
          <template #default="{ row }">
            <span>{{ row.max_hours_per_day }}j/hari &bull; {{ row.max_hours_per_week }}j/minggu</span>
          </template>
        </el-table-column>
        <el-table-column label="Preferensi Hari" min-width="180">
          <template #default="{ row }">
            <span v-for="p in row.dayPreferences" :key="p.day_index">
              <el-tag :type="prefColor(p.preference_level)" size="small" class="mr-1">
                {{ dayShort[p.day_index] }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Aksi" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" :icon="Edit" @click="openDialog(row)" />
              <el-button size="small" :icon="Delete" type="danger" @click="confirmDelete(row)" />
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog Form -->
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Guru' : 'Tambah Guru'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" size="default">
        <el-form-item label="Nama Guru" prop="name">
          <el-input v-model="form.name" placeholder="Nama lengkap" />
        </el-form-item>
        <el-form-item label="NIP">
          <el-input v-model="form.nip" placeholder="Opsional" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" placeholder="email@sekolah.sch.id" />
        </el-form-item>
        <el-form-item label="Maks Jam/Hari" prop="max_hours_per_day">
          <el-input-number v-model="form.max_hours_per_day" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="Maks Jam/Minggu" prop="max_hours_per_week">
          <el-input-number v-model="form.max_hours_per_week" :min="1" :max="40" />
        </el-form-item>
        <el-form-item label="Preferensi Hari">
          <div class="pref-grid">
            <div v-for="(dayName, idx) in dayNames" :key="idx" class="pref-item">
              <span class="pref-day">{{ dayName }}</span>
              <el-rate
                v-model="form.day_preferences[idx].preference_level"
                :max="3"
                :colors="['#f56c6c', '#e6a23c', '#67c23a']"
                :texts="['Tidak Suka', 'Netral', 'Suka']"
                show-text
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Batal</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Simpan</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { teacherAPI } from '@/services/api'

const teachers = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const dayShort = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const defaultForm = () => ({
  name: '', nip: '', email: '',
  max_hours_per_day: 6, max_hours_per_week: 24,
  day_preferences: dayNames.map((_, i) => ({ day_index: i, preference_level: 2 })),
})

const form = ref(defaultForm())
const rules = {
  name: [{ required: true, message: 'Nama wajib diisi' }],
  max_hours_per_day: [{ required: true }],
  max_hours_per_week: [{ required: true }],
}

const prefColor = (lvl) => lvl === 1 ? 'danger' : lvl === 3 ? 'success' : 'info'

async function fetchTeachers() {
  loading.value = true
  try {
    const res = await teacherAPI.getAll({ search: search.value })
    teachers.value = res.data.data
  } finally { loading.value = false }
}

function openDialog(row = null) {
  editingId.value = row?.id || null
  if (row) {
    form.value = {
      name: row.name, nip: row.nip || '', email: row.email || '',
      max_hours_per_day: row.max_hours_per_day, max_hours_per_week: row.max_hours_per_week,
      is_active: row.is_active,
      day_preferences: [0,1,2,3,4,5].map(i => {
        const pref = row.dayPreferences?.find(p => p.day_index === i)
        return { day_index: i, preference_level: pref?.preference_level || 2 }
      }),
    }
  } else {
    form.value = defaultForm()
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (editingId.value) {
      await teacherAPI.update(editingId.value, form.value)
      ElMessage.success('Data guru berhasil diperbarui')
    } else {
      await teacherAPI.create(form.value)
      ElMessage.success('Guru berhasil ditambahkan')
    }
    dialogVisible.value = false
    fetchTeachers()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Gagal menyimpan')
  } finally { saving.value = false }
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(`Hapus guru "${row.name}"?`, 'Konfirmasi Hapus', { type: 'warning' })
  try {
    await teacherAPI.delete(row.id)
    ElMessage.success('Guru berhasil dihapus')
    fetchTeachers()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Gagal menghapus')
  }
}

onMounted(fetchTeachers)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar-card, .mt-3 { margin-bottom: 0; }
.mt-3 { margin-top: 12px; }
.mr-1 { margin-right: 2px; }
.pref-grid { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.pref-item { display: flex; align-items: center; gap: 12px; }
.pref-day { width: 50px; font-size: 13px; color: #555; }
</style>
