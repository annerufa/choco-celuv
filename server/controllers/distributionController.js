const distributions = require('../models/distributionModel');
const db = require('../connection');
const response = require('../helpers/response');
// ─────────────────────────────────────────────
const getAll = async (req, res) => {
    try {
        const data = await distributions.getAll();
        // console.log('Data items:', data); // Debug log
        response(200, data, 'Berhasil mengambil data distribusi', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const create = async (req, res) => {
    try {
        const { id: created_by, location_id } = req.user;
        const { type, to_location_id, kurir_id, planned_date, notes, items } = req.body;

        if (!items?.length) return response(400, null, 'Items tidak boleh kosong', res);

        const result = await distributions.create({
            type,
            from_location_id: location_id, // dari token
            to_location_id,
            kurir_id: kurir_id ?? null,
            created_by,
            planned_date,
            notes,
            items,
        });

        response(201, result, 'Distribusi berhasil dibuat', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};


module.exports = { getAll, create };