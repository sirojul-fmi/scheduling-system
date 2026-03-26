<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <el-select v-model="filterYear" clearable placeholder="Filter Tahun Ajaran" @change="fetch" style="width:200px">
          <el-option v-for="y in academicYears" :key="y.id" :label="`${y.year} Sem ${y.semester}`" :value="y.id" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Kelas</el-button>
      </div>
    </el-card>
    <el-card shadow="never" class="mt-3">
      <el-table :data="classes" v-loading="loading" stripe>
        <el-table-column label="Kelas" width="80" align="center">
          <template #default="{row}"><el-tag type="primary">{{ row.name }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="grade" label="Tingkat" width="80" align="center" />
        <el-table-column label="Wali Kelas" min-width="160">
          <template #default="{row}">{{ row.homeroomTeacher?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="Tahun Ajaran" min-width="150">
          <template #default="{row}">{{ row.academicYear?.year }} Sem {{ row.academicYear?.semester }}</template>
        </el-table-column>
        <el-table-column label="Aksi" width="100" align="center" fixed="right">
          <template #default="{row}">
            <el-button-group>
              <el-button size="small" :icon="Edit" @click="openDialog(row)" />
              <el-button size="small" :icon="Delete" type="danger" @click="confirmDelete(row)" />
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Kelas' : 'Tambah Kelas'" width="460px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Tingkat" prop="grade">
          <el-select v-model="form.grade" style="width:100%">
            <el-option v-for="g in [1,2,3,4,5,6]" :key="g" :label="`Kelas ${g}`" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="Nama Kelas" prop="name"><el-input v-model="form.name" placeholder="e.g. I-A" /></el-form-item>
        <el-form-item label="Wali Kelas">
          <el-select v-model="form.homeroom_teacher_id" clearable style="width:100%">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Tahun Ajaran" prop="academic_year_id">
          <el-select v-model="form.academic_year_id" style="width:100%">
            <el-option v-for="y in academicYears" :key="y.id" :label="`${y.year} Sem ${y.semester}`" :value="y.id" />
          </el-select>
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { classAPI, academicYearAPI, teacherAPI } from '@/services/api'
const classes=ref([]), academicYears=ref([]), teachers=ref([])
const loading=ref(false), saving=ref(false), filterYear=ref(null)
const dialogVisible=ref(false), editingId=ref(null), formRef=ref(null)
const form=ref({grade:1,name:'',homeroom_teacher_id:null,academic_year_id:null})
const rules={grade:[{required:true}],name:[{required:true,message:'Nama wajib diisi'}],academic_year_id:[{required:true,message:'Pilih tahun ajaran'}]}
async function fetch(){loading.value=true;try{classes.value=(await classAPI.getAll({academic_year_id:filterYear.value})).data.data}finally{loading.value=false}}
function openDialog(row=null){editingId.value=row?.id||null;form.value=row?{grade:row.grade,name:row.name,homeroom_teacher_id:row.homeroom_teacher_id,academic_year_id:row.academic_year_id}:{grade:1,name:'',homeroom_teacher_id:null,academic_year_id:academicYears.value.find(y=>y.is_active)?.id||null};dialogVisible.value=true}
async function handleSave(){await formRef.value.validate();saving.value=true;try{editingId.value?await classAPI.update(editingId.value,form.value):await classAPI.create(form.value);ElMessage.success('Berhasil');dialogVisible.value=false;fetch()}catch(e){ElMessage.error(e.response?.data?.message||'Gagal')}finally{saving.value=false}}
async function confirmDelete(row){await ElMessageBox.confirm(`Hapus kelas "${row.name}"?`,'Konfirmasi',{type:'warning'});try{await classAPI.delete(row.id);ElMessage.success('Dihapus');fetch()}catch(e){ElMessage.error(e.response?.data?.message||'Gagal')}}
onMounted(async()=>{const[ay,t]=await Promise.all([academicYearAPI.getAll(),teacherAPI.getAll()]);academicYears.value=ay.data.data;teachers.value=t.data.data;filterYear.value=academicYears.value.find(y=>y.is_active)?.id||null;fetch()})
</script>
<style scoped>.toolbar{display:flex;justify-content:space-between;align-items:center}.mt-3{margin-top:12px}</style>
