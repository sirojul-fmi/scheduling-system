const { validationResult } = require('express-validator');
const { Teacher, TeacherDayPreference, User, Assignment } = require('../models');
const response = require('../utils/response');
const { Op } = require('sequelize');

const getAll = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    const where = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const teachers = await Teacher.findAll({
      where,
      include: [{ model: TeacherDayPreference, as: 'dayPreferences', order: [['day_index', 'ASC']] }],
      order: [['name', 'ASC']],
    });
    return response.ok(res, teachers);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [{ model: TeacherDayPreference, as: 'dayPreferences', order: [['day_index', 'ASC']] }],
    });
    if (!teacher) return response.notFound(res, 'Guru tidak ditemukan');
    return response.ok(res, teacher);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());

    const { name, nip, email, max_hours_per_day, max_hours_per_week, day_preferences } = req.body;

    // Check NIP uniqueness
    if (nip) {
      const existing = await Teacher.findOne({ where: { nip } });
      if (existing) return response.conflict(res, 'NIP sudah digunakan');
    }

    const teacher = await Teacher.create({ name, nip, email, max_hours_per_day, max_hours_per_week });

    // Upsert day preferences (0-5 for each day)
    if (day_preferences && Array.isArray(day_preferences)) {
      const prefs = day_preferences.map(p => ({
        teacher_id: teacher.id,
        day_index: p.day_index,
        preference_level: p.preference_level || 2,
      }));
      await TeacherDayPreference.bulkCreate(prefs, { updateOnDuplicate: ['preference_level'] });
    } else {
      // Default: all days neutral
      const prefs = [0,1,2,3,4,5].map(d => ({ teacher_id: teacher.id, day_index: d, preference_level: 2 }));
      await TeacherDayPreference.bulkCreate(prefs);
    }

    const result = await Teacher.findByPk(teacher.id, {
      include: [{ model: TeacherDayPreference, as: 'dayPreferences' }],
    });
    return response.created(res, result, 'Guru berhasil ditambahkan');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());

    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return response.notFound(res, 'Guru tidak ditemukan');

    const { name, nip, email, max_hours_per_day, max_hours_per_week, is_active, day_preferences } = req.body;

    if (nip && nip !== teacher.nip) {
      const existing = await Teacher.findOne({ where: { nip, id: { [Op.ne]: teacher.id } } });
      if (existing) return response.conflict(res, 'NIP sudah digunakan');
    }

    await teacher.update({ name, nip, email, max_hours_per_day, max_hours_per_week, is_active });

    if (day_preferences && Array.isArray(day_preferences)) {
      for (const pref of day_preferences) {
        await TeacherDayPreference.upsert({
          teacher_id: teacher.id,
          day_index: pref.day_index,
          preference_level: pref.preference_level,
        });
      }
    }

    const result = await Teacher.findByPk(teacher.id, {
      include: [{ model: TeacherDayPreference, as: 'dayPreferences' }],
    });
    return response.ok(res, result, 'Data guru berhasil diperbarui');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return response.notFound(res, 'Guru tidak ditemukan');

    const assignmentCount = await Assignment.count({ where: { teacher_id: teacher.id } });
    if (assignmentCount > 0) {
      return response.badRequest(res, 'Guru masih memiliki penugasan. Hapus penugasan terlebih dahulu.');
    }

    await teacher.destroy();
    return response.noContent(res, 'Guru berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
