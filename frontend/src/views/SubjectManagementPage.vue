<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div style="display:flex;gap:8px">
          <el-input v-model="search" placeholder="Cari mata pelajaran..." clearable :prefix-icon="Search" style="width:260px" @input="fetch" />
          <el-select v-model="filterType" clearable placeholder="Semua Tipe" @change="fetch" style="width:150px">
            <el-option label="Umum" value="umum" /><el-option label="Keagamaan" value="keagamaan" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Mapel</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table :data="subjects" v-loading="loading" stripe size="default">
        <el-table-column prop="name" label="Nama Mata Pelajaran" min-width="180" />
        <el-table-column prop="code" label="Kode" width="80" align="center" />
        <el-table-column label="Tipe" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'keagamaan' ? 'warning' : 'primary'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hours_per_week" label="Jam/Minggu" width="110" align="center" />
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

    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Mapel' : 'Tambah Mapel'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="Nama Mapel" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="Kode" prop="code"><el-input v-model="form.code" style="width:120px" /></el-form-item>
        <el-form-item label="Tipe" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="umum">Umum</el-radio>
            <el-radio label="keagamaan">Keagamaan</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Jam/Minggu" prop="hours_per_week">
          <el-input-number v-model="form.hours_per_week" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="Deskripsi">
          <el-input v-model="form.description" type="textarea" :rows="2" />
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
import { subjectAPI } from '@/services/api'

const subjects = ref([])
const loading = ref(false), saving = ref(false)
const search = ref(''), filterType = ref('')
const dialogVisible = ref(false), editingId = ref(null)
const formRef = ref(null)
const form = ref({ name:'', code:'', type:'umum', hours_per_week:2, description:'' })
const rules = {
  name:[{required:true,message:'Nama wajib diisi'}],
  code:[{required:true,message:'Kode wajib diisi'}],
  type:[{required:true}], hours_per_week:[{required:true}]
}

async function fetch() {
  loading.value = true
  try { subjects.value = (await subjectAPI.getAll({ search: search.value, type: filterType.value })).data.data }
  finally { loading.value = false }
}

function openDialog(row=null) {
  editingId.value = row?.id||null
  form.value = row ? { name:row.name, code:row.code, type:row.type, hours_per_week:row.hours_per_week, description:row.description||'' } : { name:'', code:'', type:'umum', hours_per_week:2, description:'' }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value ? await subjectAPI.update(editingId.value, form.value) : await subjectAPI.create(form.value)
    ElMessage.success('Berhasil disimpan')
    dialogVisible.value = false; fetch()
  } catch(e) { ElMessage.error(e.response?.data?.message||'Gagal') }
  finally { saving.value = false }
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(`Hapus "${row.name}"?`, 'Konfirmasi', { type:'warning' })
  try { await subjectAPI.delete(row.id); ElMessage.success('Berhasil dihapus'); fetch() }
  catch(e) { ElMessage.error(e.response?.data?.message||'Gagal') }
}

onMounted(fetch)
</script>
<style scoped>
.toolbar{display:flex;justify-content:space-between;align-items:center}
.mt-3{margin-top:12px}
</style>
