const express = require('express');
const router = express.Router();
// const purchase = require('../controllers/purchaseController');
const { getProductions, getRekapProduksi, getActiveRecipes, getAdonanBooth, createProduction, updateProduction, deleteProduction } = require('../controllers/productionController');
const auth = require('../middleware/authenticate');
const withUserLocation = require('../middleware/withUserLocation');

router.get('/', auth, getProductions);       // GET  /api/productions
router.get('/rekap', auth, getRekapProduksi);     // GET  /api/productions/rekap?from=&to=&booth_id=
router.get('/recipes', auth, getActiveRecipes);     // GET  /api/productions/recipes  (dropdown)
router.post('/', auth, withUserLocation, createProduction);     // POST /api/productions
// router.get('/:booth_id/adonan', auth, getAdonanBooth);
router.get('/adonan', auth, withUserLocation, getAdonanBooth);
router.put('/:id', auth, updateProduction);   // PUT    /api/productions/:id
router.delete('/:id', auth, deleteProduction);   // DELETE /api/productions/:id

module.exports = router;