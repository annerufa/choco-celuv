// models/stockMatrixModel.js
const db = require('../connection'); // sesuaikan path koneksi db kamu

/**
 * Ambil semua data stok booth untuk matrix view.
 * Hanya ambil lokasi bertipe 'booth' (bukan warehouse).
 * Item yang tidak ada di stock_per_location di booth tertentu
 * tetap muncul dengan is_active = null (ditampilkan sebagai —).
 */
async function getStockMatrix() {
    const [rows] = await db.query(`
        SELECT
            i.id            AS item_id,
            i.name          AS item_name,
            i.category,
            i.unit,
            sl.id           AS location_id,
            b.name          AS booth_name,
            spl.current_stock,
            spl.min_qty,
            spl.max_qty,
            spl.safety_stock,
            spl.is_active
        FROM items i
        CROSS JOIN stock_locations sl
        JOIN booth b ON b.id = sl.booth_id
        LEFT JOIN stock_per_location spl
            ON spl.item_id = i.id
            AND spl.location_id = sl.id
        WHERE
            i.is_active = 1
            AND sl.type = 'booth'
        ORDER BY
            i.category,
            i.name,
            sl.id
    `);

    return rows;
}

/**
 * Ambil matrix untuk satu booth tertentu saja.
 * Berguna kalau frontend filter by booth agar tidak load semua data.
 */
async function getStockMatrixByBooth(locationId) {
    const [rows] = await db.query(`
        SELECT
            i.id            AS item_id,
            i.name          AS item_name,
            i.category,
            i.unit,
            sl.id           AS location_id,
            sl.name         AS booth_name,
            spl.current_stock,
            spl.min_qty,
            spl.max_qty,
            spl.safety_stock,
            spl.is_active
        FROM items i
        JOIN stock_locations sl ON sl.id = ?
        LEFT JOIN stock_per_location spl
            ON spl.item_id = i.id
            AND spl.location_id = sl.id
        WHERE
            i.is_active = 1
            AND sl.type = 'booth'
        ORDER BY
            i.category,
            i.name
    `, [locationId]);

    return rows;
}

/**
 * Toggle is_active item di satu lokasi booth tertentu.
 * Jika row belum ada di stock_per_location, buat dulu dengan stock = 0.
 */
async function toggleItemActiveBooth(itemId, locationId, isActive) {
    await db.query(`
        INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty, is_active)
        VALUES (?, ?, 0, 0, 0, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
    `, [itemId, locationId, isActive, isActive]);
}

module.exports = {
    getStockMatrix,
    getStockMatrixByBooth,
    toggleItemActiveBooth,
};