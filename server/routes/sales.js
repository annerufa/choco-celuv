const express = require('express');
const router = express.Router();
const { getProducts, createSale, getRekap } = require('../controllers/salesController');
const auth = require('../middleware/authenticate');


router.get('/rekap', auth, getRekap);
router.get('/products', auth, getProducts);
router.post('/', auth, createSale);

module.exports = router;
