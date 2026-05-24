// controllers/productionController.js
const Production = require('../models/productionModel');
const response = require('../helpers/response');

const catatProduksi = async (req, res) => {
    try {
        const { recipe_id, qty, booth_id } = req.body;
        const created_by = req.user.id;
        const loc_id = req.user.location_id;

        if (!recipe_id || !qty || Number(qty) <= 0) {
            return response(400, null, 'recipe_id dan qty wajib diisi', res);
        }
        if (!loc_id) {
            return response(400, null, 'User tidak memiliki lokasi', res);
        }

        const data = await Production.create({
            recipe_id,
            qty: Number(qty),
            booth_id: booth_id ?? null,
            created_by,
            loc_id,
        });

        response(201, data, 'Produksi berhasil dicatat', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { catatProduksi };
