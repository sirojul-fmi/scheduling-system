const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Import all models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Teacher = require('./Teacher')(sequelize, Sequelize.DataTypes);
const TeacherDayPreference = require('./TeacherDayPreference')(sequelize, Sequelize.DataTypes);
const Subject = require('./Subject')(sequelize, Sequelize.DataTypes);
const AcademicYear = require('./AcademicYear')(sequelize, Sequelize.DataTypes);
const Class = require('./Class')(sequelize, Sequelize.DataTypes);
const TimeSlot = require('./TimeSlot')(sequelize, Sequelize.DataTypes);
const SubjectSlotRestriction = require('./SubjectSlotRestriction')(sequelize, Sequelize.DataTypes);
const Assignment = require('./Assignment')(sequelize, Sequelize.DataTypes);
const ScheduleJob = require('./ScheduleJob')(sequelize, Sequelize.DataTypes);
const Schedule = require('./Schedule')(sequelize, Sequelize.DataTypes);
const GALog = require('./GALog')(sequelize, Sequelize.DataTypes);

// ===== ASSOCIATIONS =====

// User <-> Teacher (1:1)
User.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Teacher.hasOne(User, { foreignKey: 'teacher_id', as: 'user' });

// Teacher <-> TeacherDayPreference (1:N)
Teacher.hasMany(TeacherDayPreference, { foreignKey: 'teacher_id', as: 'dayPreferences', onDelete: 'CASCADE' });
TeacherDayPreference.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// AcademicYear <-> Class (1:N)
AcademicYear.hasMany(Class, { foreignKey: 'academic_year_id', as: 'classes' });
Class.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });

// Teacher <-> Class (homeroom)
Teacher.hasMany(Class, { foreignKey: 'homeroom_teacher_id', as: 'homeroomClasses' });
Class.belongsTo(Teacher, { foreignKey: 'homeroom_teacher_id', as: 'homeroomTeacher' });

// Subject <-> SubjectSlotRestriction (1:1)
Subject.hasOne(SubjectSlotRestriction, { foreignKey: 'subject_id', as: 'slotRestriction', onDelete: 'CASCADE' });
SubjectSlotRestriction.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// Assignment associations
Assignment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Assignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Assignment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Assignment.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });
Teacher.hasMany(Assignment, { foreignKey: 'teacher_id', as: 'assignments' });
Subject.hasMany(Assignment, { foreignKey: 'subject_id', as: 'assignments' });
Class.hasMany(Assignment, { foreignKey: 'class_id', as: 'assignments' });

// ScheduleJob associations
ScheduleJob.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });
AcademicYear.hasMany(ScheduleJob, { foreignKey: 'academic_year_id', as: 'scheduleJobs' });

// Schedule associations
Schedule.belongsTo(ScheduleJob, { foreignKey: 'schedule_job_id', as: 'job' });
Schedule.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Schedule.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Schedule.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
ScheduleJob.hasMany(Schedule, { foreignKey: 'schedule_job_id', as: 'schedules', onDelete: 'CASCADE' });

// GALog associations
GALog.belongsTo(ScheduleJob, { foreignKey: 'schedule_job_id', as: 'job' });
ScheduleJob.hasMany(GALog, { foreignKey: 'schedule_job_id', as: 'gaLogs', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Teacher,
  TeacherDayPreference,
  Subject,
  AcademicYear,
  Class,
  TimeSlot,
  SubjectSlotRestriction,
  Assignment,
  ScheduleJob,
  Schedule,
  GALog,
};
