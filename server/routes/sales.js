const express = require('express');
const router = express.Router();
const { getProducts, getRekapPenjualanHPPHandler, createSale, getSummary, getSalesTrend, getSalesPerBooth, getRekap, getRekapPenjualan, getRekapPembelian, getRekapDistribusi } = require('../controllers/salesController');
const auth = require('../middleware/authenticate');


router.get('/rekap', auth, getRekap);
router.get('/products', auth, getProducts);
router.get('/shift-summary', auth, getSummary);
router.post('/', auth, createSale);
router.get('/rekap/penjualan', getRekapPenjualan);
router.get('/rekap-hpp', getRekapPenjualanHPPHandler);

router.get('/rekap/pembelian', getRekapPembelian);
router.get('/rekap/distribusi', getRekapDistribusi);
router.get('/chart/trend', auth, getSalesTrend);
router.get('/chart/per-booth', auth, getSalesPerBooth);
module.exports = router;
