const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items ORDER BY id DESC',
    );
    return rows;
};

const getAllPerLoc = async (loc_id) => {
    const [rows] = await db.query(
        `SELECT 
            i.*,
            sl.current_stock,
            sl.safety_stock,
            sl.min_qty,
            sl.max_qty,
            sl.is_active AS stock_active
         FROM items i
         JOIN stock_per_location sl ON i.id = sl.item_id
         WHERE sl.location_id = ?
         ORDER BY i.name ASC`,
        [loc_id]
    );
    return rows;
};

const create = async (data) => {
    const { name, category, unit, safety_stock, min_qty, max_qty, is_active } = data;

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
            `SELECT id, type FROM stock_locations`
        );

        if (locations.length === 0) {
            throw new Error('Belum ada lokasi yang di-setup. Hubungi administrator.');
        }

        // 3. Generate stock_per_location untuk semua lokasi
        for (const loc of locations) {
            const isGudangPusat = loc.type === 'warehouse';
            console.log('isGudangPusat:', isGudangPusat);

            await conn.execute(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty, safety_stock)
         VALUES (?, ?, 0, ?, ?, ?)`,
                [
                    item_id,
                    loc.id,
                    isGudangPusat ? min_qty : 0,
                    isGudangPusat ? max_qty : 0,
                    isGudangPusat ? safety_stock : 0,
                ]
            );
        }

        await conn.commit();
        // return { id: item_id, ...data };
        return {
            id: item_id,
            name,
            category,
            unit,
            is_active: data.is_active ?? 1,
            avg_price: 0,
            last_price: 0,
            safety_stock,
            min_qty,
            max_qty,
        };

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

const update = async (id, data, location_id) => {
    const { name, category, unit, safety_stock, min_qty, max_qty, is_active } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. update tabel item 
        const [result] = await conn.execute(
            `UPDATE items SET name=?, category=?, unit=?, is_active=?
             WHERE id=?`,
            [name, category, unit, is_active, id]
        );
        // 2. update tabel stock_per_location untuk lokasi gudang pusat saja
        const [result2] = await conn.execute(
            `UPDATE stock_per_location SET min_qty=?, max_qty=?, is_active=?, safety_stock=? WHERE item_id=? AND location_id = ?`,
            [min_qty, max_qty, is_active, safety_stock, id, location_id]
        );

        if (location_id === 1) {
            await conn.execute(
                `UPDATE stock_per_location SET is_active=? 
                 WHERE item_id=? AND location_id != 1`,
                [is_active, id]
            );
        }

        await conn.commit();
        // return { id: item_id, ...data };
        return {
            id: id,
            name,
            category,
            unit,
            is_active: data.is_active ?? 1,
            safety_stock,
            min_qty,
            max_qty,
        };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const remove = async (id, isActive) => {
    await db.query('UPDATE items SET is_active = ? WHERE id = ?', [isActive, id]);
};

const removePerLoc = async (itemId, locationId, isActive) => {
    await db.query(
        'UPDATE stock_per_location SET is_active = ? WHERE item_id = ? AND location_id = ?',
        [isActive, itemId, locationId]
    );
};

const getConversions = async (item_id) => {
    const [rows] = await db.query(
        `SELECT * FROM unit_conversions WHERE item_id = ?`,
        [item_id]
    );
    return rows;
};


module.exports = { getAll, create, update, remove, removePerLoc, getAllPerLoc, getById, getMatrix, getItem, getByItemId, getByLocation, getConversions };