// controllers/salesController.js
const Sale = require('../models/salesModel');
const response = require('../helpers/response');

// GET /sales/products
const getProducts = async (req, res) => {
    try {
        const data = await Sale.getProducts();
        response(200, data, 'Berhasil mengambil produk', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

// POST /sales
const createSale = async (req, res) => {
    try {
        const { payment_method, items } = req.body;

        if (!items || items.length === 0)
            return response(400, null, 'Tidak ada item', res);
        if (!['tunai', 'qris'].includes(payment_method))
            return response(400, null, 'Metode pembayaran tidak valid', res);

        const data = await Sale.createSale(req.user.id, payment_method, items);
        response(200, data, 'Transaksi berhasil', res);
    } catch (err) {
        // Error dari model (batch tidak ada, booth tidak ada, dll)
        // dikembalikan langsung sebagai pesan ke frontend
        response(500, null, err.message, res);
    }
};

// GET /sales/rekap?from=&to=&booth_id=&method=
const getRekap = async (req, res) => {
    try {

        if (req.user.role !== 'pemilik')
            return response(403, null, 'Akses ditolak', res);

        const { from, to, booth_id, method } = req.query;

        if (!from || !to)
            return response(400, null, 'Parameter from dan to wajib diisi', res);

        const data = await Sale.getRekap({ from, to, booth_id, method });
        response(200, data, 'Berhasil mengambil rekap penjualan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};


module.exports = { getProducts, createSale, getRekap };