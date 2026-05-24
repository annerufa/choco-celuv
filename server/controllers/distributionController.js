//distributionController.js
const distributions = require('../models/distributionModel');
const users = require('../models/userModel');
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
        console.log('id kurir:', kurir_id, ' + status:', status)
        const data = await distributions.getByKurir(kurir_id, status);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// GET /api/distributions/:id/items
const getDistributionItems = async (req, res) => {
    try {
        const data = await distributions.getItems(req.params.id);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
//get items di penjaga booth
const updateDistributionItem = async (req, res) => {
    try {
        const { id, item_id } = req.params;
        const { qty_diterima, notes } = req.body;

        const data = await distributions.updateItem(id, item_id, qty_diterima, notes);
        response(200, data, 'Item berhasil diperbarui', res);
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

        await distributions.pickup(id, kurir_id);
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

const doneDistributions = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const data = await distributions.doneDistributions(kurir_id);
        response(200, data, 'Berhasil mengambil distribusi yg telah selesai', res);
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
const arriveDistribution = async (req, res) => {
    try {
        const kurir_id = req.user.id;
        const { id } = req.params;
        await distributions.arrive(id, kurir_id);
        response(200, null, 'Berhasil dikonfirmasi, menunggu penjaga booth', res);
    } catch (err) {
        if ([
            'Distribusi tidak ditemukan',
            'Bukan kurir distribusi ini',
            'Bukan status dikirim'
        ].includes(err.message)) {
            return response(400, null, err.message, res);
        }
        response(500, null, err.message, res);
    }
};

// GET /api/distributions?kurir_id=me&status=draft
const getDisBooth = async (req, res) => {
    try {
        // const { status } = req.query;
        const loc_penjaga_id = req.user.location_id; // kurir_id=me → pakai user dari token
        console.log('id loc penjaga booth: ', loc_penjaga_id);

        // console.log('id kurir:', kurir_id, ' + status:', status)
        const data = await distributions.getByBooth(loc_penjaga_id);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const updateDistributionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validasi status yang boleh dikirim dari booth
        const allowedStatus = ['diterima', 'kurang'];
        if (!allowedStatus.includes(status)) {
            return response(400, null, 'Status tidak valid', res);
        }

        const data = await distributions.updateStatus(id, status, req.user.id);
        if (!data) return response(404, null, 'Distribusi tidak ditemukan', res);

        response(200, data, 'Status berhasil diperbarui', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const getRekapKurir = async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return response(400, null, 'Parameter from dan to wajib diisi', res);
        }

        const data = await distributions.getRekap(req.user.id, from, to);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getAll, create, updateDistributionItem, getRekapKurir, updateDistributionStatus, doneDistributions, getDisBooth, arriveDistribution, cancelDis, receiveDis, getDistributionbyId, getMyDistributions, getDisToday, getDistributionItems, pickupDistribution };