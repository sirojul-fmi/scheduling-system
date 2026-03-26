const jwt = require('jsonwebtoken');
const response = require('../utils/response');
const { User } = require('../models');

/**
 * Verifies JWT token from Authorization header
 */
const authGuard = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, 'Token autentikasi diperlukan');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'username', 'role', 'teacher_id', 'is_active'],
    });

    if (!user || !user.is_active) {
      return response.unauthorized(res, 'Akun tidak aktif atau tidak ditemukan');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return response.unauthorized(res, 'Token telah kedaluwarsa, silakan login kembali');
    }
    if (error.name === 'JsonWebTokenError') {
      return response.unauthorized(res, 'Token tidak valid');
    }
    next(error);
  }
};

module.exports = authGuard;
