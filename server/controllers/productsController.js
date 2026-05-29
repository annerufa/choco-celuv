const products = require('../models/productsModel');
const response = require('../helpers/response');

const getProducts = async (req, res) => {
    try {
        const data = await products.getAll();
        response(200, data, 'Berhasil', res);
    } catch (err) { response(500, null, err.message, res); }
};

const getProductById = async (req, res) => {
    try {
        const data = await products.getById(req.params.id);
        if (!data) return response(404, null, 'Produk tidak ditemukan', res);
        response(200, data, 'Berhasil', res);
    } catch (err) { response(500, null, err.message, res); }
};

const createProduct = async (req, res) => {
    try {
        const { recipe_id, name, size, price, adonan_ml } = req.body;
        if (!recipe_id || !name || !size || !price || !adonan_ml) {
            return response(400, null, 'Semua field wajib diisi', res);
        }
        const data = await products.create({ recipe_id, name, size, price, adonan_ml });
        response(201, data, 'Produk berhasil dibuat', res);
    } catch (err) { response(500, null, err.message, res); }
};

const updateProduct = async (req, res) => {
    try {
        const { recipe_id, name, size, price, adonan_ml, is_active } = req.body;
        const data = await products.update(req.params.id, { recipe_id, name, size, price, adonan_ml, is_active });
        if (!data) return response(404, null, 'Produk tidak ditemukan', res);
        response(200, data, 'Produk berhasil diperbarui', res);
    } catch (err) { response(500, null, err.message, res); }
};

const deleteProduct = async (req, res) => {
    try {
        const deleted = await products.remove(req.params.id);
        if (!deleted) return response(404, null, 'Produk tidak ditemukan', res);
        response(200, null, 'Produk berhasil dihapus', res);
    } catch (err) { response(500, null, err.message, res); }
};

const getComponents = async (req, res) => {
    try {
        const data = await products.getComponentsByProductId(req.params.id);
        response(200, data, 'Berhasil', res);
    } catch (err) { response(500, null, err.message, res); }
};

const addComponent = async (req, res) => {
    try {
        const { item_id, qty, applies_to = 'all' } = req.body;
        if (!item_id || !qty) return response(400, null, 'item_id dan qty wajib diisi', res);
        const data = await products.addComponent(req.params.id, { item_id, qty, applies_to });
        response(201, data, 'Komponen berhasil ditambahkan', res);
    } catch (err) { response(500, null, err.message, res); }
};

const updateComponent = async (req, res) => {
    try {
        const { id, item_id, applies_to } = req.params;
        const { qty } = req.body;
        if (!qty) return response(400, null, 'qty wajib diisi', res);
        const data = await products.updateComponent(id, item_id, applies_to, qty);
        if (!data) return response(404, null, 'Komponen tidak ditemukan', res);
        response(200, data, 'Komponen berhasil diperbarui', res);
    } catch (err) { response(500, null, err.message, res); }
};

const deleteComponent = async (req, res) => {
    try {
        const { id, item_id, applies_to } = req.params;
        const deleted = await products.removeComponent(id, item_id, applies_to);
        if (!deleted) return response(404, null, 'Komponen tidak ditemukan', res);
        response(200, null, 'Komponen berhasil dihapus', res);
    } catch (err) { response(500, null, err.message, res); }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getComponents, deleteComponent, updateComponent, addComponent };