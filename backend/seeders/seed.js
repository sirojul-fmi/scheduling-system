require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { sequelize, User, Teacher, TeacherDayPreference, Subject, AcademicYear, Class, TimeSlot, Assignment } = require('../src/models');

async function seed() {
  console.log('🌱 Starting database seed...');

  await sequelize.sync({ force: true });
  console.log('✅ Database synced');

  // ---- ACADEMIC YEAR ----
  const academicYear = await AcademicYear.create({ year: '2025/2026', semester: 1, is_active: true });
  console.log('✅ Academic year created');

  // ---- TEACHERS ----
  const teacherData = [
    { name: 'Ahmad Fauzi, S.Pd', nip: '198501012010011001', email: 'ahmad.fauzi@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
    { name: 'Siti Rahmawati, S.Pd.I', nip: '198703152012012002', email: 'siti.rahmawati@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
    { name: 'Budi Santoso, S.Pd', nip: '199002202015011003', email: 'budi.santoso@mis-attaqwa.sch.id', max_hours_per_day: 5, max_hours_per_week: 20 },
    { name: 'Dewi Lestari, S.Pd.I', nip: '198809052013012004', email: 'dewi.lestari@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
    { name: 'Hendra Kurniawan, S.Pd', nip: '199105102016011005', email: 'hendra.k@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
    { name: 'Nurul Hidayah, S.Pd.I', nip: '198612082011012006', email: 'nurul.hidayah@mis-attaqwa.sch.id', max_hours_per_day: 5, max_hours_per_week: 20 },
    { name: 'Rizky Pratama, S.Pd', nip: '199308152018011007', email: 'rizky.pratama@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
    { name: 'Fitri Handayani, S.Pd', nip: '199204202017012008', email: 'fitri.h@mis-attaqwa.sch.id', max_hours_per_day: 6, max_hours_per_week: 24 },
  ];

  const teachers = await Teacher.bulkCreate(teacherData);
  console.log(`✅ ${teachers.length} teachers created`);

  // Day preferences for each teacher
  for (const teacher of teachers) {
    const prefs = [0, 1, 2, 3, 4, 5].map(d => ({
      teacher_id: teacher.id,
      day_index: d,
      preference_level: d === 5 ? 1 : (d === 4 ? 2 : 3), // Prefer Mon-Thu, neutral Fri, dislike Sat
    }));
    await TeacherDayPreference.bulkCreate(prefs);
  }
  console.log('✅ Teacher day preferences created');

  // ---- SUBJECTS ----
  const subjectData = [
    // Mata Pelajaran Umum
    { name: 'Matematika', code: 'MTK', type: 'umum', hours_per_week: 5 },
    { name: 'Bahasa Indonesia', code: 'BIND', type: 'umum', hours_per_week: 5 },
    { name: 'Ilmu Pengetahuan Alam', code: 'IPA', type: 'umum', hours_per_week: 3 },
    { name: 'Ilmu Pengetahuan Sosial', code: 'IPS', type: 'umum', hours_per_week: 3 },
    { name: 'Pendidikan Jasmani', code: 'PJOK', type: 'umum', hours_per_week: 2 },
    { name: 'Seni Budaya dan Prakarya', code: 'SBDP', type: 'umum', hours_per_week: 2 },
    { name: 'Bahasa Inggris', code: 'BING', type: 'umum', hours_per_week: 2 },
    // Mata Pelajaran Keagamaan
    { name: 'Pendidikan Agama Islam', code: 'PAI', type: 'keagamaan', hours_per_week: 2 },
    { name: 'Al-Qur\'an Hadits', code: 'QH', type: 'keagamaan', hours_per_week: 2 },
    { name: 'Akidah Akhlak', code: 'AA', type: 'keagamaan', hours_per_week: 2 },
    { name: 'Fiqih', code: 'FQ', type: 'keagamaan', hours_per_week: 2 },
    { name: 'Bahasa Arab', code: 'BARA', type: 'keagamaan', hours_per_week: 2 },
  ];

  const subjects = await Subject.bulkCreate(subjectData);
  console.log(`✅ ${subjects.length} subjects created`);

  // ---- TIME SLOTS (Mon-Sat) ----
  const timeSlots = [];
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
  ];

  for (let day = 0; day <= 5; day++) {
    for (const s of dailySchedule) {
      timeSlots.push({ ...s, day_index: day });
    }
  }
  await TimeSlot.bulkCreate(timeSlots);
  console.log(`✅ ${timeSlots.length} time slots created`);

  // ---- CLASSES ----
  const classData = [
    { grade: 1, name: 'I-A', homeroom_teacher_id: teachers[0].id, academic_year_id: academicYear.id },
    { grade: 2, name: 'II-A', homeroom_teacher_id: teachers[1].id, academic_year_id: academicYear.id },
    { grade: 3, name: 'III-A', homeroom_teacher_id: teachers[2].id, academic_year_id: academicYear.id },
    { grade: 4, name: 'IV-A', homeroom_teacher_id: teachers[3].id, academic_year_id: academicYear.id },
    { grade: 5, name: 'V-A', homeroom_teacher_id: teachers[4].id, academic_year_id: academicYear.id },
    { grade: 6, name: 'VI-A', homeroom_teacher_id: teachers[5].id, academic_year_id: academicYear.id },
  ];
  const classes = await Class.bulkCreate(classData);
  console.log(`✅ ${classes.length} classes created`);

  // ---- ASSIGNMENTS ----
  // Distribute teachers to subjects and classes
  const subjectMap = {};
  for (const s of subjects) subjectMap[s.code] = s;

  const assignmentData = [];
  const teacherSubjectMap = [
    // [teacherIndex, subjectCode, classIndices[]]
    [0, 'MTK', [0, 1, 2]],
    [1, 'BIND', [0, 1, 2]],
    [2, 'IPA', [0, 1, 2, 3, 4, 5]],
    [3, 'IPS', [0, 1, 2, 3, 4, 5]],
    [4, 'MTK', [3, 4, 5]],
    [5, 'BIND', [3, 4, 5]],
    [6, 'PJOK', [0, 1, 2, 3, 4, 5]],
    [7, 'SBDP', [0, 1, 2, 3, 4, 5]],
    [0, 'BING', [0, 1, 2]],
    [4, 'BING', [3, 4, 5]],
    [1, 'PAI', [0, 1, 2, 3, 4, 5]],
    [3, 'QH', [0, 1, 2, 3, 4, 5]],
    [5, 'AA', [0, 1, 2, 3, 4, 5]],
    [1, 'FQ', [0, 1, 2, 3, 4, 5]],
    [3, 'BARA', [0, 1, 2, 3, 4, 5]],
  ];

  for (const [tIdx, subCode, classIdxList] of teacherSubjectMap) {
    const subject = subjectMap[subCode];
    if (!subject) continue;
    for (const cIdx of classIdxList) {
      assignmentData.push({
        teacher_id: teachers[tIdx].id,
        subject_id: subject.id,
        class_id: classes[cIdx].id,
        academic_year_id: academicYear.id,
      });
    }
  }

  await Assignment.bulkCreate(assignmentData, { ignoreDuplicates: true });
  console.log(`✅ ${assignmentData.length} assignments created`);

  // ---- USERS ----
  const salt = await bcrypt.genSalt(12);
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', salt);
  const guruPassword = await bcrypt.hash('Guru@123', salt);

  await User.bulkCreate([
    { name: 'Administrator', username: process.env.ADMIN_USERNAME || 'admin', password_hash: adminPassword, role: 'admin' },
    { name: teachers[0].name, username: 'guru1', password_hash: guruPassword, role: 'guru', teacher_id: teachers[0].id },
    { name: teachers[1].name, username: 'guru2', password_hash: guruPassword, role: 'guru', teacher_id: teachers[1].id },
    { name: teachers[2].name, username: 'walikelas3', password_hash: guruPassword, role: 'wali_kelas', teacher_id: teachers[2].id },
  ]);
  console.log('✅ Users created');

  console.log('\n🎉 Seeding completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login credentials:');
  console.log('  Admin   → username: admin     | password: Admin@123');
  console.log('  Guru    → username: guru1     | password: Guru@123');
  console.log('  Wali KL → username: walikelas3 | password: Guru@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await sequelize.close();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
