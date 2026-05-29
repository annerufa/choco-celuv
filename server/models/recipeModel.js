// models/recipeModel.js
const db = require('../connection');

// ─── GET ALL ──────────────────────────────────────────────────
const getAll = async () => {
    const [recipes] = await db.query(`
        SELECT r.*, i.name AS output_name
        FROM recipes r
        LEFT JOIN items i ON i.id = r.output_id
        ORDER BY r.id DESC
    `);
    if (recipes.length === 0) return [];

    const ids = recipes.map(r => r.id);
    const [items] = await db.query(`
        SELECT ri.recipe_id, ri.item_id, ri.qty AS qty_per_unit, ri.unit, i.name AS item_name
        FROM recipe_items ri
        JOIN items i ON i.id = ri.item_id
        WHERE ri.recipe_id IN (?)
    `, [ids]);

    return recipes.map(r => ({
        ...r,
        bahan: items.filter(b => b.recipe_id === r.id),
    }));
};

// ─── GET ONE ─────────────────────────────────────────────────
const getOne = async (id) => {
    const [[recipe]] = await db.query(`
        SELECT r.*, i.name AS output_name
        FROM recipes r
        LEFT JOIN items i ON i.id = r.output_id
        WHERE r.id = ?
    `, [id]);
    if (!recipe) return null;

    const [bahan] = await db.query(`
        SELECT ri.item_id, ri.qty AS qty_per_unit, ri.unit, i.name AS item_name
        FROM recipe_items ri
        JOIN items i ON i.id = ri.item_id
        WHERE ri.recipe_id = ?
    `, [id]);

    return { ...recipe, bahan };
};

// ─── GET ACTIVE (untuk penjaga booth) ────────────────────────
const getActive = async (userId) => {
    const [[recipe]] = await db.query(`
        SELECT r.id, r.name, r.output_qty, r.output_unit, r.expiry_hours, r.notes,
               i.name AS output_name
        FROM recipes r
        LEFT JOIN items i ON i.id = r.output_id
        WHERE r.is_active = 1 AND r.type = 'adonan'
        LIMIT 1
    `);
    if (!recipe) return null;

    const [[loc]] = await db.query(`
        SELECT sl.id AS location_id
        FROM employee_schedules es
        JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
        WHERE es.employee_id = ? AND es.is_active = 1
        LIMIT 1
    `, [userId]);

    const locationId = loc?.location_id ?? null;

    const [bahan] = await db.query(`
        SELECT 
            ri.item_id AS id,
            i.name,
            ri.qty     AS qty_per_batch,
            ri.unit,
            COALESCE(spl.current_stock, 0) AS stok_tersedia
        FROM recipe_items ri
        JOIN items i ON i.id = ri.item_id
        LEFT JOIN stock_per_location spl 
          ON spl.item_id = ri.item_id AND spl.location_id = ?
        WHERE ri.recipe_id = ?
    `, [locationId, recipe.id]);

    return { ...recipe, bahan };
};

// ─── MAKE ADONAN ─────────────────────────────────────────────
// batch    = jumlah batch yang dibuat (misal 2)
// total_qty dalam ml = batch × recipe.output_qty
// remaining_qty awal = total_qty
const make = async (userId, recipe_id, batch) => {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
        // 1. Ambil resep
        const [[recipe]] = await conn.execute(`
            SELECT id, output_qty, output_unit, expiry_hours
            FROM recipes
            WHERE id = ? AND is_active = 1
        `, [recipe_id]);
        if (!recipe) throw new Error('Resep tidak ditemukan atau tidak aktif');

        // 2. Cari booth & location_id penjaga
        const [[loc]] = await conn.execute(`
            SELECT sl.id AS location_id, es.booth_id
            FROM employee_schedules es
            JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
            WHERE es.employee_id = ? AND es.is_active = 1
            LIMIT 1
        `, [userId]);
        if (!loc) throw new Error('Booth penjaga tidak ditemukan');

        const { location_id, booth_id } = loc;

        // 3. Hitung total_qty dalam ml
        //    output_qty di recipes = ml per 1 batch
        const total_qty = batch * recipe.output_qty; // dalam ml
        const remaining_qty = total_qty;
        const expiry_hours = Number(recipe.expiry_hours ?? 6);

        // 4. Ambil bahan + cek stok
        const [bahan] = await conn.execute(`
            SELECT ri.item_id, ri.qty AS qty_per_batch, ri.unit,
                   i.name AS item_name,
                   COALESCE(spl.current_stock, 0) AS stok_tersedia
            FROM recipe_items ri
            JOIN items i ON i.id = ri.item_id
            LEFT JOIN stock_per_location spl 
              ON spl.item_id = ri.item_id AND spl.location_id = ?
            WHERE ri.recipe_id = ?
        `, [location_id, recipe_id]);

        // Validasi stok — tampilkan nama bahan yang kurang
        const kurang = bahan.filter(b => Number(b.stok_tersedia) < Number(b.qty_per_batch) * batch);
        if (kurang.length > 0) {
            const namaKurang = kurang.map(b => b.item_name).join(', ');
            throw new Error(`Stok tidak mencukupi: ${namaKurang}`);
        }

        // 5. Insert batch
        const [result] = await conn.execute(`
            INSERT INTO batches 
                (recipe_id, booth_id, produced_at, expired_at, total_qty, remaining_qty, status)
            VALUES (
                ?, ?, NOW(),
                DATE_ADD(NOW(), INTERVAL ? HOUR),
                ?, ?, 'ACTIVE'
            )
        `, [recipe_id, booth_id, expiry_hours, total_qty, remaining_qty]);

        const batch_id = result.insertId;

        // 6. Kurangi stok bahan di booth + catat movement
        for (const b of bahan) {
            const needed = Number(b.qty_per_batch) * batch;

            await conn.execute(`
                UPDATE stock_per_location
                SET current_stock = GREATEST(0, current_stock - ?)
                WHERE item_id = ? AND location_id = ?
            `, [needed, b.item_id, location_id]);

            await conn.execute(`
                INSERT INTO stock_movements 
                    (item_id, location_id, qty, movement_type, source_type, source_id)
                VALUES (?, ?, ?, 'OUT', 'PRODUKSI', ?)
            `, [b.item_id, location_id, needed, batch_id]);
        }

        await conn.commit();

        // 7. Return batch baru
        const [[newBatch]] = await db.query(`
            SELECT b.*, r.name AS recipe_name, r.output_unit
            FROM batches b
            JOIN recipes r ON r.id = b.recipe_id
            WHERE b.id = ?
        `, [batch_id]);

        return newBatch;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── CREATE ───────────────────────────────────────────────────
const create = async ({ name, type, output_qty, output_unit, expiry_hours, notes, items }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let output_id = null;

        if (type === 'mix') {
            const [item] = await conn.query(
                `INSERT INTO items (name, category, unit, is_active) VALUES (?, 'Mixing', ?, 1)`,
                [name, output_unit]
            );
            output_id = item.insertId;

            const [locations] = await conn.execute(`SELECT id FROM stock_locations`);
            if (locations.length === 0) throw new Error('Belum ada lokasi. Hubungi administrator.');

            for (const loc of locations) {
                await conn.execute(
                    `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty, safety_stock)
                     VALUES (?, ?, 0, 0, 0, 0)`,
                    [output_id, loc.id]
                );
            }
        }

        const [res] = await conn.query(
            `INSERT INTO recipes (name, type, output_id, output_qty, output_unit, expiry_hours, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, type, output_id ?? null, output_qty, output_unit, expiry_hours ?? null, notes ?? null]
        );
        const recipeId = res.insertId;

        if (items?.length > 0) {
            const rows = items.map(b => [recipeId, b.item_id, b.qty, b.unit]);
            await conn.query(`INSERT INTO recipe_items (recipe_id, item_id, qty, unit) VALUES ?`, [rows]);
        }

        await conn.commit();
        return getOne(recipeId);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── UPDATE ───────────────────────────────────────────────────
const update = async (id, { name, type, output_id, output_qty, output_unit, expiry_hours, notes, items }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `UPDATE recipes SET name=?, type=?, output_id=?, output_qty=?, output_unit=?,
             expiry_hours=?, notes=? WHERE id=?`,
            [name, type, output_id ?? null, output_qty, output_unit, expiry_hours ?? null, notes ?? null, id]
        );

        await conn.query(`DELETE FROM recipe_items WHERE recipe_id = ?`, [id]);
        if (items?.length > 0) {
            const rows = items.map(b => [id, b.item_id, b.qty, b.unit]);
            await conn.query(`INSERT INTO recipe_items (recipe_id, item_id, qty, unit) VALUES ?`, [rows]);
        }

        await conn.commit();
        return getOne(id);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── DELETE ───────────────────────────────────────────────────
const remove = async (id) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(`DELETE FROM recipe_items WHERE recipe_id = ?`, [id]);
        await conn.query(`DELETE FROM recipes WHERE id = ?`, [id]);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── STATUS CHANGE ────────────────────────────────────────────
const statusChange = async (id, isActive) => {
    const [row] = await db.execute(
        `UPDATE recipes SET is_active=? WHERE id=?`,
        [isActive, id]
    );
    return row[0];
};

module.exports = { getAll, getOne, getActive, make, create, update, remove, statusChange };