const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const response = require('../helpers/response');

const SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    try {
        const user = await User.findUsername(username);

        if (!user) return response(401, null, 'Username tidak ditemukan', res);
        // if (!user.is_active) return response(403, null, 'Akun tidak aktif. Hubungi pemilik.', res);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return response(401, null, 'Password salah', res);

        // 3. Bangun payload token berdasarkan role
        const payload = {
            id: user.id,
            name: user.name,
            role: user.role,
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
            const boothData = await user.getLocationId(user.id);

            if (!boothData) {
                return res.status(403).json({
                    message: 'Tidak ada jadwal jaga untuk hari ini. Hubungi pemilik.'
                });
            }

            payload.booth_id = boothData.booth_id;
            payload.location_id = boothData.location_id;
        }
        // 4. Sign token
        const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });
        console.log(token);
        response(200, { token, user: { id: user.id, name: user.name, role: user.role, location_id: payload.location_id, booth_id: payload.booth_id } }, 'Login berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { login };