const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const authGuard = require('./middleware/auth');
const roleGuard = require('./middleware/roleGuard');

const authCtrl = require('./controllers/authController');
const teacherCtrl = require('./controllers/teacherController');
const subjectCtrl = require('./controllers/subjectController');
const classCtrl = require('./controllers/classController');
const academicYearCtrl = require('./controllers/academicYearController');
const timeSlotCtrl = require('./controllers/timeSlotController');
const assignmentCtrl = require('./controllers/assignmentController');
const scheduleCtrl = require('./controllers/scheduleController');
const userCtrl = require('./controllers/userController');

// ===================== AUTH =====================
router.post('/auth/login', [
  body('username').notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
], authCtrl.login);

router.get('/auth/me', authGuard, authCtrl.getMe);

router.put('/auth/change-password', authGuard, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
], authCtrl.changePassword);

// ===================== TEACHERS =====================
router.get('/teachers', authGuard, teacherCtrl.getAll);
router.get('/teachers/:id', authGuard, teacherCtrl.getById);
router.post('/teachers', authGuard, roleGuard('admin'), [
  body('name').notEmpty().withMessage('Nama guru wajib diisi'),
  body('max_hours_per_day').isInt({ min: 1, max: 10 }).optional(),
  body('max_hours_per_week').isInt({ min: 1, max: 40 }).optional(),
], teacherCtrl.create);
router.put('/teachers/:id', authGuard, roleGuard('admin'), teacherCtrl.update);
router.delete('/teachers/:id', authGuard, roleGuard('admin'), teacherCtrl.remove);

// ===================== SUBJECTS =====================
router.get('/subjects', authGuard, subjectCtrl.getAll);
router.get('/subjects/:id', authGuard, subjectCtrl.getById);
router.post('/subjects', authGuard, roleGuard('admin'), [
  body('name').notEmpty().withMessage('Nama mata pelajaran wajib diisi'),
  body('code').notEmpty().withMessage('Kode wajib diisi'),
  body('type').isIn(['umum', 'keagamaan']).withMessage('Tipe harus umum atau keagamaan'),
  body('hours_per_week').isInt({ min: 1, max: 10 }).withMessage('Jam per minggu harus 1-10'),
], subjectCtrl.create);
router.put('/subjects/:id', authGuard, roleGuard('admin'), subjectCtrl.update);
router.delete('/subjects/:id', authGuard, roleGuard('admin'), subjectCtrl.remove);

// ===================== CLASSES =====================
router.get('/classes', authGuard, classCtrl.getAll);
router.get('/classes/:id', authGuard, classCtrl.getById);
router.post('/classes', authGuard, roleGuard('admin'), [
  body('grade').isInt({ min: 1, max: 6 }).withMessage('Kelas harus 1-6'),
  body('name').notEmpty().withMessage('Nama kelas wajib diisi'),
  body('academic_year_id').isInt().withMessage('Tahun ajaran wajib dipilih'),
], classCtrl.create);
router.put('/classes/:id', authGuard, roleGuard('admin'), classCtrl.update);
router.delete('/classes/:id', authGuard, roleGuard('admin'), classCtrl.remove);

// ===================== ACADEMIC YEARS =====================
router.get('/academic-years', authGuard, academicYearCtrl.getAll);
router.get('/academic-years/active', authGuard, academicYearCtrl.getActive);
router.post('/academic-years', authGuard, roleGuard('admin'), [
  body('year').notEmpty().withMessage('Tahun ajaran wajib diisi'),
  body('semester').isIn([1, 2]).withMessage('Semester harus 1 atau 2'),
], academicYearCtrl.create);
router.patch('/academic-years/:id/activate', authGuard, roleGuard('admin'), academicYearCtrl.setActive);
router.delete('/academic-years/:id', authGuard, roleGuard('admin'), academicYearCtrl.remove);

// ===================== TIME SLOTS =====================
router.get('/time-slots', authGuard, timeSlotCtrl.getAll);
router.post('/time-slots', authGuard, roleGuard('admin'), [
  body('slot_index').isInt({ min: 0 }),
  body('day_index').isInt({ min: 0, max: 5 }),
  body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('Format waktu HH:MM'),
  body('end_time').matches(/^\d{2}:\d{2}$/).withMessage('Format waktu HH:MM'),
  body('category').isIn(['lesson', 'break', 'prayer']),
], timeSlotCtrl.create);
router.post('/time-slots/bulk', authGuard, roleGuard('admin'), timeSlotCtrl.bulkCreate);
router.put('/time-slots/:id', authGuard, roleGuard('admin'), timeSlotCtrl.update);
router.delete('/time-slots/:id', authGuard, roleGuard('admin'), timeSlotCtrl.remove);

// ===================== ASSIGNMENTS =====================
router.get('/assignments', authGuard, assignmentCtrl.getAll);
router.post('/assignments', authGuard, roleGuard('admin'), [
  body('teacher_id').isInt(),
  body('subject_id').isInt(),
  body('class_id').isInt(),
  body('academic_year_id').isInt(),
], assignmentCtrl.create);
router.post('/assignments/bulk', authGuard, roleGuard('admin'), assignmentCtrl.bulkSet);
router.delete('/assignments/:id', authGuard, roleGuard('admin'), assignmentCtrl.remove);

// ===================== SCHEDULE =====================
router.get('/schedule/dashboard', authGuard, scheduleCtrl.getDashboardStats);
router.get('/schedule/jobs', authGuard, scheduleCtrl.getJobs);
router.post('/schedule/generate', authGuard, roleGuard('admin'), scheduleCtrl.generate);
router.get('/schedule/status/:jobId', authGuard, scheduleCtrl.getStatus);
router.patch('/schedule/activate/:jobId', authGuard, roleGuard('admin'), scheduleCtrl.activateJob);
router.get('/schedule/by-class/:classId', authGuard, scheduleCtrl.getByClass);
router.get('/schedule/by-teacher/:teacherId', authGuard, scheduleCtrl.getByTeacher);
router.get('/schedule/export/pdf/:classId', authGuard, roleGuard('admin', 'wali_kelas'), scheduleCtrl.exportPDF);
router.get('/schedule/export/excel', authGuard, roleGuard('admin'), scheduleCtrl.exportExcel);

// ===================== USERS =====================
router.get('/users', authGuard, roleGuard('admin'), userCtrl.getAll);
router.post('/users', authGuard, roleGuard('admin'), [
  body('name').notEmpty().withMessage('Nama wajib diisi'),
  body('username').isLength({ min: 4 }).withMessage('Username minimal 4 karakter'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'guru', 'wali_kelas']).withMessage('Role tidak valid'),
], userCtrl.create);
router.put('/users/:id', authGuard, roleGuard('admin'), userCtrl.update);
router.patch('/users/:id/reset-password', authGuard, roleGuard('admin'), [
  body('new_password').isLength({ min: 6 }),
], userCtrl.resetPassword);
router.delete('/users/:id', authGuard, roleGuard('admin'), userCtrl.remove);

module.exports = router;
