const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User, Teacher } = require('../models');
const response = require('../utils/response');
const { Op } = require('sequelize');

const getAll = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    return response.ok(res, users);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return response.badRequest(res, 'Validasi gagal', errors.array());
    const { name, username, password, role, teacher_id } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) return response.conflict(res, 'Username sudah digunakan');
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, username, password_hash, role, teacher_id });
    const result = await User.findByPk(user.id, { attributes: { exclude: ['password_hash'] } });
    return response.created(res, result, 'Pengguna berhasil dibuat');
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return response.notFound(res, 'Pengguna tidak ditemukan');
    const { name, username, role, teacher_id, is_active } = req.body;
    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username, id: { [Op.ne]: user.id } } });
      if (existing) return response.conflict(res, 'Username sudah digunakan');
    }
    await user.update({ name, username, role, teacher_id, is_active });
    const result = await User.findByPk(user.id, { attributes: { exclude: ['password_hash'] } });
    return response.ok(res, result, 'Pengguna berhasil diperbarui');
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return response.notFound(res, 'Pengguna tidak ditemukan');
    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();
    return response.ok(res, null, 'Password berhasil direset');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    if (req.params.id == req.user.id) return response.badRequest(res, 'Tidak dapat menghapus akun sendiri');
    const user = await User.findByPk(req.params.id);
    if (!user) return response.notFound(res, 'Pengguna tidak ditemukan');
    await user.destroy();
    return response.noContent(res, 'Pengguna berhasil dihapus');
  } catch (error) { next(error); }
};

module.exports = { getAll, create, update, resetPassword, remove };
