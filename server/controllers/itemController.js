const Items = require('../models/itemModel');
const response = require('../helpers/response');

const getAllItems = async (req, res) => {
    try {
        const { location_id, role } = req.user;
        if (!role) return response(403, null, 'Tidak memiliki akses', res);
        const data = await Items.getAll();
        response(200, data, 'Berhasil mengambil semua barang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getMyItems = async (req, res) => {
    try {
        const { location_id, role } = req.user;
        if (!location_id) return response(403, null, 'Tidak memiliki akses', res);
        data = await Items.getAllPerLoc(location_id);
        response(200, data, 'Berhasil mengambil data semua barang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const createItems = async (req, res) => {
    try {
        const { location_id, role } = req.user;
        if (role != "pemilik") return response(403, null, 'Tidak memiliki akses', res);

        // validasi field wajib
        const { name, category, unit } = req.body;
        if (!name || !category || !unit) {
            return response(400, null, 'Nama, kategori, dan satuan wajib diisi', res);
        }

        const result = await Items.create(req.body);
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
        const locationId = req.user.location_id;
        await Items.update(req.params.id, req.body, locationId);
        response(200, null, 'Barang berhasil diupdate', res);
    } catch (err) {
        console.error('Update error:', err); // ← tambah logging
        response(500, null, err.message, res);
    }
};
const statusItem = async (req, res) => {
    try {
        const locationId = req.user.location_id ?? null;
        const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

        await Items.statusChange(req.params.id, isActive, locationId);

        const msg = isActive ? 'Barang berhasil diaktifkan' : 'Barang berhasil dinonaktifkan';
        response(200, null, msg, res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};



const getItem = async (req, res) => {
    try {
        const locationId = req.user.location_id ?? null;
        const data = await Items.getItem(req.params.id, locationId);
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


// GET /items/:id/booth-settings
const getBoothSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Items.getBoothSettingsByItemId(id);
        response(200, result, 'Berhasil mengambil data booth settings', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// PATCH /items/:id/booth-settings
const updateBoothSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { booths } = req.body;

        // Validasi basic
        if (!Array.isArray(booths) || booths.length === 0) {
            return response(400, null, 'Data booth tidak boleh kosong', res);
        }

        for (const b of booths) {
            if (b.booth_id === undefined || b.booth_id === null) {
                return response(400, null, 'booth_id wajib ada di setiap item', res);
            }
            if (b.is_active) {
                // hanya validasi angka jika booth aktif
                if (b.min > b.max) {
                    return response(400, null, `Min tidak boleh lebih besar dari maks (booth_id: ${b.booth_id})`, res);
                }
                if (b.safety_stock < 0 || b.min < 0 || b.max < 0) {
                    return response(400, null, `Nilai tidak boleh negatif (booth_id: ${b.booth_id})`, res);
                }
            }
        }

        const result = await Items.updateBoothSettings(id, booths);
        response(200, result, 'Pengaturan booth berhasil disimpan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getAllItems, getMyItems, createItems, statusItem, getConversions, getBoothSettings, updateBoothSettings, updateItems, deleteItems, getItem, getItemsPerLoc, getByItemOrLocation };