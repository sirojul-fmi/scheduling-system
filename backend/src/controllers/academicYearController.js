const { validationResult } = require('express-validator');
const { AcademicYear } = require('../models');
const response = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const years = await AcademicYear.findAll({ order: [['year', 'DESC'], ['semester', 'ASC']] });
    return response.ok(res, years);
  } catch (error) { next(error); }
};

const getActive = async (req, res, next) => {
  try {
    const year = await AcademicYear.findOne({ where: { is_active: true } });
    if (!year) return response.notFound(res, 'Tidak ada tahun ajaran aktif');
    return response.ok(res, year);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const { year, semester, is_active } = req.body;
    if (is_active) await AcademicYear.update({ is_active: false }, { where: {} });
    const ay = await AcademicYear.create({ year, semester, is_active: is_active || false });
    return response.created(res, ay, 'Tahun ajaran berhasil ditambahkan');
  } catch (error) { next(error); }
};

const setActive = async (req, res, next) => {
  try {
    const ay = await AcademicYear.findByPk(req.params.id);
    if (!ay) return response.notFound(res, 'Tahun ajaran tidak ditemukan');
    await AcademicYear.update({ is_active: false }, { where: {} });
    await ay.update({ is_active: true });
    return response.ok(res, ay, 'Tahun ajaran aktif berhasil diubah');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const ay = await AcademicYear.findByPk(req.params.id);
    if (!ay) return response.notFound(res, 'Tahun ajaran tidak ditemukan');
    if (ay.is_active) return response.badRequest(res, 'Tidak dapat menghapus tahun ajaran yang sedang aktif');
    await ay.destroy();
    return response.noContent(res, 'Tahun ajaran berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, getActive, create, setActive, remove };
