const Stock = require('../models/stockLocModel');
const response = require('../helpers/response');
const db = require('../connection');

const getByLocation = async (req, res) => {
    try {
        const { location_id } = req.query; // ← ambil dari ?location_id=1

        if (!location_id) {
            return response(400, null, 'location_id wajib diisi', res);
        }

        const data = await Stock.getByLocation(location_id); // ← kirim ke model
        response(200, data, 'Berhasil mengambil data stok di gudang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// const createItems = async (req, res) => {
//     try {
//         const result = await Items.create(req.body);
//         const data = { id: result.insertId, ...req.body };
//         response(200, data, 'Barang berhasil ditambahkan', res);
//     } catch (err) {
//         response(500, null, err.message, res);
//     }
// };

// const updateItems = async (req, res) => {
//     try {
//         await Items.update(req.params.id, req.body);
//         response(200, null, 'Barang berhasil diupdate', res);
//     } catch (err) {
//         response(500, null, err.message, res);
//     }
// };

// const deleteItems = async (req, res) => {
//     try {
//         await Items.remove(req.params.id);
//         response(200, null, 'Barang berhasil dihapus', res);
//     } catch (err) {
//         response(500, null, err.message, res);
//     }
// };
// route baru, misal GET /stock-locations
const getAllLocations = async (req, res) => {
    const [rows] = await db.query(
        `SELECT id AS location_id, name, type FROM stock_locations ORDER BY type DESC, name`
    );
    return response(200, rows, 'OK', res);
};
module.exports = { getByLocation, getAllLocations };