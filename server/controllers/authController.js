const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const User = require('./models/userModel');
const { findUsername, getLocationId } = require('../models/userModel');
const response = require('../helpers/response');

const SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    try {
        const user = await findUsername(username);

        if (!user) return response(401, null, 'Username tidak ditemukan', res);
        console.log('pass db: ', user.password);
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return response(401, null, 'Password salah', res);

        // 3. Bangun payload token berdasarkan role
        const payload = {
            id: user.id,
            name: user.name,
            role: user.role,
            is_update: user.is_update,
        };

        // cek role untuk menentukan location_id yang dimasukkan ke token
        if (user.role === 'pemilik') {
            payload.location_id = 1;
            payload.booth_id = null;
        } else if (user.role === 'kurir') {
            payload.location_id = null;
            payload.booth_id = null;
        } else {
            // Penjaga booth butuh booth_id + location_id dari jadwal hari ini
            const boothData = await getLocationId(user.id);

            // Tidak ada jadwal → tetap login, booth_id & location_id null
            payload.booth_id = boothData?.booth_id ?? null;
            payload.location_id = boothData?.location_id ?? null;
        }
        // 4. Sign token
        const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });
        console.log(token);
        response(200, { token, user: { id: user.id, name: user.name, role: user.role, location_id: payload.location_id, booth_id: payload.booth_id, is_update: user.is_update } }, 'Login berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = login;