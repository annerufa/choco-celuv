const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items ORDER BY id DESC',
    );
    return rows[0];
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

const create = async (data) => {
    const { name, category, unit, is_active } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Insert item baru
        const [result] = await conn.execute(
            `INSERT INTO items (name, category, unit, is_active, avg_price, last_price)
             VALUES (?, ?, ?, ?,0,0)`,
            [name, category, unit, is_active ?? 1]
        );

        const item_id = result.insertId;

        // 2. Ambil semua lokasi yang ada
        const [locations] = await conn.execute(
            `SELECT id FROM stock_locations`
        );

        if (locations.length === 0) {
            throw new Error('Belum ada lokasi yang di-setup. Hubungi administrator.');
        }

        // 3. Generate stock_per_location untuk semua lokasi
        for (const loc of locations) {
            await conn.execute(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty)
                 VALUES (?, ?, 0, ?, ?)`,
                [item_id, loc.id, data.min_qty ?? 0, data.max_qty ?? 0]
            );
        }

        await conn.commit();
        return { id: item_id, ...data };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getItem = async (id) => {
    const [rows] = await db.query(
        `SELECT * FROM items where id = ?`,
        [id]
    );
    return rows[0];
};
// dapat info item dan stok di semua lokasi
const getByItemId = async (item_id) => {
    const [rows] = await db.query(
        `SELECT 
            spl.*,
            sl.name  AS location_name,
            sl.type  AS location_type
        FROM stock_per_location spl
        JOIN stock_locations sl ON sl.id = spl.location_id
        WHERE spl.item_id = ?
        ORDER BY sl.name ASC`, [item_id]);
    return rows;
};

// Semua item di 1 lokasi (untuk tabel barang per gudang/booth)
const getByLocation = async (location_id) => {
    const [rows] = await db.query(
        `SELECT 
            spl.*,
            i.name     AS item_name,
            i.category,
            i.unit,
            i.last_price
        FROM stock_per_location spl
        JOIN items i ON i.id = spl.item_id
        WHERE spl.location_id = ?
        ORDER BY i.name ASC`, [location_id]);
    return rows;
};

const getById = async (loc_id) => {
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

const getMatrix = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items i JOIN stock_per_loc s ON i.id = s.item_id WHERE s.location_id = ? AND s.is_active = 1',
    );
    return rows[0];
};



// update, remove, getById, dll...

module.exports = { getAll, create, getAllPerLoc, getById, getMatrix, getItem, getByItemId, getByLocation };