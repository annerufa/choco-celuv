// stockMovementController.js
const StockMovement = require('../models/stockMovementModel');
const response = require('../helpers/response');

const trackItem = async (req, res) => {
    try {
        const { item_id, limit } = req.query;
        if (!item_id) return response(400, null, 'item_id wajib diisi', res);

        const data = await StockMovement.getByItemId(item_id, limit);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { trackItem };