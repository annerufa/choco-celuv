const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        "SELECT b.*, GROUP_CONCAT(u.name SEPARATOR ', ') as pegawai , COUNT(es.employee_id) as jumlah_pegawai FROM booth b LEFT JOIN employee_schedules es ON b.id = es.booth_id AND es.is_active = 1 LEFT JOIN users u ON es.employee_id = u.id GROUP BY b.id ORDER BY b.is_active DESC;",
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
    console.log('UPDATE id:', id, typeof id); // ← cek ini
    console.log('UPDATE data:', data);
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Update booth
        const [result] = await conn.execute(
            `UPDATE booth 
             SET name=?, address=?, latitude=?, longitude=?, penyewa=?, cp_penyewa=?, harga=?, is_active=?, is_open=?
             WHERE id=?`,
            [name, address, latitude, longitude, penyewa, cp_penyewa, harga, is_active, is_open, id]
        );

        // 2. Sync nama gudang di stock_locations
        await conn.execute(
            `UPDATE stock_locations 
             SET name=? 
             WHERE booth_id=? AND type='booth'`,
            [`Gudang ${name}`, id]
        );

        await conn.commit();
        console.log('Rows affected:', result.affectedRows);
        return { id, ...data };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const statusChange = async (id, isActive) => {
    const [row] = await db.execute(
        `UPDATE booth SET is_active=? WHERE id=?`,
        [isActive, id]
    );
    return row[0];
};
module.exports = { getAll, create, update, statusChange };