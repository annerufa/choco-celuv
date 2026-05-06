const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        'SELECT * FROM booth ORDER BY id DESC',
    );
    return rows;
};
const create = async (data) => {
    const { name, address, longitude, latitude, penyewa, cp_penyewa, harga, is_active, is_open } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Insert item baru
        const [result] = await conn.execute(
            `INSERT INTO booth (name, address, longitude, latitude, penyewa, cp_penyewa, harga, is_active, is_open)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, address, longitude, latitude, penyewa, cp_penyewa, harga, is_active, is_open]
        );

        const booth_id = result.insertId;
        const namaLokasi = `Gudang ${name}`;

        // tambah gudang baru
        const [stokLoc] = await conn.execute(
            `INSERT INTO stock_locations (name, type, booth_id)
             VALUES (?, ?, ?)`,
            [namaLokasi, 'booth', booth_id]
        );

        // tambah stock_per_location untuk semua item yang ada
        const [items] = await conn.execute(
            `SELECT id FROM items`
        );
        for (const item of items) {
            await conn.execute(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty) 
                    VALUES (?, ?, 0, 0, 0)`,
                [item.id, stokLoc.insertId]
            );
        }


        await conn.commit();
        return { id: result.insertId, ...data };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const update = async (id, data) => {
    const { name, address, longitude, latitude, penyewa, cp_penyewa, harga, is_active, is_open } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Update booth
        await conn.execute(
            `UPDATE booth 
             SET name=?, address=?, longitude=?, latitude=?, penyewa=?, cp_penyewa=?, harga=?, is_active=?, is_open=?
             WHERE id=?`,
            [name, address, longitude, latitude, penyewa, cp_penyewa, harga, is_active, is_open, id]
        );

        // 2. Sync nama gudang di stock_locations
        await conn.execute(
            `UPDATE stock_locations 
             SET name=? 
             WHERE booth_id=? AND type='booth'`,
            [`Gudang ${name}`, id]
        );

        await conn.commit();
        return { id, ...data };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

module.exports = { getAll, create, update };