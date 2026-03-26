<template>
  <div>
    <el-card shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span style="font-weight:600;color:#1e3a5f">Manajemen Pengguna Sistem</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">Tambah Pengguna</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table :data="users" v-loading="loading" stripe size="default">
        <el-table-column prop="name" label="Nama" min-width="160" />
        <el-table-column prop="username" label="Username" width="140" />
        <el-table-column label="Role" width="120" align="center">
          <template #default="{row}">
            <el-tag :type="roleColor(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Terhubung ke Guru" min-width="160">
          <template #default="{row}">{{ row.teacher?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="Status" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? 'Aktif' : 'Nonaktif' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Aksi" width="140" align="center" fixed="right">
          <template #default="{row}">
            <el-button-group>
              <el-button size="small" :icon="Edit" @click="openDialog(row)" />
              <el-button size="small" :icon="Key" @click="openResetDialog(row)" title="Reset Password" />
              <el-button size="small" :icon="Delete" type="danger" @click="confirmDelete(row)" />
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Pengguna' : 'Tambah Pengguna'" width="460px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
        <el-form-item label="Nama Lengkap" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="Password" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="Administrator" value="admin" />
            <el-option label="Guru" value="guru" />
            <el-option label="Wali Kelas" value="wali_kelas" />
          </el-select>
        </el-form-item>
        <el-form-item label="Hubungkan ke Guru">
          <el-select v-model="form.teacher_id" clearable filterable style="width:100%" placeholder="Opsional">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingId" label="Status">
          <el-switch v-model="form.is_active" active-text="Aktif" inactive-text="Nonaktif" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Batal</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Simpan</el-button>
      </template>
    </el-dialog>

    <!-- Reset Password Dialog -->
    <el-dialog v-model="resetDialogVisible" title="Reset Password Pengguna" width="400px" destroy-on-close>
      <p>Reset password untuk: <strong>{{ resetTarget?.name }}</strong></p>
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="130px">
        <el-form-item label="Password Baru" prop="new_password">
          <el-input v-model="resetForm.new_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">Batal</el-button>
        <el-button type="warning" :loading="saving" @click="handleReset">Reset Password</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Key } from '@element-plus/icons-vue'
import { userAPI, teacherAPI } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const users = ref([]), teachers = ref([])
const loading = ref(false), saving = ref(false)
const dialogVisible = ref(false), editingId = ref(null), formRef = ref(null)
const resetDialogVisible = ref(false), resetTarget = ref(null), resetFormRef = ref(null)
const resetForm = ref({ new_password: '' })
const resetRules = { new_password: [{ required: true, min: 6, message: 'Minimal 6 karakter' }] }

const form = ref({ name: '', username: '', password: '', role: 'guru', teacher_id: null, is_active: true })
const rules = {
  name: [{ required: true, message: 'Nama wajib diisi' }],
  username: [{ required: true, min: 4, message: 'Username minimal 4 karakter' }],
  password: [{ required: true, min: 6, message: 'Password minimal 6 karakter' }],
  role: [{ required: true }],
}

const roleColor = (r) => ({ admin: 'danger', guru: 'primary', wali_kelas: 'warning' }[r] || 'info')
const roleLabel = (r) => ({ admin: 'Admin', guru: 'Guru', wali_kelas: 'Wali Kelas' }[r] || r)

async function fetch() {
  loading.value = true
  try { users.value = (await userAPI.getAll()).data.data }
  finally { loading.value = false }
}

function openDialog(row = null) {
  editingId.value = row?.id || null
  form.value = row
    ? { name: row.name, username: row.username, role: row.role, teacher_id: row.teacher_id, is_active: row.is_active }
    : { name: '', username: '', password: '', role: 'guru', teacher_id: null, is_active: true }
  dialogVisible.value = true
}

function openResetDialog(row) {
  resetTarget.value = row
  resetForm.value = { new_password: '' }
  resetDialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    editingId.value
      ? await userAPI.update(editingId.value, form.value)
      : await userAPI.create(form.value)
    ElMessage.success('Berhasil disimpan')
    dialogVisible.value = false; fetch()
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
  finally { saving.value = false }
}

async function handleReset() {
  await resetFormRef.value.validate()
  saving.value = true
  try {
    await userAPI.resetPassword(resetTarget.value.id, resetForm.value)
    ElMessage.success('Password berhasil direset')
    resetDialogVisible.value = false
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
  finally { saving.value = false }
}

async function confirmDelete(row) {
  if (row.id === authStore.user?.id) { ElMessage.warning('Tidak dapat menghapus akun sendiri'); return }
  await ElMessageBox.confirm(`Hapus pengguna "${row.name}"?`, 'Konfirmasi', { type: 'warning' })
  try { await userAPI.delete(row.id); ElMessage.success('Dihapus'); fetch() }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Gagal') }
}

onMounted(async () => {
  const [, t] = await Promise.all([fetch(), teacherAPI.getAll()])
  teachers.value = t.data.data
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.mt-3 { margin-top: 12px; }
</style>
