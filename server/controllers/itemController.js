const Items = require('../models/itemModel');
const response = require('../helpers/response');

const getAllItems = async (req, res) => {
    try {
        const { location_id } = req.query;

        const data = location_id
            ? await Items.getAllPerLoc(location_id)
            : await Items.getAll();
        // console.log('Data items:', data); // Debug log
        response(200, data, 'Berhasil mengambil data semua barang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getItem = async (req, res) => {
    try {
        const data = await Items.getItem(req.params.id);
        response(200, data, 'Berhasil mengambil data barang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// stockLocController.js
const getByItemOrLocation = async (req, res) => {
    try {
        const { item_id, location_id } = req.query;
        // console.log('Query Params:', item_id); // Debug log
        let data;
        if (item_id) data = await Items.getByItemId(item_id);
        else if (location_id) data = await Items.getByLocation(location_id);
        else return response(400, null, 'item_id atau location_id wajib diisi', res);

        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getItemsPerLoc = async (req, res) => {
    const locationId = req.user.location_id ?? null;

    try {
        const data = await Items.getAllPerLoc(locationId);
        response(200, data, 'Berhasil mengambil data barang dan stok pada lokasi id', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const createItems = async (req, res) => {
    try {
        const result = await Items.create(req.body);
        // Sebelum: const data = { id: result.insertId, ...req.body };
        // Sekarang model sudah return object lengkap langsung
        response(201, result, 'Barang berhasil ditambahkan', res);
    } catch (err) {
        if (err.message.includes('Belum ada lokasi')) {
            return response(400, null, err.message, res);
        }
        response(500, null, err.message, res);
    }
};

const updateItems = async (req, res) => {

    try {
        const locationId = req.user.location_id ?? null;
        console.log('locationId:', locationId); // Debug log
        await Items.update(req.params.id, req.body, locationId);
        response(200, null, 'Barang berhasil diupdate', res);
    } catch (err) {
        console.error('Update error:', err); // ← tambah logging
        response(500, null, err.message, res);
    }
};

const deleteItems = async (req, res) => {
    try {
        const locationId = req.user.location_id ?? null;
        const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

        if (locationId) {
            await Items.removePerLoc(req.params.id, locationId, isActive);
        } else {
            await Items.remove(req.params.id, isActive);
        }

        const msg = isActive ? 'Barang berhasil diaktifkan' : 'Barang berhasil dinonaktifkan';
        response(200, null, msg, res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getConversions = async (req, res) => {
    try {
        const data = await Items.getConversions(req.params.item_id);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getAllItems, createItems, getConversions, updateItems, deleteItems, getItem, getItemsPerLoc, getByItemOrLocation };