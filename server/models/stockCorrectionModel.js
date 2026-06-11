const db = require('../connection');

const create = async ({ item_id, location_id, qty, movement_type, notes, created_by }) => {
    const [result] = await db.query(
        `INSERT INTO stock_corrections (item_id, location_id, qty, movement_type, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item_id, location_id, qty, movement_type, notes ?? null, created_by]
    );
    return result.insertId;
};

module.exports = { create };