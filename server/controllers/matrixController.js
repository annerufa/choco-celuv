// controllers/stockMatrixController.js
const {
    getStockMatrix,
    getStockMatrixByBooth,
    toggleItemActiveBooth,
} = require('../models/matrixModel');

/**
 * GET /api/stock/matrix
 * Query param opsional: ?location_id=2 untuk filter satu booth
 */
async function getMatrix(req, res) {
    try {
        const { location_id } = req.query;
        console.log('getMatrix location_id:', location_id); // Debug log
        const rows = location_id
            ? await getStockMatrixByBooth(location_id)
            : await getStockMatrix();

        res.json({
            payload: {
                message: 'Success',
                data: rows,
            },
        });
    } catch (err) {
        console.error('getMatrix error:', err);
        res.status(500).json({ payload: { message: err.message } });
    }
}

/**
 * PATCH /api/stock/matrix/toggle
 * Body: { item_id, location_id, is_active }
 */
async function toggleActive(req, res) {
    try {
        const { item_id, location_id, is_active } = req.body;

        if (!item_id || !location_id || is_active === undefined) {
            return res.status(400).json({ payload: { message: 'item_id, location_id, dan is_active wajib diisi' } });
        }

        await toggleItemActiveBooth(item_id, location_id, is_active ? 1 : 0);

        res.json({ payload: { message: 'Status item berhasil diubah' } });
    } catch (err) {
        console.error('toggleActive error:', err);
        res.status(500).json({ payload: { message: err.message } });
    }
}

module.exports = { getMatrix, toggleActive };