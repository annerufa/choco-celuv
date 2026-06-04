const express = require('express');
const db = require('../connection');
const router = express.Router();
// const purchase = require('../controllers/purchaseController');
const { getProductions, getRekapProduksi, getActiveRecipes, getProductionDetail, getAdonanBooth, createProduction, updateProduction, deleteProduction } = require('../controllers/productionController');
const auth = require('../middleware/authenticate');
const withUserLocation = require('../middleware/withUserLocation');

router.get('/', auth, getProductions);       // GET  /api/productions
router.get('/rekap', auth, getRekapProduksi);     // GET  /api/productions/rekap?from=&to=&booth_id=
router.get('/recipes', auth, getActiveRecipes);     // GET  /api/productions/recipes  (dropdown)
router.post('/', auth, withUserLocation, createProduction);     // POST /api/productions
// router.get('/:booth_id/adonan', auth, getAdonanBooth);
router.get('/adonan', auth, withUserLocation, getAdonanBooth);
router.get('/:id/detail', auth, getProductionDetail);
router.put('/:id', auth, updateProduction);   // PUT    /api/productions/:id
router.delete('/:id', auth, deleteProduction);   // DELETE /api/productions/:id
router.patch('/expire-check', async (req, res) => {
    const [result] = await db.query(`
        UPDATE production_batches
        SET status = 'EXPIRED'
        WHERE status IN ('ACTIVE', 'FROZEN')
          AND expired_at IS NOT NULL
          AND expired_at <= NOW()
    `);
    return response(200, { affected: result.affectedRows }, 'OK', res);
});
module.exports = router;