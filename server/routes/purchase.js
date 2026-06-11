const express = require('express');
const router = express.Router();
// const purchase = require('../controllers/purchaseController');
const { create, cancel, getAll, getById, getByLoc } = require('../controllers/purchaseController');
const { getAllLocations } = require('../controllers/stockLocController');
const auth = require('../middleware/authenticate');

// router.get('/', auth, purchase.getAll);
// router.get('/:id', auth, purchase.getById);
// router.post('/', auth, purchase.create);

// module.exports = router;
// const express = require('express');
// const router  = express.Router();

// GET    /api/purchase          → semua purchase (bisa difilter)
// POST   /api/purchase          → buat purchase baru
// GET    /api/purchase/:id      → detail purchase
// PATCH  /api/purchase/:id/cancel → batalkan purchase

router.get('/', auth, getAll);
router.get('/stock-locations', auth, getAllLocations);
router.post('/', auth, create);
// router.get('/:loc_id', auth, getByLoc);
router.patch('/:id/cancel', auth, cancel);
router.get('/:id', auth, getById);

module.exports = router;