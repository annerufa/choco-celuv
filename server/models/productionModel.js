// models/productionModel.js
const db = require('../config/db');

/**
 * Catat produksi — satu transaksi DB:
 *  1. INSERT productions
 *  2. OUT stock bahan (recipe_items)
 *  3a. type='mix'    → IN stock output item + upsert stock_per_location
 *  3b. type='adonan' → INSERT batches
 */
const create = async ({ recipe_id, qty, booth_id, created_by, loc_id }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Ambil resep + bahan
        const [[recipe]] = await conn.query(
            `SELECT * FROM recipes WHERE id = ?`, [recipe_id]
        );
        if (!recipe) throw new Error('Resep tidak ditemukan');

        const [bahanList] = await conn.query(
            `SELECT * FROM recipe_items WHERE recipe_id = ?`, [recipe_id]
        );

        // 2. Insert productions
        const [prodRes] = await conn.query(
            `INSERT INTO productions (booth_id, recipe_id, created_by, qty, loc_id)
             VALUES (?, ?, ?, ?, ?)`,
            [booth_id ?? null, recipe_id, created_by, qty, loc_id]
        );
        const productionId = prodRes.insertId;

        // 3. OUT stock untuk setiap bahan
        for (const b of bahanList) {
            const totalQty = parseFloat(b.qty) * qty;

            await conn.query(
                `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'OUT', 'PRODUKSI', ?)`,
                [b.item_id, loc_id, totalQty, productionId]
            );

            await conn.query(
                `UPDATE stock_per_location
                 SET current_stock = current_stock - ?
                 WHERE item_id = ? AND location_id = ?`,
                [totalQty, b.item_id, loc_id]
            );
        }

        // 4a. type='mix' → tambah stok output item
        if (recipe.type === 'mix' && recipe.output_id) {
            const totalOutput = parseFloat(recipe.output_qty) * qty;

            await conn.query(
                `INSERT INTO stock_movements (item_id, location_id, qty, movement_type, source_type, source_id)
                 VALUES (?, ?, ?, 'IN', 'PRODUKSI', ?)`,
                [recipe.output_id, loc_id, totalOutput, productionId]
            );

            // Upsert stock_per_location
            await conn.query(
                `INSERT INTO stock_per_location (item_id, location_id, current_stock)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE current_stock = current_stock + VALUES(current_stock)`,
                [recipe.output_id, loc_id, totalOutput]
            );
        }

        // 4b. type='adonan' → buat batch
        if (recipe.type === 'adonan') {
            const totalQty = parseFloat(recipe.output_qty) * qty;
            const producedAt = new Date();
            const expiredAt = recipe.expiry_hours
                ? new Date(producedAt.getTime() + recipe.expiry_hours * 3600000)
                : null;

            await conn.query(
                `INSERT INTO batches
                 (production_id, location_id, booth_id, recipe_id, produced_at, expired_at, total_qty, remaining_qty, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                [productionId, loc_id, booth_id ?? null, recipe_id, producedAt, expiredAt, totalQty, totalQty]
            );
        }

        await conn.commit();
        return { production_id: productionId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

module.exports = { create };
