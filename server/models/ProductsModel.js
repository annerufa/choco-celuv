// models/productsModel.js
const db = require('../connection');

const getAll = async () => {
    const [rows] = await db.query(
        `SELECT
            p.*,
            r.name AS recipe_name,
            r.type AS recipe_type
         FROM products p
         JOIN recipes r ON r.id = p.recipe_id
         ORDER BY p.recipe_id, FIELD(p.size,'kecil','sedang','jumbo')`
    );
    return rows;
};

const getById = async (id) => {
    const [[product]] = await db.query(
        `SELECT p.*, r.name AS recipe_name, r.type AS recipe_type
         FROM products p
         JOIN recipes r ON r.id = p.recipe_id
         WHERE p.id = ?`, [id]
    );
    if (!product) return null;

    const components = await getComponentsByProductId(id);
    return { ...product, components };
};

const create = async ({ recipe_id, name, size, price, adonan_ml }) => {
    const [result] = await db.query(
        `INSERT INTO products (recipe_id, name, size, price, adonan_ml)
         VALUES (?, ?, ?, ?, ?)`,
        [recipe_id, name, size, price, adonan_ml]
    );
    return getById(result.insertId);
};

const update = async (id, { recipe_id, name, size, price, adonan_ml, is_active }) => {
    const [result] = await db.query(
        `UPDATE products
         SET recipe_id  = COALESCE(?, recipe_id),
             name       = COALESCE(?, name),
             size       = COALESCE(?, size),
             price      = COALESCE(?, price),
             adonan_ml  = COALESCE(?, adonan_ml),
             is_active  = COALESCE(?, is_active)
         WHERE id = ?`,
        [recipe_id, name, size, price, adonan_ml, is_active, id]
    );
    if (result.affectedRows === 0) return null;
    return getById(id);
};

const remove = async (id) => {
    // Hapus components dulu (kalau tidak ada ON DELETE CASCADE)
    await db.query(`DELETE FROM product_components WHERE product_id = ?`, [id]);
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows > 0;
};

// ── Components ───────────────────────────────────────────────
const getComponentsByProductId = async (product_id) => {
    const [rows] = await db.query(
        `SELECT
            pc.product_id,
            pc.item_id,
            pc.qty,
            pc.applies_to,
            i.name     AS item_name,
            i.unit,
            i.category
         FROM product_components pc
         JOIN items i ON i.id = pc.item_id
         WHERE pc.product_id = ?
         ORDER BY pc.applies_to, i.name`,
        [product_id]
    );
    return rows;
};

const addComponent = async (product_id, { item_id, qty, applies_to }) => {
    await db.query(
        `INSERT INTO product_components (product_id, item_id, qty, applies_to)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE qty = VALUES(qty)`,
        [product_id, item_id, qty, applies_to]
    );
    const [rows] = await db.query(
        `SELECT pc.*, i.name AS item_name, i.unit, i.category
         FROM product_components pc
         JOIN items i ON i.id = pc.item_id
         WHERE pc.product_id = ? AND pc.item_id = ? AND pc.applies_to = ?`,
        [product_id, item_id, applies_to]
    );
    return rows[0];
};

const updateComponent = async (product_id, item_id, applies_to, qty) => {
    const [result] = await db.query(
        `UPDATE product_components SET qty = ?
         WHERE product_id = ? AND item_id = ? AND applies_to = ?`,
        [qty, product_id, item_id, applies_to]
    );
    if (result.affectedRows === 0) return null;
    const [rows] = await db.query(
        `SELECT pc.*, i.name AS item_name, i.unit, i.category
         FROM product_components pc
         JOIN items i ON i.id = pc.item_id
         WHERE pc.product_id = ? AND pc.item_id = ? AND pc.applies_to = ?`,
        [product_id, item_id, applies_to]
    );
    return rows[0];
};

const removeComponent = async (product_id, item_id, applies_to) => {
    const [result] = await db.query(
        `DELETE FROM product_components
         WHERE product_id = ? AND item_id = ? AND applies_to = ?`,
        [product_id, item_id, applies_to]
    );
    return result.affectedRows > 0;
};

module.exports = { getAll, getById, create, update, remove, getComponentsByProductId, addComponent, updateComponent, removeComponent };