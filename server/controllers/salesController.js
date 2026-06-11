// controllers/salesController.js
const Sale = require('../models/salesModel');
const response = require('../helpers/response');
const getUserLocation = require('../helpers/getUserLocation');

// GET /sales/products
const getProducts = async (req, res) => {
    try {
        const data = await Sale.getProducts();
        response(200, data, 'Berhasil mengambil produk', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
// GET /sales/products
const getSummary = async (req, res) => {
    try {
        const loc = await getUserLocation(req.user.id);
        if (!loc) return response(404, null, 'Jadwal aktif tidak ditemukan', res);

        const data = await Sale.getSummary(loc.booth_id);
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

// Tambah helper tanggal di atas
function getDateRange(req) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const startDate = req.query.start ?? defaultStart;
    const endDate = req.query.end ?? today;
    return { startDate, endDate };
}

const getRekapPenjualan = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);
        const data = await Sale.getRekapPenjualan(req.user.id, startDate, endDate);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const getRekapPembelian = async (req, res) => {
    try {
        const { from, to, loc_id: locId, status } = req.query;

        const data = await Sale.getRekapPembelian({
            startDate: from,
            endDate: to,
            locId: locId || null,
            status: status || null,
        });
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getRekapDistribusi = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);
        const data = await Sale.getRekapDistribusi(req.user.id, startDate, endDate);
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getSalesTrend = async (req, res) => {
    try {
        if (req.user.role !== 'pemilik')
            return response(403, null, 'Akses ditolak', res);

        const { from, to, booth_id } = req.query;
        if (!from || !to)
            return response(400, null, 'Parameter from dan to wajib diisi', res);

        const data = await Sale.getSalesTrend({ from, to, booth_id: booth_id || null });
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getSalesPerBooth = async (req, res) => {
    try {
        if (req.user.role !== 'pemilik')
            return response(403, null, 'Akses ditolak', res);

        const { from, to } = req.query;
        if (!from || !to)
            return response(400, null, 'Parameter from dan to wajib diisi', res);

        const data = await Sale.getSalesPerBooth({ from, to });
        response(200, data, 'Berhasil', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getSalesTrend, getSalesPerBooth, getProducts, createSale, getRekap, getSummary, getRekapPenjualan, getRekapPembelian, getRekapDistribusi };