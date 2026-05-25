// models/salesModel.js
const db = require('../connection');

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

        if (!batch) throw new Error('Tidak ada batch adonan aktif di booth ini');

        // 3. Ambil harga produk
        const productIds = items.map(i => i.product_id);
        const [products] = await conn.query(
            `SELECT id, price FROM products WHERE id IN (?)`,
            [productIds]
        );
        const priceMap = {};
        products.forEach(p => { priceMap[p.id] = Number(p.price); });

        // 4. Hitung grand total
        const grand_total = items.reduce((sum, it) => {
            return sum + (priceMap[it.product_id] ?? 0) * it.qty;
        }, 0);

        // 5. Insert sales
        const [saleResult] = await conn.query(`
            INSERT INTO sales (booth_id, batch_id, created_by, payment_method, grand_total)
            VALUES (?, ?, ?, ?, ?)
        `, [booth_id, batch.id, userId, payment_method, grand_total]);

        const sale_id = saleResult.insertId;

        // 6. Insert sale_items + kurangi stok per item
        for (const it of items) {
            const unit_price = priceMap[it.product_id] ?? 0;
            const total_price = unit_price * it.qty;

            // Insert sale_item
            await conn.query(`
                INSERT INTO sale_items (sale_id, product_id, qty, is_less_ice, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [sale_id, it.product_id, it.qty, it.is_less_ice ? 1 : 0, unit_price, total_price]);

            // Ambil komponen bahan sesuai is_less_ice
            // applies_to 'all' selalu dikurangi
            // applies_to 'less_ice' hanya kalau is_less_ice = 1
            // applies_to 'regular'  hanya kalau is_less_ice = 0
            const applies = it.is_less_ice ? ['all', 'less_ice'] : ['all', 'regular'];
            const [components] = await conn.query(`
                SELECT item_id, qty
                FROM product_components
                WHERE product_id = ?
                  AND applies_to IN (?)
            `, [it.product_id, applies]);

            for (const comp of components) {
                const totalQty = Number(comp.qty) * it.qty;

                // Kurangi stock_per_location (tidak bisa minus)
                await conn.query(`
                    UPDATE stock_per_location
                    SET current_stock = GREATEST(0, current_stock - ?)
                    WHERE item_id = ? AND location_id = ?
                `, [totalQty, comp.item_id, location_id]);

                // Catat stock_movements OUT
                await conn.query(`
                    INSERT INTO stock_movements 
                        (item_id, location_id, qty, movement_type, source_type, source_id)
                    VALUES (?, ?, ?, 'OUT', 'PENJUALAN', ?)
                `, [comp.item_id, location_id, totalQty, sale_id]);
            }
        }

        // 7. Kurangi remaining_qty batch
        const totalQtySold = items.reduce((sum, it) => sum + it.qty, 0);
        await conn.query(`
            UPDATE batches
            SET remaining_qty = GREATEST(0, remaining_qty - ?)
            WHERE id = ?
        `, [totalQtySold, batch.id]);

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

module.exports = { getProducts, createSale };