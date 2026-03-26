const { validationResult } = require('express-validator');
const { Class, Teacher, AcademicYear } = require('../models');
const response = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    const where = {};
    if (academic_year_id) where.academic_year_id = academic_year_id;
    const classes = await Class.findAll({
      where,
      include: [
        { model: Teacher, as: 'homeroomTeacher', attributes: ['id', 'name'] },
        { model: AcademicYear, as: 'academicYear', attributes: ['id', 'year', 'semester'] },
      ],
      order: [['grade', 'ASC'], ['name', 'ASC']],
    });
    return response.ok(res, classes);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id, {
      include: [
        { model: Teacher, as: 'homeroomTeacher', attributes: ['id', 'name'] },
        { model: AcademicYear, as: 'academicYear' },
      ],
    });
    if (!cls) return response.notFound(res, 'Kelas tidak ditemukan');
    return response.ok(res, cls);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const { grade, name, homeroom_teacher_id, academic_year_id } = req.body;
    const cls = await Class.create({ grade, name, homeroom_teacher_id, academic_year_id });
    const result = await Class.findByPk(cls.id, { include: [{ model: Teacher, as: 'homeroomTeacher', attributes: ['id', 'name'] }] });
    return response.created(res, result, 'Kelas berhasil ditambahkan');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return response.notFound(res, 'Kelas tidak ditemukan');
    const { grade, name, homeroom_teacher_id, academic_year_id } = req.body;
    await cls.update({ grade, name, homeroom_teacher_id, academic_year_id });
    const result = await Class.findByPk(cls.id, { include: [{ model: Teacher, as: 'homeroomTeacher', attributes: ['id', 'name'] }] });
    return response.ok(res, result, 'Kelas berhasil diperbarui');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return response.notFound(res, 'Kelas tidak ditemukan');
    await cls.destroy();
    return response.noContent(res, 'Kelas berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
