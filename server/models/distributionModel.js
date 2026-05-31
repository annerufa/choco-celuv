//distributionModel.js

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
        if (dist.status !== 'dikirim') throw new Error('Status harus dikirim untuk bisa diterima');
        if (!dist.arrived_at) throw new Error('Kurir belum konfirmasi sudah sampai');  // ✅ validasi arrived_at

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
             SET status = 'diterima',
                 confirmed_by_booth = ?,
                 confirmed_at_booth = NOW()
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
            d.arrived_at,                   -- ✅ tambah ini
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

const getByBooth = async (location_id) => {
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
WHERE d.to_location_id = ?        -- dari token user: location_id
  AND d.status IN ('sampai', 'diterima', 'kurang')
ORDER BY 
    FIELD(d.status, 'sampai', 'kurang', 'diterima'),
    d.arrived_at DESC
    `;
    const params = [location_id];

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
const updateItem = async (distribution_id, item_id, qty_diterima, notes) => {
    await db.query(
        `UPDATE distribution_items
         SET qty_diterima = ?,
             notes        = ?
         WHERE distribution_id = ?
           AND item_id         = ?`,
        [qty_diterima, notes, distribution_id, item_id]
    );

    const [rows] = await db.query(
        `SELECT 
            di.*,
            i.name AS item_name,
            i.unit
         FROM distribution_items di
         JOIN items i ON i.id = di.item_id
         WHERE di.distribution_id = ?
           AND di.item_id         = ?`,
        [distribution_id, item_id]
    );
    return rows[0];
};
// Pickup: ubah status → dikirim + catat kurir + kurangi stok gudang
const pickup = async (distribution_id, user_id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Cek distribusi valid & masih draft
        const [[dist]] = await conn.execute(
            `SELECT * FROM distributions WHERE id = ? AND status = 'draft'`,
            [distribution_id]
        );
        if (!dist) throw new Error('Distribusi tidak ditemukan');

        // 2. Validasi akses — kurir internal harus match, external/pemilik bebas
        if (dist.kurir_id !== null && dist.kurir_id !== user_id) {
            throw new Error('Distribusi ini bukan milik kamu');
        }

        // 3. Kurangi stok gudang (sama untuk semua)
        const [items] = await conn.execute(
            `SELECT * FROM distribution_items WHERE distribution_id = ?`,
            [distribution_id]
        );
        for (const item of items) {
            await conn.execute(
                `UPDATE stock_per_location 
                 SET current_stock = GREATEST(0, current_stock - ?)
                 WHERE item_id = ? AND location_id = ?`,
                [item.qty, item.item_id, dist.from_location_id]
            );
            await conn.execute(
                `INSERT INTO stock_movements 
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'OUT', 'DISTRIBUSI', ?)`,
                [item.item_id, dist.from_location_id, item.qty, distribution_id]
            );
        }

        // 4. Update status — sama untuk semua
        await conn.execute(
            `UPDATE distributions 
             SET status = 'dikirim',
                 confirmed_by_kurir = ?,
                 confirmed_at_kurir = NOW()
             WHERE id = ?`,
            [user_id, distribution_id]
        );

        await conn.commit();
        // Return data terbaru dengan nama — pakai db biasa (bukan conn)
        const data = await getById(distribution_id);
        return data;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// Tambahkan ke distributionModel.js

const getDisToday = async (kurir_id) => {
    // const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const today = new Date().toLocaleDateString('en-CA');
    console.log('today dist date:', today);
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
const doneDistributions = async (kurir_id) => {
    let sql = `
        SELECT 
            d.*,
            d.arrived_at,                   -- ✅ tambah ini
            fl.name AS from_location_name,
            tl.name AS to_location_name,
            u.name  AS kurir_name
        FROM distributions d
        LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
        LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
        LEFT JOIN users u ON u.id = d.kurir_id
        WHERE d.kurir_id = ? 
        AND d.status NOT IN ('draft', 'dikirim')
        ORDER BY d.planned_date ASC, d.id DESC
    `;
    const params = [kurir_id];

    const [rows] = await db.query(sql, params);
    return rows;
};

const getById = async (id) => {
    const [[dist]] = await db.query(`
        SELECT 
            d.*,
            u_kurir.name   AS confirmed_by_kurir_name,
            u_booth.name   AS confirmed_by_booth_name,
            u_created.name AS created_by_name,
            fl.name        AS from_location_name,
            tl.name        AS to_location_name
        FROM distributions d
        LEFT JOIN users u_kurir   ON u_kurir.id  = d.confirmed_by_kurir
        LEFT JOIN users u_booth   ON u_booth.id  = d.confirmed_by_booth
        LEFT JOIN users u_created ON u_created.id = d.created_by
        LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
        LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
        WHERE d.id = ?
    `, [id]);

    if (!dist) return null;

    // ← tambah ini
    const [items] = await db.query(`
        SELECT 
            di.*,
            i.name AS item_name,
            i.unit
        FROM distribution_items di
        JOIN items i ON i.id = di.item_id
        WHERE di.distribution_id = ?
    `, [id]);

    return { ...dist, items };
};

const arrive = async (distribution_id, user_id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // 1. Cek distribusi valid & masih draft
        const [[dist]] = await conn.execute(
            `SELECT * FROM distributions WHERE id = ? AND status = 'dikirim'`,
            [distribution_id]
        );
        if (!dist) throw new Error('Distribusi tidak ditemukan');

        // 2. Validasi akses — kurir internal harus match, external/pemilik bebas
        if (dist.kurir_id !== null && dist.kurir_id !== user_id) {
            throw new Error('Distribusi ini bukan milik kamu');
        }
        // ✅ Simpan waktu tiba di kolom arrived_at
        await conn.execute(
            `UPDATE distributions SET status='sampai', arrived_at = NOW() WHERE id = ?`,
            [distribution_id]
        );

        await conn.commit();
        // Return data terbaru dengan nama — pakai db biasa (bukan conn)
        const data = await getById(distribution_id);
        return data;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const updateStatus = async (distribution_id, status, user_id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update status distribusi — guard AND status = 'sampai'
        const [result] = await conn.query(
            `UPDATE distributions
             SET status             = ?,
                 confirmed_by_booth = ?,
                 confirmed_at_booth = NOW()
             WHERE id     = ?
               AND status = 'sampai'`,
            [status, user_id, distribution_id]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return null;
        }

        // 2. Ambil to_location_id gudang asal dan gudang tujuan + items yang diterima
        const [[dist]] = await conn.query(
            `SELECT to_location_id, from_location_id FROM distributions WHERE id = ?`,
            [distribution_id]
        );

        const [items] = await conn.query(
            `SELECT item_id,
                    COALESCE(qty_diterima, qty) AS qty_masuk
             FROM distribution_items
             WHERE distribution_id = ?`,
            [distribution_id]
        );

        // 3. Update stock_per_location + insert stock_movements per item
        for (const item of items) {
            const { item_id, qty_masuk } = item;

            // Kurangi stok dari lokasi asal (from_location_id)
            await conn.query(
                `UPDATE stock_per_location
         SET current_stock = current_stock - ?
         WHERE item_id     = ?
           AND location_id = ?`,
                [qty_masuk, item_id, dist.from_location_id]
            );

            // Catat movement OUT dari lokasi asal
            await conn.query(
                `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
         VALUES (?, ?, ?, 'OUT', 'DISTRIBUSI', ?)`,
                [item_id, dist.from_location_id, qty_masuk, distribution_id]
            );

            // Tambah stok di lokasi tujuan (to_location_id)
            await conn.query(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE current_stock = current_stock + VALUES(current_stock)`,
                [item_id, dist.to_location_id, qty_masuk]
            );

            // Catat movement IN di lokasi tujuan
            await conn.query(
                `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
         VALUES (?, ?, ?, 'IN', 'DISTRIBUSI', ?)`,
                [item_id, dist.to_location_id, qty_masuk, distribution_id]
            );
        }

        await conn.commit();

        // 4. Return data distribusi lengkap
        const [[updated]] = await conn.query(
            `SELECT d.*,
                    fl.name AS from_location_name,
                    tl.name AS to_location_name,
                    u.name  AS kurir_name
             FROM distributions d
             LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
             LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
             LEFT JOIN users u ON u.id = d.kurir_id
             WHERE d.id = ?`,
            [distribution_id]
        );
        return updated;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
const getRekap = async (kurir_id, from, to) => {
    const [rows] = await db.query(
        `SELECT
            d.id,
            d.status,
            d.planned_date,
            d.arrived_at,
            d.confirmed_at_booth,
            d.to_location_id,
            d.from_location_id,
            tl.name AS to_location_name,
            fl.name AS from_location_name
         FROM distributions d
         LEFT JOIN stock_locations tl ON tl.id = d.to_location_id
         LEFT JOIN stock_locations fl ON fl.id = d.from_location_id
         WHERE d.kurir_id = ?
           AND d.status   IN ('sesuai', 'kurang')
           AND DATE(COALESCE(d.arrived_at, d.planned_date)) BETWEEN ? AND ?
         ORDER BY COALESCE(d.arrived_at, d.planned_date) DESC`,
        [kurir_id, from, to]
    );
    return rows;
};
module.exports = { getAll, create, updateStatus, getRekap, getById, updateItem, confirmBooth, arrive, cancel, getByKurir, getByBooth, doneDistributions, getItems, pickup, getDisToday };