const { validationResult } = require('express-validator');
const { Subject, SubjectSlotRestriction } = require('../models');
const response = require('../utils/response');
const { Op } = require('sequelize');

const getAll = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const where = {};
    if (type) where.type = type;
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    const subjects = await Subject.findAll({
      where,
      include: [{ model: SubjectSlotRestriction, as: 'slotRestriction' }],
      order: [['name', 'ASC']],
    });
    return response.ok(res, subjects);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [{ model: SubjectSlotRestriction, as: 'slotRestriction' }],
    });
    if (!subject) return response.notFound(res, 'Mata pelajaran tidak ditemukan');
    return response.ok(res, subject);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const { name, code, type, hours_per_week, description, slot_restriction } = req.body;
    const existing = await Subject.findOne({ where: { code } });
    if (existing) return response.conflict(res, 'Kode mata pelajaran sudah ada');
    const subject = await Subject.create({ name, code, type, hours_per_week, description });
    if (slot_restriction) {
      await SubjectSlotRestriction.create({
        subject_id: subject.id,
        allowed_day_slots: slot_restriction.allowed_day_slots || [],
        restriction_type: slot_restriction.restriction_type || 'whitelist',
      });
    }
    const result = await Subject.findByPk(subject.id, { include: [{ model: SubjectSlotRestriction, as: 'slotRestriction' }] });
    return response.created(res, result, 'Mata pelajaran berhasil ditambahkan');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return response.notFound(res, 'Mata pelajaran tidak ditemukan');
    const { name, code, type, hours_per_week, description, is_active, slot_restriction } = req.body;
    if (code && code !== subject.code) {
      const existing = await Subject.findOne({ where: { code, id: { [Op.ne]: subject.id } } });
      if (existing) return response.conflict(res, 'Kode sudah digunakan');
    }
    await subject.update({ name, code, type, hours_per_week, description, is_active });
    if (slot_restriction !== undefined) {
      if (slot_restriction === null) {
        await SubjectSlotRestriction.destroy({ where: { subject_id: subject.id } });
      } else {
        await SubjectSlotRestriction.upsert({
          subject_id: subject.id,
          allowed_day_slots: slot_restriction.allowed_day_slots || [],
          restriction_type: slot_restriction.restriction_type || 'whitelist',
        });
      }
    }
    const result = await Subject.findByPk(subject.id, { include: [{ model: SubjectSlotRestriction, as: 'slotRestriction' }] });
    return response.ok(res, result, 'Mata pelajaran berhasil diperbarui');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return response.notFound(res, 'Mata pelajaran tidak ditemukan');
    await subject.destroy();
    return response.noContent(res, 'Mata pelajaran berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
