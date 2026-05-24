// ═══════════════════════════════════════════════════════════════
// CONTROLLER  —  controllers/productionController.js
// ═══════════════════════════════════════════════════════════════
const production = require('../models/productionModel');
const db = require('../connection');

const response = require('../helpers/response');
// GET /api/productions
const getProductions = async (req, res) => {
    try {
        const data = await production.getAll();
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// GET /api/productions/rekap
const getRekapProduksi = async (req, res) => {
    try {
        const { from, to, booth_id } = req.query;
        if (!from || !to) return response(400, null, 'Parameter from dan to wajib diisi', res);

        const data = await production.getRekap(from, to, booth_id ?? null);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// GET /api/productions/recipes  — hanya resep aktif untuk dropdown
const getActiveRecipes = async (req, res) => {
    try {
        const data = await production.getActiveRecipes();
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// POST /api/productions
const createProduction = async (req, res) => {
    try {
        const { recipe_id, qty } = req.body; // qty = jumlah batch

        if (!recipe_id || !qty || qty < 1) {
            return response(400, null, 'recipe_id dan qty wajib diisi', res);
        }

        // Cek resep ada dan aktif
        const recipe = await production.getRecipeById(recipe_id);
        if (!recipe) return response(404, null, 'Resep tidak ditemukan', res);
        if (!recipe.is_active) return response(400, null, 'Resep tidak aktif', res);

        // Cek stok bahan mencukupi
        const { cukup, kurang } = await production.checkStock(recipe_id, qty, req.user.location_id);
        if (!cukup) {
            return response(400, { kurang }, 'Stok bahan tidak mencukupi', res);
        }

        // Simpan produksi
        const data = await production.create({
            recipe_id,
            qty,
            created_by: req.user.id,
            loc_id: req.user.location_id,
            booth_id: req.user.booth_id ?? null,
        });

        response(201, data, 'Produksi berhasil dibuat', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// PUT /api / productions /: id
const updateProduction = async (req, res) => {
    try {
        const { id } = req.params;
        const { qty } = req.body;

        if (!qty || qty < 1) return response(400, null, 'qty wajib diisi', res);

        // Cek produksi ada
        const prod = await production.getById(id);
        if (!prod) return response(404, null, 'Produksi tidak ditemukan', res);

        // Guard: cek batch aktif (hanya untuk adonan)
        if (prod.recipe_type === 'adonan') {
            const hasActiveBatch = await production.hasActiveBatch(id);
            if (hasActiveBatch) {
                return response(400, null, 'Tidak bisa edit — masih ada batch aktif', res);
            }
        }

        // Cek selisih qty
        const diff = qty - prod.qty; // positif = tambah, negatif = kurang
        if (diff === 0) return response(400, null, 'Qty sama, tidak ada perubahan', res);

        // Kalau nambah batch → cek stok bahan mencukupi untuk selisihnya
        if (diff > 0) {
            const { cukup, kurang } = await production.checkStock(
                prod.recipe_id, diff, prod.loc_id
            );
            if (!cukup) {
                return response(400, { kurang }, 'Stok bahan tidak mencukupi untuk penambahan', res);
            }
        }

        const data = await production.update(id, qty, diff);
        response(200, data, 'Produksi berhasil diperbarui', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// DELETE /api/productions/:id
const deleteProduction = async (req, res) => {
    try {
        const { id } = req.params;

        const prod = await production.getById(id);
        if (!prod) return response(404, null, 'Produksi tidak ditemukan', res);

        // Guard: cek batch aktif
        if (prod.recipe_type === 'adonan') {
            const hasActiveBatch = await production.hasActiveBatch(id);
            if (hasActiveBatch) {
                return response(400, null, 'Tidak bisa hapus — masih ada batch aktif', res);
            }
        }

        await production.remove(id);
        response(200, null, 'Produksi berhasil dihapus', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};


module.exports = { createProduction, getActiveRecipes, getRekapProduksi, getProductions, updateProduction, deleteProduction };