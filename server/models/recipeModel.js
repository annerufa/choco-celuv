// models/recipeModel.js
const db = require('../connection');

// ─── GET ALL (dengan bahan) ───────────────────────────────────
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

// ─── CREATE ───────────────────────────────────────────────────
const create = async ({ name, type, output_qty, output_unit, expiry_hours, notes, items }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let output_id = null;

        // cek type klo mix, berrt bikin item baru dulu untuk output_id
        if (type === 'mix') {
            const [item] = await conn.query(
                `INSERT INTO items (name, category, unit, is_active)
             VALUES (?, 'Bahan Baku', ?, 1)`,
                [name, output_unit]
            );
            console.log('Created output item with ID:', item.insertId);
            output_id = item.insertId;

            // 2. Ambil semua lokasi yang ada
            const [locations] = await conn.execute(
                `SELECT id, type FROM stock_locations`
            );

            if (locations.length === 0) {
                throw new Error('Belum ada lokasi yang di-setup. Hubungi administrator.');
            }

            // 3. Generate stock_per_location untuk semua lokasi
            for (const loc of locations) {

                await conn.execute(
                    `INSERT INTO stock_per_location (item_id, location_id, current_stock, min_qty, max_qty, safety_stock)
         VALUES (?, ?, 0, 0,0,0)`,
                    [
                        output_id,
                        loc.id,
                    ]
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
            await conn.query(
                `INSERT INTO recipe_items (recipe_id, item_id, qty, unit) VALUES ?`,
                [rows]
            );
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

        // Replace semua bahan
        await conn.query(`DELETE FROM recipe_items WHERE recipe_id = ?`, [id]);
        if (items?.length > 0) {
            const rows = items.map(b => [id, b.item_id, b.qty, b.unit]);
            await conn.query(
                `INSERT INTO recipe_items (recipe_id, item_id, qty, unit) VALUES ?`,
                [rows]
            );
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

const statusChange = async (id, isActive) => {
    const [row] = await db.execute(
        `UPDATE recipes SET is_active=? WHERE id=?`,
        [isActive, id]
    );
    return row[0];
};

module.exports = { getAll, getOne, create, update, remove, statusChange };
