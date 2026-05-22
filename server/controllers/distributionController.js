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

// GET /api/distributions?kurir_id=me&status=draft
const getMyDistributions = async (req, res) => {
    try {
        const { status } = req.query;
        const kurir_id = req.user.id; // kurir_id=me → pakai user dari token

        const data = await Distribution.getByKurir(kurir_id, status);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// GET /api/distributions/:id/items
const getDistributionItems = async (req, res) => {
    try {
        const data = await Distribution.getItems(req.params.id);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// POST /api/distributions/:id/pickup
// → ubah status draft → dikirim, kurangi stok gudang
const pickupDistribution = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const { id } = req.params;

        await Distribution.pickup(id, kurir_id);
        response(200, null, 'Pickup berhasil, status menjadi dikirim', res);
    } catch (err) {
        if (err.message.includes('tidak ditemukan') || err.message.includes('bukan draft')) {
            return response(400, null, err.message, res);
        }
        response(500, null, err.message, res);
    }
};

const getDisToday = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const data = await distributions.getDisToday(kurir_id);
        response(200, data, 'Berhasil mengambil distribusi hari ini', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const cancelDis = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const data = await distributions.getDisToday(kurir_id);
        response(200, data, 'Berhasil mengambil distribusi hari ini', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
}
const receiveDis = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const data = await distributions.getDisToday(kurir_id);
        response(200, data, 'Berhasil mengambil distribusi hari ini', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
}
const getDistributionbyId = async (req, res) => {
    try {
        const data = await distributions.getById(req.params.id);
        if (!data) return response(404, null, 'Distribusi tidak ditemukan', res);
        response(200, data, 'Berhasil mengambil detail distribusi ', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
}

module.exports = { getAll, create, cancelDis, receiveDis, getDistributionbyId, getMyDistributions, getDisToday, getDistributionItems, pickupDistribution };