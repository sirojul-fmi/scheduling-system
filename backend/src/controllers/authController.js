const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Teacher } = require('../models');
const response = require('../utils/response');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.badRequest(res, 'Input tidak valid', errors.array());
    }

    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username, is_active: true },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'email'] }],
    });

    if (!user) {
      return response.unauthorized(res, 'Username atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return response.unauthorized(res, 'Username atau password salah');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return response.ok(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        teacher_id: user.teacher_id,
        teacher: user.teacher,
      },
    }, 'Login berhasil');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'name', 'email', 'nip'] }],
    });
    return response.ok(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return response.badRequest(res, 'Input tidak valid', errors.array());
    }

    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return response.badRequest(res, 'Password lama tidak sesuai');
    }

    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();

    return response.ok(res, null, 'Password berhasil diubah');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword };
