const jwt = require('jsonwebtoken');
const response = require('../helpers/response');

const SECRET = process.env.JWT_SECRET || 'rahasia_kamu';

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return response(401, null, 'Token tidak ada', res);

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded; // { id, nama, role } tersedia di semua route
        next();
    } catch {
        response(403, null, 'Token tidak valid atau kadaluarsa', res);
    }
};