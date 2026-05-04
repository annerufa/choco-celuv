const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(`
        SELECT 
            r.*,
            GROUP_CONCAT(
                CONCAT(rb.item_id, '|', i.name, '|', i.unit, '|', rb.qty)
                SEPARATOR ';;'
            ) AS bahan_raw
        FROM recipes r
        LEFT JOIN recipe_items rb ON rb.recipe_id = r.id
        LEFT JOIN items i ON i.id = rb.item_id
        GROUP BY r.id
        ORDER BY r.id DESC
    `);

    return rows.map(r => ({
        ...r,
        bahan: r.bahan_raw
            ? r.bahan_raw.split(';;').map(b => {
                const [item_id, item_name, unit, qty_per_unit] = b.split('|');
                return {
                    item_id: Number(item_id),
                    item_name,
                    unit,
                    qty_per_unit: Number(qty_per_unit),
                };
            })
            : [],
        bahan_raw: undefined,
    }));
};
const getAllPerLoc = async (loc_id) => {
    const [rows] = await db.query(
        `SELECT 
            i.*,
            sl.current_stock,
            sl.min_qty,
            sl.max_qty
         FROM items i
         JOIN stock_per_location sl ON i.id = sl.item_id
         WHERE sl.location_id = ?
         AND i.is_active = 1
         ORDER BY i.name ASC`,
        [loc_id]
    );
    return rows;
};
module.exports = { getAll, getAllPerLoc };