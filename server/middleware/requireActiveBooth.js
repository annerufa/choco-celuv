// middlewares/requireActiveBooth.js

const response = require('../helpers/response');

const requireActiveBooth = (req, res, next) => {
    const { role, booth_id, location_id } = req.user;

    // Hanya penjaga booth yang dicek jadwalnya
    // Role lain (pemilik, kurir, dll) langsung lolos
    if (role === 'penjaga_booth' && (!booth_id || !location_id)) {
        return response(403, null, 'Kamu tidak sedang dalam jadwal jaga. Transaksi tidak dapat dilakukan.', res);
    }

    next();
};

module.exports = requireActiveBooth;