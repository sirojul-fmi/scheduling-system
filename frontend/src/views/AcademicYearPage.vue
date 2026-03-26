<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span style="font-weight:600;color:#1e3a5f">Manajemen Tahun Ajaran</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Tahun Ajaran</el-button>
      </div>
    </el-card>
    <el-card shadow="never" class="mt-3">
      <el-table :data="years" v-loading="loading" stripe>
        <el-table-column prop="year" label="Tahun Ajaran" min-width="150" />
        <el-table-column prop="semester" label="Semester" width="100" align="center" />
        <el-table-column label="Status" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.is_active?'success':'info'" size="small">{{row.is_active?'Aktif':'Nonaktif'}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Aksi" width="150" align="center">
          <template #default="{row}">
            <el-button v-if="!row.is_active" size="small" type="success" @click="setActive(row)">Aktifkan</el-button>
            <el-button v-if="!row.is_active" size="small" type="danger" :icon="Delete" @click="confirmDelete(row)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="Tambah Tahun Ajaran" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="Tahun Ajaran" prop="year"><el-input v-model="form.year" placeholder="2025/2026" /></el-form-item>
        <el-form-item label="Semester" prop="semester">
          <el-radio-group v-model="form.semester">
            <el-radio :label="1">Ganjil (1)</el-radio><el-radio :label="2">Genap (2)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Langsung Aktif">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">Batal</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Simpan</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { academicYearAPI } from '@/services/api'
const years=ref([]), loading=ref(false), saving=ref(false)
const dialogVisible=ref(false), formRef=ref(null)
const form=ref({year:'',semester:1,is_active:false})
const rules={year:[{required:true,message:'Tahun wajib diisi'}],semester:[{required:true}]}
async function fetch(){loading.value=true;try{years.value=(await academicYearAPI.getAll()).data.data}finally{loading.value=false}}
function openDialog(){form.value={year:'',semester:1,is_active:false};dialogVisible.value=true}
async function handleSave(){await formRef.value.validate();saving.value=true;try{await academicYearAPI.create(form.value);ElMessage.success('Berhasil');dialogVisible.value=false;fetch()}catch(e){ElMessage.error(e.response?.data?.message||'Gagal')}finally{saving.value=false}}
async function setActive(row){try{await academicYearAPI.activate(row.id);ElMessage.success(`TA ${row.year} Sem ${row.semester} diaktifkan`);fetch()}catch{ElMessage.error('Gagal')}}
async function confirmDelete(row){await ElMessageBox.confirm('Hapus tahun ajaran ini?','Konfirmasi',{type:'warning'});try{await academicYearAPI.delete(row.id);ElMessage.success('Dihapus');fetch()}catch(e){ElMessage.error(e.response?.data?.message||'Gagal')}}
onMounted(fetch)
</script>
<style scoped>.toolbar{display:flex;justify-content:space-between;align-items:center}.mt-3{margin-top:12px}</style>
