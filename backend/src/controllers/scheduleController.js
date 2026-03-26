const path = require('path');
const { Worker } = require('worker_threads');
const {
  ScheduleJob, Schedule, GALog, Assignment,
  Teacher, Subject, Class, TimeSlot, TeacherDayPreference,
  SubjectSlotRestriction, AcademicYear,
} = require('../models');
const response = require('../utils/response');
const pdfExport = require('../exports/pdfExport');
const excelExport = require('../exports/excelExport');
const logger = require('../utils/logger');

/**
 * POST /api/schedule/generate
 * Start GA process in Worker Thread
 */
const generate = async (req, res, next) => {
  try {
    const {
      academic_year_id,
      population_size = 100,
      max_generations = 200,
      crossover_rate = 0.8,
      mutation_rate = 0.05,
      elitism_rate = 0.1,
      tournament_size = 3,
    } = req.body;

    if (!academic_year_id) return response.badRequest(res, 'academic_year_id diperlukan');

    // Check if already running
    const running = await ScheduleJob.findOne({ where: { academic_year_id, status: 'running' } });
    if (running) return response.conflict(res, 'Proses generate sedang berjalan');

    // Gather input data
    const [assignments, timeSlots, teachers, teacherPrefs, subjectRestrictions] = await Promise.all([
      Assignment.findAll({
        where: { academic_year_id },
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'hours_per_week'] }],
        raw: false,
      }),
      TimeSlot.findAll({ order: [['day_index', 'ASC'], ['slot_index', 'ASC']] }),
      Teacher.findAll({ where: { is_active: true } }),
      TeacherDayPreference.findAll(),
      SubjectSlotRestriction.findAll(),
    ]);

    if (assignments.length === 0) {
      return response.badRequest(res, 'Belum ada penugasan untuk tahun ajaran ini');
    }

    // Build flat assignment data for GA
    const flatAssignments = assignments.map(a => ({
      teacher_id: a.teacher_id,
      subject_id: a.subject_id,
      class_id: a.class_id,
      hours_per_week: a.subject ? a.subject.hours_per_week : 2,
    }));

    const ga_params = { population_size, max_generations, crossover_rate, mutation_rate, elitism_rate, tournament_size };

    // Create schedule job
    const job = await ScheduleJob.create({
      academic_year_id,
      status: 'pending',
      ga_params,
    });

    // Start Worker Thread
    const workerPath = path.join(__dirname, '../algorithms/gaWorker.js');
    const worker = new Worker(workerPath, {
      workerData: {
        jobId: job.id,
        inputData: {
          assignments: flatAssignments,
          timeSlots: timeSlots.map(s => s.toJSON()),
          teachers: teachers.map(t => t.toJSON()),
          teacherPrefs: teacherPrefs.map(p => p.toJSON()),
          subjectRestrictions: subjectRestrictions.map(r => r.toJSON()),
        },
        params: {
          populationSize: population_size,
          maxGenerations: max_generations,
          crossoverRate: crossover_rate,
          mutationRate: mutation_rate,
          elitismRate: elitism_rate,
          tournamentSize: tournament_size,
        },
      },
    });

    // Update job to running
    await job.update({ status: 'running', started_at: new Date() });

    // Handle worker messages
    worker.on('message', async (msg) => {
      try {
        if (msg.type === 'progress') {
          await GALog.create({
            schedule_job_id: job.id,
            generation: msg.generation,
            best_fitness: msg.bestFitness,
            avg_fitness: msg.avgFitness,
            hard_violations: msg.hardViolations || 0,
          });
        } else if (msg.type === 'done') {
          const { bestChromosome, bestFitness, hardViolations } = msg.result;

          // Save schedule to DB
          if (bestChromosome && bestChromosome.length > 0) {
            await Schedule.destroy({ where: { schedule_job_id: job.id } });
            const scheduleRows = bestChromosome.map(gene => ({
              schedule_job_id: job.id,
              class_id: gene.classId,
              day_index: gene.dayIndex,
              slot_index: gene.slotIndex,
              subject_id: gene.subjectId,
              teacher_id: gene.teacherId,
            }));
            await Schedule.bulkCreate(scheduleRows);
          }

          // Deactivate previous active jobs
          await ScheduleJob.update({ is_active: false }, { where: { academic_year_id } });

          await job.update({
            status: 'done',
            best_fitness: bestFitness,
            total_generations: msg.result.logs.length > 0 ? msg.result.logs[msg.result.logs.length - 1].generation : max_generations,
            finished_at: new Date(),
            is_active: true,
          });

          logger.info(`GA Job ${job.id} completed. Best fitness: ${bestFitness}, Hard violations: ${hardViolations}`);
        } else if (msg.type === 'error') {
          await job.update({ status: 'failed', error_message: msg.error, finished_at: new Date() });
          logger.error(`GA Job ${job.id} failed: ${msg.error}`);
        }
      } catch (err) {
        logger.error('Error handling worker message:', err);
      }
    });

    worker.on('error', async (err) => {
      await job.update({ status: 'failed', error_message: err.message, finished_at: new Date() });
      logger.error(`Worker error for job ${job.id}:`, err);
    });

    return response.ok(res, { job_id: job.id }, 'Proses generate jadwal dimulai');
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/status/:jobId
 */
const getStatus = async (req, res, next) => {
  try {
    const job = await ScheduleJob.findByPk(req.params.jobId, {
      include: [
        { model: GALog, as: 'gaLogs', order: [['generation', 'ASC']], limit: 500 },
        { model: AcademicYear, as: 'academicYear' },
      ],
    });
    if (!job) return response.notFound(res, 'Job tidak ditemukan');
    return response.ok(res, job);
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/jobs?academic_year_id=x
 */
const getJobs = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    const where = {};
    if (academic_year_id) where.academic_year_id = academic_year_id;
    const jobs = await ScheduleJob.findAll({
      where,
      include: [{ model: AcademicYear, as: 'academicYear', attributes: ['id', 'year', 'semester'] }],
      order: [['created_at', 'DESC']],
    });
    return response.ok(res, jobs);
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/by-class/:classId?jobId=xxx
 */
const getByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { job_id } = req.query;

    let jobId = job_id;
    if (!jobId) {
      const activeJob = await ScheduleJob.findOne({ where: { is_active: true }, order: [['created_at', 'DESC']] });
      if (!activeJob) return response.notFound(res, 'Belum ada jadwal aktif');
      jobId = activeJob.id;
    }

    const schedules = await Schedule.findAll({
      where: { schedule_job_id: jobId, class_id: classId },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'type'] },
        { model: Teacher, as: 'teacher', attributes: ['id', 'name'] },
        { model: Class, as: 'class', attributes: ['id', 'grade', 'name'] },
      ],
      order: [['day_index', 'ASC'], ['slot_index', 'ASC']],
    });

    return response.ok(res, { job_id: jobId, schedules });
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/by-teacher/:teacherId?jobId=xxx
 */
const getByTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { job_id } = req.query;

    // Role guard: guru can only see own schedule
    if (req.user.role === 'guru' && req.user.teacher_id != teacherId) {
      return response.forbidden(res, 'Anda hanya dapat melihat jadwal Anda sendiri');
    }

    let jobId = job_id;
    if (!jobId) {
      const activeJob = await ScheduleJob.findOne({ where: { is_active: true }, order: [['created_at', 'DESC']] });
      if (!activeJob) return response.notFound(res, 'Belum ada jadwal aktif');
      jobId = activeJob.id;
    }

    const schedules = await Schedule.findAll({
      where: { schedule_job_id: jobId, teacher_id: teacherId },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'type'] },
        { model: Class, as: 'class', attributes: ['id', 'grade', 'name'] },
      ],
      order: [['day_index', 'ASC'], ['slot_index', 'ASC']],
    });

    return response.ok(res, { job_id: jobId, schedules });
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/export/pdf/:classId
 */
const exportPDF = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { job_id } = req.query;

    let jobId = job_id;
    if (!jobId) {
      const activeJob = await ScheduleJob.findOne({ where: { is_active: true } });
      if (!activeJob) return response.notFound(res, 'Belum ada jadwal aktif');
      jobId = activeJob.id;
    }

    const [schedules, cls, timeSlots, job] = await Promise.all([
      Schedule.findAll({
        where: { schedule_job_id: jobId, class_id: classId },
        include: [
          { model: Subject, as: 'subject', attributes: ['id', 'name', 'type'] },
          { model: Teacher, as: 'teacher', attributes: ['id', 'name'] },
        ],
      }),
      Class.findByPk(classId, { include: [{ model: AcademicYear, as: 'academicYear' }] }),
      TimeSlot.findAll({ order: [['day_index', 'ASC'], ['slot_index', 'ASC']] }),
      ScheduleJob.findByPk(jobId, { include: [{ model: AcademicYear, as: 'academicYear' }] }),
    ]);

    if (!cls) return response.notFound(res, 'Kelas tidak ditemukan');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="jadwal-kelas-${cls.name}.pdf"`);

    await pdfExport.generateClassSchedulePDF(res, { schedules, cls, timeSlots, job });
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/export/excel?job_id=xxx
 */
const exportExcel = async (req, res, next) => {
  try {
    const { job_id } = req.query;
    let jobId = job_id;
    if (!jobId) {
      const activeJob = await ScheduleJob.findOne({ where: { is_active: true } });
      if (!activeJob) return response.notFound(res, 'Belum ada jadwal aktif');
      jobId = activeJob.id;
    }

    const [schedules, classes, timeSlots, teachers, job] = await Promise.all([
      Schedule.findAll({
        where: { schedule_job_id: jobId },
        include: [
          { model: Subject, as: 'subject', attributes: ['id', 'name', 'type'] },
          { model: Teacher, as: 'teacher', attributes: ['id', 'name'] },
          { model: Class, as: 'class', attributes: ['id', 'grade', 'name'] },
        ],
      }),
      Class.findAll({ include: [{ model: AcademicYear, as: 'academicYear' }], order: [['grade', 'ASC'], ['name', 'ASC']] }),
      TimeSlot.findAll({ order: [['day_index', 'ASC'], ['slot_index', 'ASC']] }),
      Teacher.findAll({ where: { is_active: true }, order: [['name', 'ASC']] }),
      ScheduleJob.findByPk(jobId, { include: [{ model: AcademicYear, as: 'academicYear' }] }),
    ]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="jadwal-pelajaran.xlsx"');

    await excelExport.generateScheduleExcel(res, { schedules, classes, timeSlots, teachers, job });
  } catch (error) { next(error); }
};

/**
 * POST /api/schedule/activate/:jobId
 */
const activateJob = async (req, res, next) => {
  try {
    const job = await ScheduleJob.findByPk(req.params.jobId);
    if (!job) return response.notFound(res, 'Job tidak ditemukan');
    if (job.status !== 'done') return response.badRequest(res, 'Hanya job dengan status done yang dapat diaktifkan');

    await ScheduleJob.update({ is_active: false }, { where: { academic_year_id: job.academic_year_id } });
    await job.update({ is_active: true });

    return response.ok(res, job, 'Jadwal berhasil diaktifkan');
  } catch (error) { next(error); }
};

/**
 * GET /api/schedule/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [teacherCount, classCount, subjectCount, activeJob, activeYear] = await Promise.all([
      Teacher.count({ where: { is_active: true } }),
      Class.count(),
      Subject.count({ where: { is_active: true } }),
      ScheduleJob.findOne({ where: { is_active: true }, include: [{ model: AcademicYear, as: 'academicYear' }] }),
      AcademicYear.findOne({ where: { is_active: true } }),
    ]);

    return response.ok(res, {
      teacher_count: teacherCount,
      class_count: classCount,
      subject_count: subjectCount,
      active_schedule: activeJob,
      active_academic_year: activeYear,
    });
  } catch (error) { next(error); }
};

module.exports = { generate, getStatus, getJobs, getByClass, getByTeacher, exportPDF, exportExcel, activateJob, getDashboardStats };
