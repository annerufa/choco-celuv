const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items ORDER BY id DESC',
    );
    return rows;
};

const getAllAktif = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items WHERE is_active=1 ORDER BY id DESC',
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
            sl.is_active AS stock_active,
            sl.can_purchase
         FROM items i
         JOIN stock_per_location sl ON i.id = sl.item_id
         WHERE sl.location_id = ? AND i.is_active = 1
         ORDER BY i.updated_at DESC`,
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

            await conn.execute(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty, safety_stock)
         VALUES (?, ?, 0, 0,0,0)`,
                [
                    item_id,
                    loc.id
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

const update = async (id, data, location_id) => {
    const { name, category, unit, safety_stock, min_qty, max_qty, is_active } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        // ambil data is_active lama dulu
        const [existing] = await conn.execute(
            `SELECT is_active FROM items WHERE id = ?`, [id]
        );
        const isActiveChanged = existing[0].is_active !== is_active;

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
        // klo status berubah, update semua lokasi
        if (isActiveChanged) {
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

// soft delete
const statusChange = async (id, isActive, location_id) => {
    if (location_id === 1) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(
                `UPDATE items SET is_active=? WHERE id=?`,
                [isActive, id]
            );
            await conn.execute(
                `UPDATE stock_per_location SET is_active=? WHERE item_id=?`,
                [isActive, id]
            );
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } else {
        await db.execute(
            `UPDATE stock_per_location SET is_active=? WHERE item_id=? AND location_id=?`,
            [isActive, id, location_id]
        );
    }
};

const getMatrix = async () => {
    const [rows] = await db.query(
        'SELECT * FROM items i JOIN stock_per_loc s ON i.id = s.item_id WHERE s.location_id = ? AND s.is_active = 1',
    );
    return rows[0];
};


const getItem = async (id, location_id) => {

    const [rows] = await db.query(
        `SELECT i.*, spl.current_stock, spl.min_qty, spl.max_qty, spl.safety_stock, spl.can_purchase FROM items i JOIN stock_per_location spl ON i.id = spl.item_id
        WHERE i.id = ? AND location_id = ?`, [id, location_id]
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
            i.*,
            sl.current_stock,
            sl.safety_stock,
            sl.min_qty,
            sl.max_qty,
            sl.is_active AS stock_active,
            sl.can_purchase
         FROM items i
         JOIN stock_per_location sl ON i.id = sl.item_id
         WHERE sl.location_id = ?
         ORDER BY i.updated_at DESC`,
        [location_id]);
    return rows;
};

const getById = async (loc_id) => {
    const [rows] = await db.query(
        `SELECT 
            i.*,
            sl.current_stock,
            sl.min_qty,
            sl.max_qty,
            sl.safety_stock
            , sl.can_purchase
         FROM items i
         JOIN stock_per_location sl ON i.id = sl.item_id
         WHERE sl.location_id = ?
         AND i.is_active = 1
         ORDER BY i.name ASC`,
        [loc_id]
    );
    return rows;
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

// Ambil semua booth settings untuk 1 item (untuk isi modal)
const getBoothSettingsByItemId = async (item_id) => {
    const [rows] = await db.execute(
        `SELECT 
            sl.id AS booth_id,
            b.name AS booth_name,         -- dari tabel booth, bukan stock_locations
            spl.safety_stock,
            spl.min_qty AS min,
            spl.max_qty AS max,
            spl.is_active,
            spl.can_purchase
         FROM stock_locations sl
         JOIN booth b ON b.id = sl.booth_id
         LEFT JOIN stock_per_location spl 
            ON spl.location_id = sl.id AND spl.item_id = ?
         WHERE sl.type = 'booth'
         ORDER BY b.name`,
        [item_id]
    );
    return rows;
};

// Update hanya booth yang dirty (bulk, satu item)
const updateBoothSettings = async (item_id, booths) => {
    // booths: [{ booth_id, safety_stock, min, max, is_active }]

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        for (const b of booths) {
            await conn.execute(
                `UPDATE stock_per_location
                 SET safety_stock = ?,
                     min_qty      = ?,
                     max_qty      = ?,
                     is_active    = ?,
                     can_purchase = ?
                 WHERE item_id     = ?
                   AND location_id = ?`,
                [b.safety_stock, b.min, b.max, b.is_active ? 1 : 0, b.can_purchase ? 1 : 0, item_id, b.booth_id]
            );
        }

        await conn.commit();
        return { item_id, updated: booths.length };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};


const createConversion = async (item_id, data) => {
    const { label, buy_unit, buy_qty, base_unit, base_qty } = data;
    const [result] = await db.execute(
        `INSERT INTO unit_conversions (item_id, label, buy_unit, buy_qty, base_unit, base_qty)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item_id, label, buy_unit, buy_qty, base_unit, base_qty]
    );
    return { id: result.insertId, item_id, label, buy_unit, buy_qty, base_unit, base_qty };
};

const deleteConversion = async (item_id, uc_id) => {
    const [result] = await db.execute(
        `DELETE FROM unit_conversions WHERE id = ? AND item_id = ?`,
        [uc_id, item_id]
    );
    if (result.affectedRows === 0) throw new Error('Konversi tidak ditemukan');
    return true;
};
const getBoothStock = async (userId) => {
    const [[loc]] = await db.query(`
        SELECT sl.id AS location_id
        FROM employee_schedules es
        JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
        WHERE es.employee_id = ? AND es.is_active = 1
        LIMIT 1
    `, [userId]);

    if (!loc) return [];

    const [rows] = await db.query(`
        SELECT 
            spl.item_id, sl.id AS location_id,
            i.name, i.category, i.unit,
            spl.current_stock, spl.safety_stock, spl.min_qty, spl.max_qty, spl.can_purchase
        FROM stock_per_location spl
        JOIN items i ON i.id = spl.item_id
        JOIN stock_locations sl ON sl.id = spl.location_id
        WHERE spl.location_id = ? AND spl.is_active = 1
        ORDER BY i.name ASC
    `, [loc.location_id]);

    return rows;
};


module.exports = { getAllAktif, getBoothStock, getBoothSettingsByItemId, updateBoothSettings, getAll, create, update, statusChange, removePerLoc, getAllPerLoc, getById, getMatrix, getItem, getByItemId, getByLocation, getConversions, getConversions, createConversion, deleteConversion };