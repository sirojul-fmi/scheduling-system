const response = require('../utils/response');

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return response.unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return response.forbidden(res, `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`);
    }
    next();
  };
};

module.exports = roleGuard;
