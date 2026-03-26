/**
 * Standardized API response formatter
 */

/**
 * @param {object} res - Express response object
 * @param {number} statusCode
 * @param {boolean} success
 * @param {string} message
 * @param {*} data
 * @param {*} errors
 */
const sendResponse = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = {
  ok: (res, data, message = 'Berhasil') => sendResponse(res, 200, true, message, data),
  created: (res, data, message = 'Data berhasil dibuat') => sendResponse(res, 201, true, message, data),
  noContent: (res, message = 'Data berhasil dihapus') => res.status(200).json({ success: true, message }),
  badRequest: (res, message = 'Permintaan tidak valid', errors = null) => sendResponse(res, 400, false, message, null, errors),
  unauthorized: (res, message = 'Tidak terautentikasi') => sendResponse(res, 401, false, message),
  forbidden: (res, message = 'Akses ditolak') => sendResponse(res, 403, false, message),
  notFound: (res, message = 'Data tidak ditemukan') => sendResponse(res, 404, false, message),
  conflict: (res, message = 'Data sudah ada') => sendResponse(res, 409, false, message),
  serverError: (res, message = 'Terjadi kesalahan server') => sendResponse(res, 500, false, message),
};
