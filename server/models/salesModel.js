// models/salesModel.js
const db = require('../connection');
const { insertMovement } = require('../helpers/stockHelper');

// ── GET /sales/products ──────────────────────────────────────
const getProducts = async () => {
    const [rows] = await db.query(`
        SELECT 
            p.id,
            p.name,
            p.size,
            p.price,
            p.adonan_ml,
            r.name AS recipe_name
        FROM products p
        JOIN recipes r ON r.id = p.recipe_id
        WHERE p.is_active = 1
        ORDER BY p.name ASC, p.size ASC
    `);
    return rows;
};

// ── POST /sales ──────────────────────────────────────────────
const createSale = async (userId, payment_method, items) => {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
        // 1. Cari location_id & booth_id penjaga
        const [[locRow]] = await conn.query(`
            SELECT sl.id AS location_id, sl.booth_id
            FROM employee_schedules es
            JOIN stock_locations sl 
              ON sl.booth_id = es.booth_id AND sl.type = 'booth'
            WHERE es.employee_id = ? AND es.is_active = 1
            LIMIT 1
        `, [userId]);
        if (!locRow) throw new Error('Booth penjaga tidak ditemukan');

        const { location_id, booth_id } = locRow;

        // 2. Cari batch terlama yang masih ACTIVE & belum expired (FIFO)
        const [[batch]] = await conn.query(`
            SELECT id, remaining_qty
            FROM batches
            WHERE booth_id = ?
              AND status = 'ACTIVE'
              AND (expired_at IS NULL OR expired_at > NOW())
            ORDER BY produced_at ASC
            LIMIT 1
        `, [booth_id]);
        if (!batch) throw new Error('Tidak ada adonan aktif di booth ini');

        // 3. Ambil harga + adonan_ml per produk
        const productIds = items.map(i => i.product_id);
        const [products] = await conn.query(
            `SELECT id, price, adonan_ml FROM products WHERE id IN (?)`,
            [productIds]
        );
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = { price: Number(p.price), adonan_ml: Number(p.adonan_ml) };
        });

        // 4. Hitung grand total
        const grand_total = items.reduce((sum, it) => {
            return sum + (productMap[it.product_id]?.price ?? 0) * it.qty;
        }, 0);

        // 5. Hitung total ml yang dipakai — validasi batch mencukupi
        const totalMlUsed = items.reduce((sum, it) => {
            return sum + (productMap[it.product_id]?.adonan_ml ?? 0) * it.qty;
        }, 0);
        if (batch.remaining_qty < totalMlUsed) {
            throw new Error(`Adonan tidak cukup. Tersisa ${batch.remaining_qty} ml, dibutuhkan ${totalMlUsed} ml`);
        }

        // 6. Insert sales
        const [saleResult] = await conn.query(`
            INSERT INTO sales (booth_id, batch_id, created_by, payment_method, grand_total)
            VALUES (?, ?, ?, ?, ?)
        `, [booth_id, batch.id, userId, payment_method, grand_total]);

        const sale_id = saleResult.insertId;

        // 7. Insert sale_items + kurangi stok bahan per item
        for (const it of items) {
            const unit_price = productMap[it.product_id]?.price ?? 0;
            const total_price = unit_price * it.qty;

            await conn.query(`
                INSERT INTO sale_items (sale_id, product_id, qty, is_less_ice, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [sale_id, it.product_id, it.qty, it.is_less_ice ? 1 : 0, unit_price, total_price]);

            // Kurangi stok bahan via product_components
            const applies = it.is_less_ice ? ['all', 'less_ice'] : ['all', 'regular'];
            const [components] = await conn.query(`
                SELECT item_id, qty
                FROM product_components
                WHERE product_id = ? AND applies_to IN (?)
            `, [it.product_id, applies]);

            for (const comp of components) {
                const totalQty = Number(comp.qty) * it.qty;

                await insertMovement(conn, {
                    item_id: comp.item_id,
                    location_id,
                    qty: totalQty,
                    movement_type: 'OUT',
                    source_type: 'PENJUALAN',
                    source_id: sale_id,
                });
            }
        }

        // 8. Kurangi remaining_qty batch dalam ml
        await conn.query(`
            UPDATE batches
            SET remaining_qty = GREATEST(0, remaining_qty - ?)
            WHERE id = ?
        `, [totalMlUsed, batch.id]);

        // Auto SOLD_OUT kalau remaining habis
        await conn.query(`
            UPDATE batches SET status = 'SOLD_OUT'
            WHERE id = ? AND remaining_qty = 0
        `, [batch.id]);

        await conn.commit();
        return { id: sale_id, grand_total };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ── GET /sales/rekap ─────────────────────────────────────────
const getRekap = async ({ from, to, booth_id, method }) => {
    const conditions = [
        's.created_at >= ?',
        's.created_at < DATE_ADD(?, INTERVAL 1 DAY)',
    ];
    const params = [from, to];

    if (booth_id) { conditions.push('s.booth_id = ?'); params.push(booth_id); }
    if (method) { conditions.push('s.payment_method = ?'); params.push(method); }

    const where = conditions.join(' AND ');

    const [sales] = await db.query(`
        SELECT
            s.id,
            s.created_at,
            s.payment_method,
            s.grand_total,
            b.name               AS booth_name,
            u.name               AS kasir_name,
            COUNT(si.product_id) AS total_item
        FROM sales s
        JOIN booth b            ON b.id = s.booth_id
        JOIN users u            ON u.id = s.created_by
        LEFT JOIN sale_items si ON si.sale_id = s.id
        WHERE ${where}
        GROUP BY s.id
        ORDER BY s.created_at DESC
    `, params);

    if (sales.length === 0) return [];

    const saleIds = sales.map(s => s.id);
    const [items] = await db.query(`
        SELECT
            si.sale_id,
            si.qty,
            si.is_less_ice,
            si.unit_price,
            si.total_price,
            p.name AS product_name,
            p.size
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        WHERE si.sale_id IN (?)
        ORDER BY si.sale_id, p.name
    `, [saleIds]);

    const itemMap = {};
    items.forEach(it => {
        if (!itemMap[it.sale_id]) itemMap[it.sale_id] = [];
        itemMap[it.sale_id].push(it);
    });

    return sales.map(s => ({ ...s, items: itemMap[s.id] ?? [] }));
};
const getSummary = async (id) => {
    const [rows] = await db.query(`
            SELECT 
        COUNT(s.id) AS total_transaksi,
        SUM(s.grand_total) AS total_penjualan,
        AVG(s.grand_total) AS avg_order,
        SUM(CASE WHEN s.payment_method = 'tunai' THEN 1 ELSE 0 END) AS tunai,
        SUM(CASE WHEN s.payment_method = 'qris' THEN 1 ELSE 0 END) AS qris
    FROM sales s
    WHERE s.booth_id = ? 
    AND DATE(s.created_at) = CURDATE()
    `, [id]);
    return rows;
};

// salesModel.js
const getRekapPenjualan = async (userId, startDate, endDate) => {
    const [[summary]] = await db.query(`
        SELECT 
            COUNT(s.id) AS total_transaksi,
            COALESCE(SUM(s.grand_total), 0) AS total_penjualan,
            SUM(CASE WHEN s.payment_method = 'tunai' THEN 1 ELSE 0 END) AS tunai,
            SUM(CASE WHEN s.payment_method = 'qris' THEN 1 ELSE 0 END) AS qris
        FROM sales s
        WHERE s.created_by = ? AND DATE(s.created_at) BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    const [list] = await db.query(`
        SELECT 
            s.id, s.payment_method, s.grand_total, s.created_at,
            b.name AS booth_name,
            GROUP_CONCAT(p.name, ' (', si.qty, ')' SEPARATOR ', ') AS items_label
        FROM sales s
        JOIN booth b ON b.id = s.booth_id
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON p.id = si.product_id
        WHERE s.created_by = ? AND DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
    `, [userId, startDate, endDate]);

    return { summary, list };
};

// purchasesModel.js
const getRekapPembelian = async ({ startDate, endDate, locId, status }) => {
    console.log('getRekapPembelian called with:', { startDate, endDate, locId, status });
    const conditions = [
        `DATE(p.date) BETWEEN ? AND ?`,
    ];
    const params = [startDate, endDate];

    if (locId) {
        conditions.push(`p.loc_id = ?`);
        params.push(locId);
    }
    if (status) {
        conditions.push(`p.status = ?`);
        params.push(status);
    }

    const where = conditions.join(' AND ');

    const [[summary]] = await db.query(`
        SELECT 
            COUNT(p.id) AS total_pembelian,
            COALESCE(SUM(p.total), 0) AS total_nilai
        FROM purchases p
        WHERE ${where}
    `, params);

    const [list] = await db.query(`
    SELECT 
            p.id, p.supplier, p.date, p.total, p.status,
            u.name  AS user_name,
            sl.name AS booth_name    -- ← dari stock_locations, bukan booth
        FROM purchases p
        LEFT JOIN users u            ON u.id  = p.created_by
        LEFT JOIN stock_locations sl ON sl.id = p.loc_id   -- ← join ke loc_id
        WHERE ${where}
        ORDER BY p.date DESC
    `, params);

    if (list.length === 0) return { summary, list: [] };

    const purchaseIds = list.map(p => p.id);
    const placeholders = purchaseIds.map(() => '?').join(',');


    const [items] = await db.query(`
    SELECT 
            pi.purchase_id,
            i.name          AS item_name,
            pi.buy_qty      AS qty,        -- ← bukan pi.qty
            pi.buy_unit     AS unit,       -- ← bukan pi.unit
            pi.unit_price,
            pi.total_price
        FROM purchase_items pi
        LEFT JOIN items i ON i.id = pi.item_id
        WHERE pi.purchase_id IN (${placeholders})
        ORDER BY pi.purchase_id, pi.item_id
    `, purchaseIds);

    const itemsMap = {};
    items.forEach(it => {
        if (!itemsMap[it.purchase_id]) itemsMap[it.purchase_id] = [];
        itemsMap[it.purchase_id].push(it);
    });

    return {
        summary,
        list: list.map(p => ({ ...p, items: itemsMap[p.id] ?? [] })),
    };
};

// distributionsModel.js
const getRekapDistribusi = async (userId, startDate, endDate) => {
    const [[summary]] = await db.query(`
        SELECT COUNT(id) AS total_distribusi
        FROM distributions
        WHERE confirmed_by_booth = ? AND DATE(confirmed_at_booth) BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    const [list] = await db.query(`
        SELECT 
            d.id, d.status, d.planned_date, d.confirmed_at_booth,
            sl_from.name AS dari,
            sl_to.name AS ke
        FROM distributions d
        JOIN stock_locations sl_from ON sl_from.id = d.from_location_id
        JOIN stock_locations sl_to ON sl_to.id = d.to_location_id
        WHERE d.confirmed_by_booth = ? AND DATE(d.confirmed_at_booth) BETWEEN ? AND ?
        ORDER BY d.confirmed_at_booth DESC
    `, [userId, startDate, endDate]);

    return { summary, list };
};

// Tren harian (untuk line chart)
const getSalesTrend = async ({ from, to, booth_id }) => {
    const conditions = [
        `DATE(s.created_at) BETWEEN ? AND ?`
    ];
    const params = [from, to];

    if (booth_id) {
        conditions.push(`s.booth_id = ?`);
        params.push(booth_id);
    }

    const [rows] = await db.query(`
        SELECT
            DATE(s.created_at)       AS tanggal,
            COUNT(s.id)              AS total_transaksi,
            COALESCE(SUM(s.grand_total), 0) AS total_penjualan,
            COALESCE(SUM(si.qty), 0) AS total_cup
        FROM sales s
        LEFT JOIN sale_items si ON si.sale_id = s.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY DATE(s.created_at)
        ORDER BY tanggal ASC
    `, params);

    return rows;
};

// Agregat per booth (untuk bar chart)
const getSalesPerBooth = async ({ from, to }) => {
    const [rows] = await db.query(`
        SELECT
            b.id                     AS booth_id,
            b.name                   AS booth_name,
            COUNT(s.id)              AS total_transaksi,
            COALESCE(SUM(s.grand_total), 0) AS total_penjualan,
            COALESCE(SUM(si.qty), 0) AS total_cup
        FROM sales s
        JOIN booth b ON b.id = s.booth_id
        LEFT JOIN sale_items si ON si.sale_id = s.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY b.id, b.name
        ORDER BY total_penjualan DESC
    `, [from, to]);

    return rows;
};
module.exports = { getSalesTrend, getSalesPerBooth, getProducts, getSummary, createSale, getRekap, getRekapPenjualan, getRekapPembelian, getRekapDistribusi };