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
            // await conn.execute(
            //     `UPDATE stock_per_location
            //     SET current_stock = current_stock - ?
            //     WHERE item_id = ? AND location_id = ?`,
            //     [item.qty, item.item_id, from_location_id]
            // );

            // Catat movement OUT dari from_location
            // await conn.execute(
            //     `INSERT INTO stock_movements
            //         (item_id, location_id, qty, movement_type, source_type, source_id)
            //      VALUES (?, ?, ?, 'OUT', 'distribution', ?)`,
            //     [item.item_id, from_location_id, item.qty, distribution_id]
            // );
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


const getByKurir = async (kurir_id, status) => {
    let sql = `
        SELECT 
            d.*,
            fl.name AS from_location_name,
            tl.name AS to_location_name,
            u.name  AS kurir_name
        FROM distributions d
        LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
        LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
        LEFT JOIN users u ON u.id = d.kurir_id
        WHERE d.kurir_id = ?
    `;
    const params = [kurir_id];

    if (status) {
        sql += ' AND d.status = ?';
        params.push(status);
    }

    sql += ' ORDER BY d.planned_date ASC, d.id DESC';

    const [rows] = await db.query(sql, params);
    return rows;
};

const getItems = async (distribution_id) => {
    const [rows] = await db.query(
        `SELECT 
            di.*,
            i.name AS item_name,
            i.unit
         FROM distribution_items di
         JOIN items i ON i.id = di.item_id
         WHERE di.distribution_id = ?`,
        [distribution_id]
    );
    return rows;
};

// Pickup: ubah status → dikirim + catat kurir + kurangi stok gudang
const pickup = async (distribution_id, kurir_id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Cek distribusi valid & masih draft
        const [[dist]] = await conn.execute(
            `SELECT * FROM distributions WHERE id = ? AND kurir_id = ?`,
            [distribution_id, kurir_id]
        );
        if (!dist) throw new Error('Distribusi tidak ditemukan atau bukan milik kamu');
        if (dist.status !== 'draft') throw new Error('Distribusi bukan draft, tidak bisa di-pickup');

        // 2. Ambil semua item distribusi
        const [items] = await conn.execute(
            `SELECT * FROM distribution_items WHERE distribution_id = ?`,
            [distribution_id]
        );

        // 3. Kurangi stok di gudang asal (from_location_id)
        for (const item of items) {
            await conn.execute(
                `UPDATE stock_per_location 
                 SET current_stock = current_stock - ?
                 WHERE item_id = ? AND location_id = ?`,
                [item.qty, item.item_id, dist.from_location_id]
            );

            // 4. Catat stock movement
            await conn.execute(
                `INSERT INTO stock_movements 
                 (item_id, location_id, movement_type, qty, source_type, source_id, created_by)
                 VALUES (?, ?, 'OUT', ?, 'distribution', ?, ?)`,
                [item.item_id, dist.from_location_id, item.qty, distribution_id, kurir_id]
            );
        }

        // 5. Update status distribusi → dikirim
        await conn.execute(
            `UPDATE distributions 
             SET status = 'dikirim',
                 confirmed_by_kurir = ?,
                 confirmed_at_kurir = NOW()
             WHERE id = ?`,
            [kurir_id, distribution_id]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// Tambahkan ke distributionModel.js

const getDisToday = async (kurir_id) => {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // 1. Ambil header distribusi milik kurir hari ini
    const [rows] = await db.query(
        `SELECT 
            d.id,
            d.status,
            d.notes,
            d.planned_date,
            d.confirmed_at_kurir,
            fl.name AS from_location_name,
            tl.name AS to_location_name,
            tl.id   AS to_location_id
         FROM distributions d
         LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
         LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
         WHERE d.kurir_id = ?
           AND DATE(d.planned_date) = ?
           AND d.status != 'dibatalkan'
         ORDER BY d.id ASC`,
        [kurir_id, today]
    );

    if (!rows.length) return [];

    // 2. Ambil semua items sekaligus (1 query, bukan N query)
    const ids = rows.map(r => r.id);
    const [items] = await db.query(
        `SELECT 
            di.distribution_id,
            di.qty,
            di.notes AS item_notes,
            i.name   AS name,
            i.unit
         FROM distribution_items di
         JOIN items i ON i.id = di.item_id
         WHERE di.distribution_id IN (?)`,
        [ids]
    );

    // 3. Group items ke tiap distribusi
    const itemMap = {};
    for (const item of items) {
        if (!itemMap[item.distribution_id]) itemMap[item.distribution_id] = [];
        itemMap[item.distribution_id].push({
            name: item.name,
            qty: item.qty,
            unit: item.unit,
            notes: item.item_notes,
        });
    }

    // 4. Gabungkan
    return rows.map(d => ({
        id: d.id,
        delivery_code: `#DIST-${String(d.id).padStart(4, '0')}`,
        booth_name: d.to_location_name,
        from_location_name: d.from_location_name,
        status: d.status,           // 'draft' | 'dikirim' | 'diterima'
        planned_date: d.planned_date,
        confirmed_at_kurir: d.confirmed_at_kurir,
        notes: d.notes,
        items: itemMap[d.id] ?? [],
    }));
};

const getById = async (id) => {
    const [[distribution]] = await db.query(
        `SELECT 
            d.*,
            fl.name  AS from_location_name,
            tl.name  AS to_location_name,
            cb.name  AS created_by_name,
            k.name   AS kurir_name,
            ck.name  AS confirmed_by_kurir_name,
            cbooth.name AS confirmed_by_booth_name
        FROM distributions d
        LEFT JOIN stock_locations fl    ON fl.id = d.from_location_id
        LEFT JOIN stock_locations tl    ON tl.id = d.to_location_id
        LEFT JOIN users cb              ON cb.id = d.created_by
        LEFT JOIN users k               ON k.id  = d.kurir_id
        LEFT JOIN users ck              ON ck.id = d.confirmed_by_kurir
        LEFT JOIN users cbooth          ON cbooth.id = d.confirmed_by_booth
        WHERE d.id = ?`,
        [id]
    );

    if (!distribution) return null;

    const [items] = await db.query(
        `SELECT 
            di.*,
            i.name AS item_name,
            i.unit
        FROM distribution_items di
        JOIN items i ON i.id = di.item_id
        WHERE di.distribution_id = ?`,
        [id]
    );

    return { ...distribution, items };
};
module.exports = { getAll, create, getById, confirmBooth, cancel, getByKurir, getItems, pickup, getDisToday };