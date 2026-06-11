// models/productionModel.js
const db = require('../connection');
const { insertMovement } = require('../helpers/stockHelper');
/**
 * Catat produksi — satu transaksi DB:
 *  1. INSERT productions
 *  2. OUT stock bahan (recipe_items)
 *  3a. type='mix'    → IN stock output item + upsert stock_per_location
 *  3b. type='adonan' → INSERT batches
 */
// const create = async ({ recipe_id, qty, booth_id, created_by, loc_id }) => {
//     const conn = await db.getConnection();
//     try {
//         await conn.beginTransaction();

//         // 1. Ambil resep + bahan
//         const [[recipe]] = await conn.query(
//             `SELECT * FROM recipes WHERE id = ?`, [recipe_id]
//         );
//         if (!recipe) throw new Error('Resep tidak ditemukan');

//         const [bahanList] = await conn.query(
//             `SELECT * FROM recipe_items WHERE recipe_id = ?`, [recipe_id]
//         );

//         // 2. Insert productions
//         const [prodRes] = await conn.query(
//             `INSERT INTO productions (booth_id, recipe_id, created_by, qty, loc_id)
//              VALUES (?, ?, ?, ?, ?)`,
//             [booth_id ?? null, recipe_id, created_by, qty, loc_id]
//         );
//         const productionId = prodRes.insertId;

//         // 3. OUT stock untuk setiap bahan
//         for (const b of bahanList) {
//             const totalQty = parseFloat(b.qty) * qty;

//             await conn.query(
//                 `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
//                  VALUES (?, ?, ?, 'OUT', 'PRODUKSI', ?)`,
//                 [b.item_id, loc_id, totalQty, productionId]
//             );

//             await conn.query(
//                 `UPDATE stock_per_location
//                  SET current_stock = current_stock - ?
//                  WHERE item_id = ? AND location_id = ?`,
//                 [totalQty, b.item_id, loc_id]
//             );
//         }

//         // 4a. type='mix' → tambah stok output item
//         if (recipe.type === 'mix' && recipe.output_id) {
//             const totalOutput = parseFloat(recipe.output_qty) * qty;

//             await conn.query(
//                 `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
//                  VALUES (?, ?, ?, 'IN', 'PRODUKSI', ?)`,
//                 [recipe.output_id, loc_id, totalOutput, productionId]
//             );

//             // Upsert stock_per_location
//             await conn.query(
//                 `INSERT INTO stock_per_location (item_id, location_id, current_stock)
//                  VALUES (?, ?, ?)
//                  ON DUPLICATE KEY UPDATE current_stock = current_stock + VALUES(current_stock)`,
//                 [recipe.output_id, loc_id, totalOutput]
//             );
//         }

//         // 4b. type='adonan' → buat batch
//         if (recipe.type === 'adonan') {
//             const totalQty = parseFloat(recipe.output_qty) * qty;
//             const producedAt = new Date();
//             const expiredAt = recipe.expiry_hours
//                 ? new Date(producedAt.getTime() + recipe.expiry_hours * 3600000)
//                 : null;

//             await conn.query(
//                 `INSERT INTO batches
//                  (production_id, location_id, booth_id, recipe_id, produced_at, expired_at, total_qty, remaining_qty, status)
//                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
//                 [productionId, loc_id, booth_id ?? null, recipe_id, producedAt, expiredAt, totalQty, totalQty]
//             );
//         }

//         await conn.commit();
//         return { production_id: productionId };
//     } catch (err) {
//         await conn.rollback();
//         throw err;
//     } finally {
//         conn.release();
//     }
// };
// ═══════════════════════════════════════════════════════════════
// MODEL  —  models/productionModel.js
// ═══════════════════════════════════════════════════════════════

// ── GET semua produksi ───────────────────────────────────────
const getAll = async () => {
    const [rows] = await db.query(
        `SELECT
            p.*,
            r.name        AS recipe_name,
            r.type        AS recipe_type,
            r.output_qty,
            r.output_unit,
            u.name        AS created_by_name,
            u.id        AS created_by_id,
            sl.name       AS location_name,
            i.name        AS output_item_name
         FROM productions p
         JOIN recipes r       ON r.id = p.recipe_id
         JOIN users u         ON u.id = p.created_by
         JOIN stock_locations sl ON sl.id = p.loc_id
         LEFT JOIN items i    ON i.id = r.output_id
         ORDER BY p.created_at DESC`
    );
    return rows;
};
// ── GET rekap (filter booth + tanggal) ──────────────────────
const getRekap = async (from, to, booth_id) => {
    const [rows] = await db.query(
        `SELECT
            p.*,
            r.name        AS recipe_name,
            r.type        AS recipe_type,
            r.output_qty,
            r.output_unit,
            u.name        AS created_by_name,
            sl.name       AS location_name,
            i.name        AS output_item_name,
            b.status      AS batch_status
         FROM productions p
         JOIN recipes r          ON r.id = p.recipe_id
         JOIN users u            ON u.id = p.created_by
         JOIN stock_locations sl ON sl.id = p.loc_id
         LEFT JOIN items i       ON i.id = r.output_id
         LEFT JOIN batches b     ON b.production_id = p.id AND r.type = 'adonan'
         WHERE DATE(p.created_at) BETWEEN ? AND ?
           ${booth_id ? 'AND p.booth_id = ?' : ''}
         ORDER BY p.created_at DESC`,
        booth_id ? [from, to, booth_id] : [from, to]
    );
    return rows;
};

// ── GET resep aktif untuk dropdown ──────────────────────────
const getActiveRecipes = async () => {
    // 1. Fetch semua resep aktif
    const [recipes] = await db.query(
        `SELECT
            r.*,
            i.name AS output_item_name
         FROM recipes r
         LEFT JOIN items i ON i.id = r.output_id
         WHERE r.is_active = 1
         ORDER BY r.type, r.name`
    );

    if (recipes.length === 0) return [];

    // 2. Fetch semua ingredients untuk resep-resep di atas sekaligus
    const recipeIds = recipes.map(r => r.id);
    const [ingredients] = await db.query(
        `SELECT
            ri.recipe_id,
            ri.item_id,
            ri.qty,
            ri.unit,
            i.name AS item_name
         FROM recipe_items ri
         JOIN items i ON i.id = ri.item_id
         WHERE ri.recipe_id IN (?)`,
        [recipeIds]
    );

    // 3. Gabungkan di JS
    return recipes.map(r => ({
        ...r,
        ingredients: ingredients.filter(ing => ing.recipe_id === r.id),
    }));
};

// ── GET resep by id ──────────────────────────────────────────
const getRecipeById = async (recipe_id) => {
    const [[row]] = await db.query(
        `SELECT * FROM recipes WHERE id = ?`,
        [recipe_id]
    );
    return row ?? null;
};

// ── CEK stok bahan mencukupi ─────────────────────────────────
const checkStock = async (recipe_id, qty_batch, location_id) => {
    // Ambil semua bahan resep
    const [ingredients] = await db.query(
        `SELECT ri.item_id, ri.qty AS qty_per_batch, i.name AS item_name
         FROM recipe_items ri
         JOIN items i ON i.id = ri.item_id
         WHERE ri.recipe_id = ?`,
        [recipe_id]
    );

    const kurang = [];

    for (const ing of ingredients) {
        const needed = Number(ing.qty_per_batch) * qty_batch;

        const [[stock]] = await db.query(
            `SELECT COALESCE(current_stock, 0) AS current_stock
             FROM stock_per_location
             WHERE item_id = ? AND location_id = ?`,
            [ing.item_id, location_id]
        );

        const available = Number(stock?.current_stock ?? 0);
        if (available < needed) {
            kurang.push({
                item_id: ing.item_id,
                item_name: ing.item_name,
                needed,
                available,
                selisih: needed - available,
            });
        }
    }

    return { cukup: kurang.length === 0, kurang };
};

// ── CREATE produksi (transaction) ────────────────────────────
const create = async ({ recipe_id, qty, created_by, loc_id, booth_id }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Ambil resep lengkap
        const [[recipe]] = await conn.query(
            `SELECT * FROM recipes WHERE id = ?`, [recipe_id]
        );
        const [ingredients] = await conn.query(
            `SELECT * FROM recipe_items WHERE recipe_id = ?`, [recipe_id]
        );

        // 1. Insert ke productions
        const [result] = await conn.query(
            `INSERT INTO productions (recipe_id, qty, created_by, loc_id, booth_id)
             VALUES (?, ?, ?, ?, ?)`,
            [recipe_id, qty, created_by, loc_id, booth_id ?? null]
        );
        const production_id = result.insertId;

        // 2. Kurangi stok bahan di lokasi user
        for (const ing of ingredients) {
            const usedQty = Number(ing.qty) * qty;

            await insertMovement(conn, {
                item_id: ing.item_id,
                location_id: loc_id,
                qty: usedQty,
                movement_type: 'OUT',
                source_type: 'PRODUKSI',
                source_id: production_id,
            });
        }

        // 3. Kalau mix → tambah stok output item di gudang
        if (recipe.type === 'mix' && recipe.output_id) {
            const outputQty = Number(recipe.output_qty) * qty;

            await insertMovement(conn, {
                item_id: recipe.output_id,
                location_id: loc_id,
                qty: outputQty,
                movement_type: 'IN',
                source_type: 'PRODUKSI',
                source_id: production_id,
            });
        }

        // 4. Kalau adonan → insert ke batches
        if (recipe.type === 'adonan') {
            const now = new Date();
            console.log('Node now:', now.toISOString());
            console.log('expired:', recipe.expiry_hours);

            console.log('expiry_hours raw:', recipe.expiry_hours, typeof recipe.expiry_hours);

            // Pastikan parse ke Number, antisipasi string "6" atau 0
            const expiryHours = Number(recipe.expiry_hours);
            const expiredAt = expiryHours > 0
                ? new Date(now.getTime() + expiryHours * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")
                : null;

            console.log('expiredAt result:', expiredAt);
            // Tiap batch = 1 row di tabel batches
            for (let i = 0; i < qty; i++) {
                await conn.query(
                    `INSERT INTO batches
                        (production_id, location_id, booth_id, recipe_id,
                        produced_at, expired_at, total_qty, remaining_qty, status)
                    VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?, 'ACTIVE')`,
                    [
                        production_id, loc_id, booth_id, recipe_id,
                        expiryHours,        // ← interval jam langsung ke MySQL
                        recipe.output_qty,
                        recipe.output_qty,
                    ]
                );
            }
        }

        await conn.commit();

        // Return data produksi lengkap
        const [[created]] = await conn.query(
            `SELECT
                p.*,
                r.name        AS recipe_name,
                r.type        AS recipe_type,
                r.output_qty,
                r.output_unit,
                u.name        AS created_by_name,
                sl.name       AS location_name,
                i.name        AS output_item_name
             FROM productions p
             JOIN recipes r          ON r.id = p.recipe_id
             JOIN users u            ON u.id = p.created_by
             JOIN stock_locations sl ON sl.id = p.loc_id
             LEFT JOIN items i       ON i.id = r.output_id
             WHERE p.id = ?`,
            [production_id]
        );
        return created;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
// ── GET by id ────────────────────────────────────────────────
const getById = async (id) => {
    const [[row]] = await db.query(
        `SELECT
            p.*,
            r.type        AS recipe_type,
            r.output_id,
            r.output_qty,
            r.expiry_hours
         FROM productions p
         JOIN recipes r ON r.id = p.recipe_id
         WHERE p.id = ?`,
        [id]
    );
    return row ?? null;
};

// ── CEK ada batch aktif ──────────────────────────────────────
const hasActiveBatch = async (production_id) => {
    const [[row]] = await db.query(
        `SELECT COUNT(*) AS total
         FROM batches
         WHERE production_id = ?
           AND status = 'ACTIVE'`,
        [production_id]
    );
    return row.total > 0;
};

// ── UPDATE qty (rollback lama, apply baru) ───────────────────
const update = async (id, new_qty, diff) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Ambil data produksi + resep
        const [[prod]] = await conn.query(
            `SELECT p.*, r.type AS recipe_type, r.output_id, r.output_qty
             FROM productions p
             JOIN recipes r ON r.id = p.recipe_id
             WHERE p.id = ?`,
            [id]
        );
        const [ingredients] = await conn.query(
            `SELECT * FROM recipe_items WHERE recipe_id = ?`,
            [prod.recipe_id]
        );

        // Tiap bahan: sesuaikan stok sesuai selisih
        for (const ing of ingredients) {
            const diffQty = Number(ing.qty) * Math.abs(diff);

            if (diff > 0) { //OUT bahan:
                await insertMovement(conn, {
                    item_id: ing.item_id, location_id: prod.loc_id,
                    qty: diffQty, movement_type: 'OUT',
                    source_type: 'PRODUKSI', source_id: id,
                });
            } else { //IN bahan (rollback)
                await insertMovement(conn, {
                    item_id: ing.item_id, location_id: prod.loc_id,
                    qty: diffQty, movement_type: 'IN',
                    source_type: 'PRODUKSI', source_id: id,
                });
            }
        }

        // Kalau mix → sesuaikan stok output
        if (prod.recipe_type === 'mix' && prod.output_id) {
            const outputDiff = Number(prod.output_qty) * Math.abs(diff);
            if (diff > 0) {
                await insertMovement(conn, {
                    item_id: prod.output_id, location_id: prod.loc_id,
                    qty: outputDiff, movement_type: 'IN',
                    source_type: 'PRODUKSI', source_id: id,
                });
            } else {
                await insertMovement(conn, {
                    item_id: prod.output_id, location_id: prod.loc_id,
                    qty: outputDiff, movement_type: 'OUT',
                    source_type: 'PRODUKSI', source_id: id,
                });
            }
        }

        // Kalau adonan → tambah/hapus batches sesuai selisih
        if (prod.recipe_type === 'adonan') {
            if (diff > 0) {
                // Tambah batch baru
                const expiredAt = prod.expiry_hours
                    ? new Date(Date.now() + prod.expiry_hours * 60 * 60 * 1000)
                    : null;
                for (let i = 0; i < diff; i++) {
                    await conn.query(
                        `INSERT INTO batches
                            (production_id, location_id, booth_id, recipe_id,
                             produced_at, expired_at, total_qty, remaining_qty, status)
                         VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'ACTIVE')`,
                        [
                            id, prod.loc_id, prod.booth_id, prod.recipe_id,
                            expiredAt, prod.output_qty, prod.output_qty,
                        ]
                    );
                }
            } else {
                // Hapus batch ACTIVE terlama sejumlah |diff|
                // (ambil id dulu, lalu delete — aman untuk semua MySQL versi)
                const [toDelete] = await conn.query(
                    `SELECT id FROM batches
                     WHERE production_id = ? AND status = 'ACTIVE'
                     ORDER BY produced_at ASC
                     LIMIT ?`,
                    [id, Math.abs(diff)]
                );
                if (toDelete.length > 0) {
                    const ids = toDelete.map(r => r.id);
                    await conn.query(
                        `DELETE FROM batches WHERE id IN (?)`,
                        [ids]
                    );
                }
            }
        }

        // Update qty di productions
        await conn.query(
            `UPDATE productions SET qty = ? WHERE id = ?`,
            [new_qty, id]
        );

        await conn.commit();

        // Return data terbaru
        const [[updated]] = await conn.query(
            `SELECT
                p.*,
                r.name        AS recipe_name,
                r.type        AS recipe_type,
                r.output_qty,
                r.output_unit,
                u.name        AS created_by_name,
                sl.name       AS location_name,
                i.name        AS output_item_name
             FROM productions p
             JOIN recipes r          ON r.id = p.recipe_id
             JOIN users u            ON u.id = p.created_by
             JOIN stock_locations sl ON sl.id = p.loc_id
             LEFT JOIN items i       ON i.id = r.output_id
             WHERE p.id = ?`,
            [id]
        );
        return updated;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ── DELETE produksi (rollback semua stok) ────────────────────
const remove = async (id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [[prod]] = await conn.query(
            `SELECT p.*, r.type AS recipe_type, r.output_id, r.output_qty
             FROM productions p
             JOIN recipes r ON r.id = p.recipe_id
             WHERE p.id = ?`,
            [id]
        );
        const [ingredients] = await conn.query(
            `SELECT * FROM recipe_items WHERE recipe_id = ?`,
            [prod.recipe_id]
        );

        // Kembalikan semua stok bahan
        for (const ing of ingredients) {
            const usedQty = Number(ing.qty) * prod.qty;

            await insertMovement(conn, {
                item_id: ing.item_id, location_id: prod.loc_id,
                qty: usedQty, movement_type: 'IN',
                source_type: 'PRODUKSI', source_id: id,
            });
        }

        // Kalau mix → kurangi stok output
        if (prod.recipe_type === 'mix' && prod.output_id) {
            const outputQty = Number(prod.output_qty) * prod.qty;
            await insertMovement(conn, {
                item_id: prod.output_id, location_id: prod.loc_id,
                qty: outputQty, movement_type: 'OUT',
                source_type: 'PRODUKSI', source_id: id,
            });
        }

        // Hapus batches terkait
        await conn.query(`DELETE FROM batches WHERE production_id = ?`, [id]);

        // Hapus produksi
        await conn.query(`DELETE FROM productions WHERE id = ?`, [id]);

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
// GET produksi adonan suatu booth, beserta batch-batchnya
const getAdonanByBooth = async (booth_id, { from, to, batch_status }) => {
    // 1. Ambil produksi adonan di booth ini
    const conditions = [
        `p.booth_id = ?`,
        `r.type = 'adonan'`,
        `DATE(p.created_at) BETWEEN ? AND ?`,
    ];
    const params = [booth_id, from, to];

    const [productions] = await db.query(`
        SELECT
            p.id,
            p.qty,
            p.created_at,
            r.name        AS recipe_name,
            r.output_qty,
            r.output_unit,
            u.name        AS created_by_name
        FROM productions p
        JOIN recipes r ON r.id = p.recipe_id
        JOIN users u   ON u.id = p.created_by
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
    `, params);

    if (productions.length === 0) return [];

    // 2. Ambil semua batch dari produksi di atas sekaligus
    const productionIds = productions.map(p => p.id);

    const batchConditions = [`b.production_id IN (?)`];
    const batchParams = [productionIds];

    if (batch_status) {
        batchConditions.push(`b.status = ?`);
        batchParams.push(batch_status);
    }

    const [batches] = await db.query(`
        SELECT
            b.id,
            b.production_id,
            b.status,
            b.total_qty,
            b.remaining_qty,
            b.produced_at,
            b.expired_at,
            b.notes
        FROM batches b
        WHERE ${batchConditions.join(' AND ')}
        ORDER BY b.produced_at ASC
    `, batchParams);

    // 3. Gabungkan di JS
    return productions.map(p => ({
        ...p,
        batches: batches.filter(b => b.production_id === p.id),
    }));
};
const getAdonanForBooth = async (booth_id, { from, to, batch_status }) => {
    const [productions] = await db.query(`
        SELECT
            p.id, p.qty, p.created_at,
            r.name AS recipe_name,
            r.output_qty, r.output_unit,
            u.name AS created_by_name
        FROM productions p
        JOIN recipes r ON r.id = p.recipe_id
        JOIN users u   ON u.id = p.created_by
        WHERE p.booth_id = ?
          AND r.type = 'adonan'
          AND DATE(p.created_at) BETWEEN ? AND ?
        ORDER BY p.created_at DESC
    `, [booth_id, from, to]);

    if (productions.length === 0) return [];

    const productionIds = productions.map(p => p.id);
    const batchCond = batch_status ? `AND b.status = ?` : '';

    // ✅ Fix: flatten params dengan benar
    const batchParams = batch_status
        ? [...productionIds, batch_status]  // spread, bukan nested array
        : [...productionIds];

    const placeholders = productionIds.map(() => '?').join(',');

    const [batches] = await db.query(`
        SELECT b.id, b.production_id, b.status,
               b.total_qty, b.remaining_qty,
               b.produced_at, b.expired_at, b.frozen_at,  b.notes
        FROM batches b
        WHERE b.production_id IN (${placeholders}) ${batchCond}
        ORDER BY b.produced_at ASC
    `, batchParams);

    // ✅ Fix: filter out productions yang batchnya kosong setelah filter status
    return productions
        .map(p => ({
            ...p,
            batches: batches.filter(b => b.production_id === p.id),
        }))
        .filter(p => p.batches.length > 0); // ← buang produksi tanpa batch yang cocok
};

const getDetail = async (id) => {
    // 1. Data produksi + resep
    const [[prod]] = await db.query(
        `SELECT
            p.*,
            r.name           AS recipe_name,
            r.type           AS recipe_type,
            r.output_qty,
            r.output_unit,
            r.expiry_hours,
            u.name           AS created_by_name,
            sl.name          AS location_name,
            b2.name          AS booth_name,
            i.name           AS output_item_name
         FROM productions p
         JOIN recipes r          ON r.id  = p.recipe_id
         JOIN users u            ON u.id  = p.created_by
         JOIN stock_locations sl ON sl.id = p.loc_id
         LEFT JOIN booth b2      ON b2.id = p.booth_id
         LEFT JOIN items i       ON i.id  = r.output_id
         WHERE p.id = ?`,
        [id]
    );
    if (!prod) return null;

    // 2. Batch list (hanya untuk tipe adonan)
    let batches = [];
    if (prod.recipe_type === 'adonan') {
        const [batchRows] = await db.query(
            `SELECT
                b.id,
                b.status,
                b.total_qty,
                b.remaining_qty,
                b.produced_at,
                b.expired_at,
                b.notes,
                (b.total_qty - b.remaining_qty) AS used_qty
             FROM batches b
             WHERE b.production_id = ?
             ORDER BY b.produced_at ASC`,
            [id]
        );

        // Untuk tiap batch, ambil riwayat penjualan (transaksi keluar adonan)
        for (const batch of batchRows) {
            const [salesRows] = await db.query(
                `SELECT
                    s.id          AS sale_id,
                    s.created_at  AS sale_at,
                    s.payment_method,
                    s.grand_total,
                    -- total ml terpakai dari transaksi ini (sum semua item × adonan_ml)
                    SUM(si.qty * pr.adonan_ml) AS ml_used,
                    -- ringkasan item yang dijual
                    GROUP_CONCAT(
                        CONCAT(pr.name, ' ', pr.size, ' ×', si.qty)
                        ORDER BY pr.size
                        SEPARATOR ', '
                    ) AS items_summary
                 FROM sales s
                 JOIN sale_items si ON si.sale_id = s.id
                 JOIN products  pr  ON pr.id = si.product_id
                 WHERE s.batch_id = ?
                 GROUP BY s.id, s.created_at, s.payment_method, s.grand_total
                 ORDER BY s.created_at ASC`,
                [batch.id]
            );
            batch.sales = salesRows;
        }

        batches = batchRows;
    }

    // 3. Ringkasan batch
    let batchSummary = null;
    if (prod.recipe_type === 'adonan' && batches.length > 0) {
        const totalQty = batches.reduce((s, b) => s + Number(b.total_qty), 0);
        const usedQty = batches.reduce((s, b) => s + Number(b.used_qty), 0);
        const remaining = batches.reduce((s, b) => s + Number(b.remaining_qty), 0);
        const wasted = batches
            .filter(b => ['EXPIRED', 'DAMAGED'].includes(b.status))
            .reduce((s, b) => s + Number(b.remaining_qty), 0);

        batchSummary = {
            total_qty: totalQty,
            used_qty: usedQty,
            remaining_qty: remaining,
            wasted_qty: wasted,
            active_count: batches.filter(b => b.status === 'ACTIVE').length,
            frozen_count: batches.filter(b => b.status === 'FROZEN').length,
            expired_count: batches.filter(b => b.status === 'EXPIRED').length,
            damaged_count: batches.filter(b => b.status === 'DAMAGED').length,
            sold_out_count: batches.filter(b => b.status === 'SOLD_OUT').length,
        };
    }

    return { ...prod, batches, batch_summary: batchSummary };
};
module.exports = { create, getAll, getDetail, getRekap, getAdonanByBooth, getAdonanForBooth, getRecipeById, getActiveRecipes, checkStock, getById, hasActiveBatch, update, remove };
