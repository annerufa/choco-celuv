const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const response = require('../helpers/response');

const SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { username, password } = req.body;

    console.log('username:', username);
    console.log('password:', password); // cek apakah undefined
    try {
        const user = await User.findByUsername(username);
        if (!user) return response(401, null, 'Username tidak ditemukan', res);
        console.log('user dari db:', user);
        console.log('user.password:', user.password); // cek apakah undefined

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return response(401, null, 'Password salah', res);

        const location = user.role === 'pemilik' ? 1 : user.location_id;
        console.log('location yang digunakan untuk token:', location);

        const token = jwt.sign(
            {
                id: user.id, name: user.name, role: user.role, location_id: location, booth_id: user.booth_id, // ← dari hasil join 
            },
            SECRET,
            { expiresIn: '8h' }
        );

        response(200, { token, user: { id: user.id, name: user.name, role: user.role, location_id: location, booth_id: user.booth_id } }, 'Login berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { login };