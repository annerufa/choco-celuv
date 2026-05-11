const db = require('../connection');

const getAll = async ({ type, status, from_location_id, to_location_id, start_date, end_date, limit = 50, offset = 0 } = {}) => {
    const where = [];
    const params = [];

    if (type) { where.push('d.type = ?'); params.push(type); }
    if (status) { where.push('d.status = ?'); params.push(status); }
    if (from_location_id) { where.push('d.from_location_id = ?'); params.push(from_location_id); }
    if (to_location_id) { where.push('d.to_location_id = ?'); params.push(to_location_id); }
    if (start_date) { where.push('d.planned_date >= ?'); params.push(start_date); }
    if (end_date) { where.push('d.planned_date <= ?'); params.push(end_date); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
        `SELECT
            d.id,
            d.type,
            d.planned_date,
            d.status,
            d.notes,
            d.created_at,

            -- Asal
            sl_from.name        AS from_location_name,
            sl_from.type        AS from_location_type,

            -- Tujuan
            sl_to.name          AS to_location_name,
            sl_to.type          AS to_location_type,

            -- Kurir (nullable)
            u_kurir.name        AS kurir_name,

            -- Pembuat
            u_creator.name      AS created_by_name

         FROM distributions d
         LEFT JOIN stock_locations sl_from  ON d.from_location_id = sl_from.id
         LEFT JOIN stock_locations sl_to    ON d.to_location_id   = sl_to.id
         LEFT JOIN users u_kurir            ON d.kurir_id         = u_kurir.id
         LEFT JOIN users u_creator          ON d.created_by       = u_creator.id
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
    );

    const [[{ total_count }]] = await db.query(
        `SELECT COUNT(*) AS total_count FROM distributions d ${whereClause}`,
        params
    );

    return { data: rows, total_count };
};

const create = async (data) => {
    const { type, from_location_id, to_location_id, kurir_id, created_by, planned_date, notes, items } = data;

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Insert header distributions
        const [result] = await conn.execute(
            `INSERT INTO distributions 
                (type, from_location_id, to_location_id, kurir_id, created_by, planned_date, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [type, from_location_id, to_location_id, kurir_id ?? null, created_by, planned_date, notes ?? null]
        );

        const distribution_id = result.insertId;

        // 2. Insert tiap item
        // Setelah insert distribution_items, tambah ini di dalam loop:
        for (const item of items) {
            await conn.execute(
                `INSERT INTO distribution_items (distribution_id, item_id, qty, notes)
                    VALUES (?, ?, ?, ?)`,
                [distribution_id, item.item_id, item.qty, item.notes ?? null]
            );

            // Cek stok from_location mencukupi
            const [[currentStock]] = await conn.execute(
                `SELECT current_stock FROM stock_per_location
                WHERE item_id = ? AND location_id = ?`,
                [item.item_id, from_location_id]
            );

            if (!currentStock) throw new Error(`Item id ${item.item_id} tidak ditemukan di lokasi asal`);
            if (Number(currentStock.current_stock) < item.qty) {
                throw new Error(`Stok item id ${item.item_id} tidak mencukupi. Stok saat ini: ${currentStock.current_stock}`);
            }

            // Kurangi stok from_location
            await conn.execute(
                `UPDATE stock_per_location
                SET current_stock = current_stock - ?
                WHERE item_id = ? AND location_id = ?`,
                [item.qty, item.item_id, from_location_id]
            );

            // Catat movement OUT dari from_location
            await conn.execute(
                `INSERT INTO stock_movements
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'OUT', 'distribution', ?)`,
                [item.item_id, from_location_id, item.qty, distribution_id]
            );
        }

        await conn.commit();
        return { distribution_id };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const confirmBooth = async (distribution_id, confirmed_by) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [[dist]] = await conn.execute(
            `SELECT * FROM distributions WHERE id = ?`, [distribution_id]
        );

        if (!dist) throw new Error('Distribusi tidak ditemukan');
        if (dist.status === 'diterima') throw new Error('Sudah dikonfirmasi');
        if (dist.status === 'dibatalkan') throw new Error('Distribusi sudah dibatalkan');

        const [items] = await conn.execute(
            `SELECT * FROM distribution_items WHERE distribution_id = ?`, [distribution_id]
        );

        for (const item of items) {
            // Tambah stok to_location
            await conn.execute(
                `UPDATE stock_per_location
                 SET current_stock = current_stock + ?
                 WHERE item_id = ? AND location_id = ?`,
                [item.qty, item.item_id, dist.to_location_id]
            );

            // Catat movement IN ke to_location
            await conn.execute(
                `INSERT INTO stock_movements
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'IN', 'distribution', ?)`,
                [item.item_id, dist.to_location_id, item.qty, distribution_id]
            );
        }

        await conn.execute(
            `UPDATE distributions
             SET status = 'diterima', confirmed_by_booth = ?, confirmed_at_booth = NOW()
             WHERE id = ?`,
            [confirmed_by, distribution_id]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
const cancel = async (distribution_id, cancelled_by) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [[dist]] = await conn.execute(
            `SELECT * FROM distributions WHERE id = ?`, [distribution_id]
        );

        if (!dist) throw new Error('Distribusi tidak ditemukan');
        if (dist.status === 'dibatalkan') throw new Error('Sudah dibatalkan');
        if (dist.status === 'diterima') throw new Error('Tidak bisa batal, sudah diterima');

        const [items] = await conn.execute(
            `SELECT * FROM distribution_items WHERE distribution_id = ?`, [distribution_id]
        );

        for (const item of items) {
            // Kembalikan stok from_location
            await conn.execute(
                `UPDATE stock_per_location
                 SET current_stock = current_stock + ?
                 WHERE item_id = ? AND location_id = ?`,
                [item.qty, item.item_id, dist.from_location_id]
            );

            // Catat movement IN (pembatalan)
            await conn.execute(
                `INSERT INTO stock_movements
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'IN', 'distribution_cancel', ?)`,
                [item.item_id, dist.from_location_id, item.qty, distribution_id]
            );
        }

        await conn.execute(
            `UPDATE distributions SET status = 'dibatalkan' WHERE id = ?`,
            [distribution_id]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
module.exports = { getAll, create, confirmBooth, cancel };