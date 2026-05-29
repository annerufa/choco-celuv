// controllers/recipeController.js
const Recipe = require('../models/recipeModel');
const response = require('../helpers/response');

const getAllRecipes = async (req, res) => {
    try {
        const data = await Recipe.getAll();
        response(200, data, 'Berhasil mengambil data resep', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getRecipe = async (req, res) => {
    try {
        const data = await Recipe.getOne(req.params.id);
        if (!data) return response(404, null, 'Resep tidak ditemukan', res);
        response(200, data, 'Berhasil mengambil resep', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const createRecipe = async (req, res) => {
    try {
        const { name, type, output_id, output_qty, output_unit, expiry_hours, notes, items } = req.body;

        if (!name || !type || !output_qty || !output_unit) {
            return response(400, null, 'name, type, output_qty, output_unit wajib diisi', res);
        }
        if (!items || items.length === 0) {
            return response(400, null, 'Minimal 1 bahan wajib diisi', res);
        }
        // if (type === 'mix' && !output_id) {
        //     return response(400, null, 'output_id wajib diisi untuk resep tipe mix', res);
        // }

        const data = await Recipe.create({ name, type, output_id, output_qty, output_unit, expiry_hours, notes, items });
        response(201, data, 'Resep berhasil ditambahkan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const updateRecipe = async (req, res) => {
    try {
        const { name, type, output_id, output_qty, output_unit, expiry_hours, notes, items } = req.body;

        if (!name || !type || !output_qty || !output_unit) {
            return response(400, null, 'name, type, output_qty, output_unit wajib diisi', res);
        }
        // if (type === 'mix' && !output_id) {
        //     return response(400, null, 'output_id wajib diisi untuk resep tipe mix', res);
        // }

        const data = await Recipe.update(req.params.id, { name, type, output_id, output_qty, output_unit, expiry_hours, notes, items });
        response(200, data, 'Resep berhasil diupdate', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};


const statusRecipe = async (req, res) => {
    try {
        const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

        await Recipe.statusChange(req.params.id, isActive);

        const msg = isActive ? 'Resep berhasil diaktifkan' : 'Resep berhasil dinonaktifkan';
        response(200, null, msg, res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const getActiveRecipes = async (req, res) => {
    try {
        console.log("tes"); // Debug: pastikan user ID tersedia
        console.log("User ID from token:", req.user.name); // Debug: pastikan user ID tersedia
        console.log("Fetching active recipes for user ID:", req.user.id);
        const data = await Recipe.getActive(req.user.id);
        if (!data) return response(404, null, 'Resep tidak ditemukan', res);
        response(200, data, 'Berhasil mengambil resep', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const makeAdonan = async (req, res) => {
    try {
        const { recipe_id, batch } = req.body;
        if (!recipe_id || !batch || batch < 1)
            return response(400, null, 'recipe_id dan batch wajib diisi', res);

        const data = await Recipe.make(req.user.id, recipe_id, Number(batch));
        response(200, data, `Berhasil membuat ${batch} batch adonan`, res);
    } catch (err) {
        // Error stok kurang dll langsung ke frontend
        response(500, null, err.message, res);
    }
};

module.exports = { getAllRecipes, makeAdonan, getActiveRecipes, getRecipe, createRecipe, updateRecipe, statusRecipe };
