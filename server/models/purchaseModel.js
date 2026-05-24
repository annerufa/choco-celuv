const db = require('../connection');

// ─────────────────────────────────────────────
// Helper: ambil konversi satuan beli → satuan dasar
// Kalau tidak ada konversi, anggap 1:1
// ─────────────────────────────────────────────
const getMultiplier = async (conn, item_id, buy_unit) => {
    if (!buy_unit) return 1;

    const [conv] = await conn.execute(
        `SELECT base_qty FROM unit_conversions
         WHERE item_id = ? AND buy_unit = ?
         LIMIT 1`,
        [item_id, buy_unit]
    );

    return conv.length ? Number(conv[0].base_qty) : 1;
};

// ─────────────────────────────────────────────
// CREATE PURCHASE
// ─────────────────────────────────────────────
const create = async (data) => {
    const { supplier, loc_id, created_by, type, date, items } = data;
    console.log(supplier, loc_id, created_by, type, date, items);

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Hitung total harga pembelian (berdasarkan harga & qty satuan beli)
        const total = items.reduce((sum, i) => sum + i.buy_qty * i.unit_price, 0);

        // 2. Insert header purchases
        const [purchaseResult] = await conn.execute(
            `INSERT INTO purchases (supplier, loc_id, created_by, type, date, total, status)
             VALUES (?, ?, ?, ?, ?, ?, 'dikonfirmasi')`,
            [supplier, loc_id, created_by, type, date, total]
        );

        const purchase_id = purchaseResult.insertId;

        // 3. Proses tiap item
        for (const item of items) {
            const { item_id, buy_qty, unit_price, buy_unit = null } = item;
            const total_price = buy_qty * unit_price;

            // ── Hitung qty & validasi ─────────────────────────────
            const multiplier = await getMultiplier(conn, item.item_id, item.buy_unit);
            const stock_qty = item.buy_qty * multiplier;
            const cost_base = item.unit_price / multiplier; // pindah ke sini, pakai multiplier yang sama

            // ── Ambil stok & avg_cost SEBELUM diupdate ───────────────
            const [[currentItem]] = await conn.execute(
                `SELECT avg_price FROM items WHERE id = ?`,
                [item_id]
            );

            const [[currentStock]] = await conn.execute(
                `SELECT current_stock FROM stock_per_location
                 WHERE item_id = ? AND location_id = ?`,
                [item_id, loc_id]
            );

            if (!currentStock) {
                throw new Error(
                    `Item id ${item_id} belum di-setup untuk lokasi ini. Hubungi pemilik.`
                );
            }

            const old_qty = Number(currentStock.current_stock) || 0;
            const old_avg = Number(currentItem?.avg_price) || 0;

            // ── Weighted Average Cost ─────────────────────────────────
            const weighted_avg = (old_qty + stock_qty) > 0
                ? ((old_avg * old_qty) + (cost_base * stock_qty)) / (old_qty + stock_qty)
                : cost_base;

            // ── Insert purchase_items ─────────────────────────────────
            await conn.execute(
                `INSERT INTO purchase_items
                    (purchase_id, item_id, buy_qty, buy_unit, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [purchase_id, item_id, buy_qty, buy_unit, unit_price, total_price]
            );

            // ── Update stok ───────────────────────────────────────────
            const [updateResult] = await conn.execute(
                `UPDATE stock_per_location
                 SET current_stock = current_stock + ?
                 WHERE item_id = ? AND location_id = ?`,
                [stock_qty, item_id, loc_id]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(
                    `Item id ${item_id} belum di-setup untuk lokasi ini. Hubungi pemilik.`
                );
            }

            // ── Insert stock_movements ────────────────────────────────
            await conn.execute(
                `INSERT INTO stock_movements
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'IN', 'PEMBELIAN', ?)`,
                [item_id, loc_id, stock_qty, purchase_id]
            );

            // ── Update last_cost & avg_cost di items ──────────────────
            await conn.execute(
                `UPDATE items SET
                    last_price  = ?,
                    avg_price   = ?,
                    updated_at = NOW()
                 WHERE id = ?`,
                [cost_base, weighted_avg, item_id]
            );
        }

        await conn.commit();
        return { purchase_id, total };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─────────────────────────────────────────────
// CANCEL PURCHASE
// Kembalikan stok, catat movement OUT, update status
// ─────────────────────────────────────────────
const cancel = async (id, cancelled_by) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Cek purchase ada & statusnya
        const [[purchase]] = await conn.execute(
            `SELECT * FROM purchases WHERE id = ?`,
            [id]
        );

        if (!purchase) throw new Error('Purchase tidak ditemukan');
        if (purchase.status === 'dibatalkan') throw new Error('Purchase sudah dibatalkan');

        // 2. Ambil semua items di purchase ini
        const [items] = await conn.execute(
            `SELECT pi.*, i.name AS item_name FROM purchase_items pi JOIN items i on pi.item_id = i.id WHERE purchase_id = ?`,
            [id]
        );

        // 3. Proses tiap item — kembalikan stok
        for (const item of items) {
            const multiplier = await getMultiplier(conn, item.item_id, item.buy_unit);
            const stock_qty = item.buy_qty * multiplier;

            // Cek stok cukup untuk dikembalikan (tidak sampai minus)
            const [[currentStock]] = await conn.execute(
                `SELECT current_stock FROM stock_per_location
                 WHERE item_id = ? AND location_id = ?`,
                [item.item_id, purchase.loc_id]
            );

            if (!currentStock) {
                throw new Error(`Stok item id ${item.item_name} tidak ditemukan`);
            }

            if (Number(currentStock.current_stock) < stock_qty) {
                throw new Error(
                    `Stok item id ${item.item_name} tidak mencukupi untuk dibatalkan. ` +
                    `Stok saat ini: ${currentStock.current_stock}, perlu dikembalikan: ${stock_qty}`
                );
            }

            // Kurangi stok
            await conn.execute(
                `UPDATE stock_per_location
                 SET current_stock = current_stock - ?
                 WHERE item_id = ? AND location_id = ?`,
                [stock_qty, item.item_id, purchase.loc_id]
            );

            // Setelah kurangi stok, recalculate avg_cost
            const [[currentItem]] = await conn.execute(
                `SELECT avg_price, last_price FROM items WHERE id = ?`,
                [item.item_id]
            );

            const [[newStock]] = await conn.execute(
                `SELECT current_stock FROM stock_per_location
     WHERE item_id = ? AND location_id = ?`,
                [item.item_id, purchase.loc_id]
            );

            const cost_base = item.unit_price / multiplier; // multiplier sudah ada dari atas
            const sisa_qty = Number(newStock.current_stock); // sudah dikurangi
            const old_avg = Number(currentItem.avg_cost);

            // Reverse weighted average:
            // avg_lama = (sisa × avg_baru + qty_cancel × harga_cancel) / (sisa + qty_cancel)
            // → avg_baru = (avg_lama × total_sebelum - qty_cancel × harga_cancel) / sisa
            const total_sebelum = sisa_qty + stock_qty;
            const new_avg = sisa_qty > 0
                ? ((old_avg * total_sebelum) - (cost_base * stock_qty)) / sisa_qty
                : 0;

            // Update last_cost dari pembelian aktif terakhir
            const [[lastPurchase]] = await conn.execute(
                `SELECT pi.unit_price, pi.buy_unit 
     FROM purchase_items pi
     JOIN purchases p ON pi.purchase_id = p.id
     WHERE pi.item_id = ? AND p.status = 'dikonfirmasi' AND p.id != ?
     ORDER BY p.date DESC LIMIT 1`,
                [item.item_id, id]
            );

            const new_last_cost = lastPurchase
                ? lastPurchase.unit_price / (await getMultiplier(conn, item.item_id, lastPurchase.buy_unit))
                : 0;

            await conn.execute(
                `UPDATE items SET avg_price = ?, last_price = ? WHERE id = ?`,
                [Math.max(0, new_avg), new_last_cost, item.item_id]
            );

            // Catat movement OUT
            await conn.execute(
                `INSERT INTO stock_movements
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'OUT', 'KOREKSI', ?)`,
                [item.item_id, purchase.loc_id, stock_qty, id]
            );
        }

        // 4. Update status purchase → cancelled
        await conn.execute(
            `UPDATE purchases
             SET status = 'dibatalkan', cancelled_by = ?, cancelled_at = NOW()
             WHERE id = ?`,
            [cancelled_by, id]
        );

        await conn.commit();

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─────────────────────────────────────────────
// GET ALL PURCHASES
// Query params: loc_id, type, status, start_date, end_date, limit, offset
// ─────────────────────────────────────────────
const getAll = async ({ location_id, type, status, start_date, end_date, limit = 50, offset = 0 } = {}) => {
    const where = [];
    const params = [];

    if (location_id) { where.push('p.loc_id = ?'); params.push(location_id); }
    if (type) { where.push('p.type = ?'); params.push(type); }
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (start_date) { where.push('p.date >= ?'); params.push(start_date); }
    if (end_date) { where.push('p.date <= ?'); params.push(end_date); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
        `SELECT
            p.*,
            sl.name AS location_name,
            u.name  AS created_by_name
         FROM purchases p
         LEFT JOIN stock_locations sl ON p.loc_id = sl.id
         LEFT JOIN users u            ON p.created_by = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
    );

    const [[{ total_count }]] = await db.query(
        `SELECT COUNT(*) AS total_count FROM purchases p ${whereClause}`,
        params
    );

    return { data: rows, total_count };
};

// ─────────────────────────────────────────────
// GET PURCHASE BY ID (dengan detail items)
// ─────────────────────────────────────────────
const getById = async (id) => {
    const [[purchase]] = await db.query(
        `SELECT
            p.*,
            sl.name AS location_name,
            u.name  AS created_by_name,
            u2.name AS cancelled_by_name
         FROM purchases p
         LEFT JOIN stock_locations sl ON p.loc_id = sl.id
         LEFT JOIN users u            ON p.created_by = u.id
         LEFT JOIN users u2 ON p.cancelled_by = u2.id
         WHERE p.id = ?`,
        [id]
    );

    if (!purchase) return null;

    const [items] = await db.query(
        `SELECT
            pi.*,
            i.name AS item_name,
            i.unit AS base_unit
         FROM purchase_items pi
         LEFT JOIN items i ON pi.item_id = i.id
         WHERE pi.purchase_id = ?`,
        [id]
    );

    return { ...purchase, items };
};



module.exports = { create, cancel, getAll, getById };