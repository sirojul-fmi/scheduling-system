const { Assignment, Teacher, Subject, Class, AcademicYear } = require('../models');
const response = require('../utils/response');

const includeOptions = [
  { model: Teacher, as: 'teacher', attributes: ['id', 'name'] },
  { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'type', 'hours_per_week'] },
  { model: Class, as: 'class', attributes: ['id', 'grade', 'name'] },
];

const getAll = async (req, res, next) => {
  try {
    const { academic_year_id, class_id, teacher_id } = req.query;
    const where = {};
    if (academic_year_id) where.academic_year_id = academic_year_id;
    if (class_id) where.class_id = class_id;
    if (teacher_id) where.teacher_id = teacher_id;
    const assignments = await Assignment.findAll({ where, include: includeOptions, order: [['id', 'ASC']] });
    return response.ok(res, assignments);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { teacher_id, subject_id, class_id, academic_year_id } = req.body;
    const existing = await Assignment.findOne({ where: { teacher_id, subject_id, class_id, academic_year_id } });
    if (existing) return response.conflict(res, 'Penugasan ini sudah ada');
    const assignment = await Assignment.create({ teacher_id, subject_id, class_id, academic_year_id });
    const result = await Assignment.findByPk(assignment.id, { include: includeOptions });
    return response.created(res, result, 'Penugasan berhasil ditambahkan');
  } catch (error) { next(error); }
};

const bulkSet = async (req, res, next) => {
  try {
    const { academic_year_id, assignments } = req.body;
    if (!academic_year_id) return response.badRequest(res, 'academic_year_id diperlukan');
    await Assignment.destroy({ where: { academic_year_id } });
    if (assignments && assignments.length > 0) {
      const data = assignments.map(a => ({ ...a, academic_year_id }));
      await Assignment.bulkCreate(data, { ignoreDuplicates: true });
    }
    const result = await Assignment.findAll({ where: { academic_year_id }, include: includeOptions });
    return response.ok(res, result, 'Penugasan berhasil disimpan');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return response.notFound(res, 'Penugasan tidak ditemukan');
    await assignment.destroy();
    return response.noContent(res, 'Penugasan berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, create, bulkSet, remove };
