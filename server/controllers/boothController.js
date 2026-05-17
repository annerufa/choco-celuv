const Booth = require('../models/boothModel');
const response = require('../helpers/response');

const getAllBooth = async (req, res) => {
    try {
        const data = await Booth.getAll();
        response(200, data, 'Berhasil mengambil data booth', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const createBooth = async (req, res) => {
    try {
        const result = await Booth.create(req.body);

        response(201, result, 'Booth berhasil ditambahkan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const updateBooth = async (req, res) => {
    try {
        const result = await Booth.update(req.params.id, req.body);
        response(200, result, 'Booth berhasil diupdate', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const statusBooth = async (req, res) => {
    try {
        // const locationId = req.user.location_id ?? null;
        const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

        await Booth.statusChange(req.params.id, isActive);

        const msg = isActive ? 'Booth berhasil diaktifkan' : 'Booth berhasil dinonaktifkan';
        response(200, null, msg, res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
module.exports = { getAllBooth, createBooth, updateBooth, statusBooth };