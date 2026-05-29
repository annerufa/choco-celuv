// controllers/batchController.js
const Batch = require('../models/batchModel');
const { getUtilization, freezeBatch, thawBatch, damageBatch, getBatchDetail } = require('../models/batchModel');
const response = require('../helpers/response');

// GET /batches/utilization
const getUtilizations = async (req, res) => {
    try {
        const { from, to, booth_id } = req.query;

        if (!from || !to)
            return response(400, null, 'Parameter from dan to wajib diisi', res);

        const data = await Batch.getUtilization({ from, to, booth_id });
        response(200, data, 'Berhasil mengambil data utilisasi batch', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const freeze = async (req, res) => {
    try {
        const data = await freezeBatch(req.params.id);
        response(200, data, 'Batch dimasukkan kulkas', res);
    } catch (err) {
        response(400, null, err.message, res);
    }
};

const thaw = async (req, res) => {
    try {
        const data = await thawBatch(req.params.id);
        response(200, data, 'Batch dikeluarkan dari kulkas', res);
    } catch (err) {
        response(400, null, err.message, res);
    }
};

const damage = async (req, res) => {
    try {
        const { notes } = req.body;
        const data = await damageBatch(req.params.id, notes);
        response(200, data, 'Batch ditandai rusak', res);
    } catch (err) {
        response(400, null, err.message, res);
    }
};
const detail = async (req, res) => {
    try {
        const data = await getBatchDetail(req.params.id);
        if (!data) return response(404, null, 'Batch tidak ditemukan', res);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getUtilizations, freeze, thaw, damage, detail };