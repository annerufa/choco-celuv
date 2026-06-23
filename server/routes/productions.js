const express = require('express');
const db = require('../connection');
const router = express.Router();
// const purchase = require('../controllers/purchaseController');
const { getProductions, getRekapProduksi, getActiveRecipes, getProductionDetail, getAdonanBooth, createProduction, updateProduction, deleteProduction } = require('../controllers/productionController');
const auth = require('../middleware/authenticate');
const withUserLocation = require('../middleware/withUserLocation');
const response = require('../helpers/response');

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
    const [r1] = await db.query(`
        UPDATE batches SET status = 'EXPIRED'
        WHERE status IN ('ACTIVE', 'FROZEN')
          AND expired_at IS NOT NULL
          AND expired_at <= NOW()
    `);
    const [r2] = await db.query(`
        UPDATE batches SET status = 'EXPIRED'
        WHERE status = 'FROZEN'
          AND frozen_at IS NOT NULL
          AND frozen_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    return response(200, { affected: r1.affectedRows + r2.affectedRows }, 'OK', res);
});
router.get('/batches/expiring-soon', async (req, res) => {
    const [rows] = await db.query(`
        SELECT b.id, b.expired_at, b.total_qty, b.status
        FROM batches b
        JOIN productions p ON p.id = b.production_id
        WHERE b.status IN ('ACTIVE', 'FROZEN')
          AND b.expired_at IS NOT NULL
          AND b.expired_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 MINUTE)
    `);
    return response(200, rows, 'OK', res);
});
module.exports = router;