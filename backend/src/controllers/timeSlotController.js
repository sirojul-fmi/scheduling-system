const { validationResult } = require('express-validator');
const { TimeSlot } = require('../models');
const response = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { day_index } = req.query;
    const where = {};
    if (day_index !== undefined) where.day_index = day_index;
    const slots = await TimeSlot.findAll({ where, order: [['day_index', 'ASC'], ['slot_index', 'ASC']] });
    return response.ok(res, slots);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const { slot_index, day_index, start_time, end_time, category, label } = req.body;
    const slot = await TimeSlot.create({ slot_index, day_index, start_time, end_time, category, label });
    return response.created(res, slot, 'Slot waktu berhasil ditambahkan');
  } catch (error) { next(error); }
};

const bulkCreate = async (req, res, next) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots) || slots.length === 0) return response.badRequest(res, 'Data slots diperlukan');
    await TimeSlot.destroy({ where: {} });
    const created = await TimeSlot.bulkCreate(slots);
    return response.created(res, created, `${created.length} slot waktu berhasil disimpan`);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return response.notFound(res, 'Slot waktu tidak ditemukan');
    await slot.update(req.body);
    return response.ok(res, slot, 'Slot waktu berhasil diperbarui');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return response.notFound(res, 'Slot waktu tidak ditemukan');
    await slot.destroy();
    return response.noContent(res, 'Slot waktu berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, create, bulkCreate, update, remove };
