const express = require('express');
const router = express.Router();
const { getProducts, createSale } = require('../controllers/salesController');
const auth = require('../middleware/authenticate');


router.get('/products', auth, getProducts);
router.post('/', auth, createSale);

module.exports = router;
