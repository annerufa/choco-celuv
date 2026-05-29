// models/batchModel.js

const db = require('../connection');

// GET /batches/utilization?from=&to=&booth_id=
const getUtilization = async ({ from, to, booth_id }) => {
    const conditions = [
        'b.produced_at >= ?',
        'b.produced_at < DATE_ADD(?, INTERVAL 1 DAY)',
        "b.recipe_id IS NOT NULL", // hanya batch dari resep adonan
    ];
    const params = [from, to];

    if (booth_id) {
        conditions.push('b.booth_id = ?');
        params.push(booth_id);
    }

    const where = conditions.join(' AND ');

    const [rows] = await db.query(`
        SELECT
            b.booth_id,
            bt.name                                         AS booth_name,

            -- Jumlah batch
            COUNT(b.id)                                     AS total_batch,

            -- Total diproduksi (pakai total_qty yang sudah ada di batches)
            SUM(b.total_qty)                                AS total_produksi,

            -- Terjual = total_qty - remaining_qty pada batch yang sudah selesai
            -- Untuk batch ACTIVE, terjual = total_qty - remaining_qty sejauh ini
            SUM(b.total_qty - b.remaining_qty)              AS total_terjual,

            -- Waste = remaining_qty dari batch yang EXPIRED atau DAMAGED
            SUM(CASE
                WHEN b.status IN ('EXPIRED', 'DAMAGED') THEN b.remaining_qty
                ELSE 0
            END)                                            AS total_waste,

            -- Breakdown waste
            SUM(CASE WHEN b.status = 'EXPIRED'  THEN b.remaining_qty ELSE 0 END) AS total_expired,
            SUM(CASE WHEN b.status = 'DAMAGED'  THEN b.remaining_qty ELSE 0 END) AS total_damaged
        FROM batches b
        JOIN booth bt ON bt.id = b.booth_id
        WHERE ${where}
        GROUP BY b.booth_id, bt.name
        ORDER BY bt.name ASC
    `, params);

    return rows;
};
// Freeze batch (ACTIVE → FROZEN, pause expired_at)
const freezeBatch = async (id) => {
    const [[batch]] = await db.query(`SELECT * FROM batches WHERE id = ?`, [id]);
    if (!batch) throw new Error('Batch tidak ditemukan');
    if (batch.status !== 'ACTIVE') throw new Error('Hanya batch ACTIVE yang bisa difreeze');

    // Hitung sisa waktu sebelum expired (dalam detik), simpan ke notes sementara
    // Lebih baik simpan di kolom tersendiri, tapi pakai notes dulu
    const remaining_seconds = batch.expired_at
        ? Math.max(0, (new Date(batch.expired_at) - Date.now()) / 1000)
        : null;

    await db.query(`
        UPDATE batches 
        SET status = 'FROZEN',
            expired_at = NULL,
            notes = ?
        WHERE id = ?
    `, [remaining_seconds !== null ? `frozen:${Math.round(remaining_seconds)}` : null, id]);

    return db.query(`SELECT * FROM batches WHERE id = ?`, [id]).then(([r]) => r[0]);
};

// Thaw batch (FROZEN → ACTIVE, expired_at = NOW() + 1 jam)
const thawBatch = async (id) => {
    const [[batch]] = await db.query(`SELECT * FROM batches WHERE id = ?`, [id]);
    if (!batch) throw new Error('Batch tidak ditemukan');
    if (batch.status !== 'FROZEN') throw new Error('Hanya batch FROZEN yang bisa di-thaw');

    await db.query(`
        UPDATE batches
        SET status = 'ACTIVE',
            expired_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
            notes = NULL
        WHERE id = ?
    `, [id]);

    const [[updated]] = await db.query(`SELECT * FROM batches WHERE id = ?`, [id]);
    return updated;
};

// Tandai rusak
const damageBatch = async (id, notes) => {
    const [[batch]] = await db.query(`SELECT * FROM batches WHERE id = ?`, [id]);
    if (!batch) throw new Error('Batch tidak ditemukan');
    if (!['ACTIVE', 'FROZEN'].includes(batch.status)) throw new Error('Batch tidak bisa ditandai rusak');

    await db.query(`
        UPDATE batches SET status = 'DAMAGED', notes = ? WHERE id = ?
    `, [notes ?? null, id]);

    const [[updated]] = await db.query(`SELECT * FROM batches WHERE id = ?`, [id]);
    return updated;
};
const getBatchDetail = async (batchId) => {
    const [[batch]] = await db.query(`
        SELECT 
            b.*,
            r.name AS recipe_name, r.output_unit,
            p.created_by, u.name AS created_by_name,
            bt.name AS booth_name
        FROM batches b
        LEFT JOIN productions p ON p.id = b.production_id
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN recipes r ON r.id = b.recipe_id
        LEFT JOIN booth bt ON bt.id = b.booth_id
        WHERE b.id = ?
    `, [batchId]);
    if (!batch) return null;

    // Ambil sales dulu
    const [sales] = await db.query(`
        SELECT
            s.id AS sale_id,
            s.created_at,
            s.payment_method,
            s.grand_total,
            u.name AS kasir
        FROM sales s
        JOIN users u ON u.id = s.created_by
        WHERE s.batch_id = ?
        ORDER BY s.created_at DESC
    `, [batchId]);

    // Ambil items per sale sekaligus
    const saleIds = sales.map(s => s.sale_id);
    let saleItems = [];
    if (saleIds.length > 0) {
        [saleItems] = await db.query(`
            SELECT
                si.sale_id,
                p.name AS product,
                p.size,
                p.adonan_ml,
                si.qty,
                si.total_price
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            WHERE si.sale_id IN (?)
        `, [saleIds]);
    }

    // Gabungkan items ke masing-masing sale + hitung adonan terpakai
    const riwayat = sales.map(s => {
        const items = saleItems.filter(i => i.sale_id === s.sale_id);
        const adonan_terpakai = items.reduce((acc, i) => acc + Number(i.adonan_ml) * Number(i.qty), 0);
        return { ...s, items, adonan_terpakai };
    });

    const total_terjual = batch.total_qty - batch.remaining_qty;
    const total_transaksi = sales.length;
    const total_pendapatan = sales.reduce((acc, s) => acc + Number(s.grand_total), 0);

    return {
        ...batch,
        summary: { total_terjual, total_transaksi, total_pendapatan },
        riwayat,
    };
};

module.exports = { getUtilization, freezeBatch, thawBatch, damageBatch, getBatchDetail };