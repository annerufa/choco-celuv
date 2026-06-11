// stockMovementController.js
const StockMovement = require('../models/stockMovementModel');
const response = require('../helpers/response');

const trackItem = async (req, res) => {
    try {
        const { item_id, location_id, limit, date_from, date_to } = req.query;
        const id_loc = location_id ?? req.user.location_id; // ← ini aja yang berubah

        // console.log('req.user full:', req.user);
        if (!item_id) return response(400, null, 'item_id wajib diisi', res);

        const data = await StockMovement.getByItemId(item_id, limit, id_loc, date_from, date_to); // ← teruskan ke model
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { trackItem };