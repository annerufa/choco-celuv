// stockMovementModel.js
const db = require('../connection');

const getByItemId = async (item_id, limit = 20, id_loc) => {
    const [rows] = await db.query(
        `SELECT 
            sm.*,
            sl.name AS location_name
        FROM stock_movements sm
        LEFT JOIN stock_locations sl ON sl.id = sm.location_id
        WHERE sm.item_id = ?  AND sm.location_id = ?
        ORDER BY sm.created_at DESC
        LIMIT ?`, [item_id, id_loc, Number(limit)]);
    return rows;
};
module.exports = { getByItemId };