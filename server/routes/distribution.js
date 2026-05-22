const express = require('express');
const router = express.Router();
const { getAll, create, getMyDistributions, getDisToday, getDistributionbyId, getDistributionItems, pickupDistribution, cancelDis, receiveDis } = require('../controllers/distributionController');
const auth = require('../middleware/authenticate');


router.get('/', auth, getAll);
router.post('/', auth, create);

router.get('/my', getMyDistributions);  // list distribusi kurir
router.get('/my-today', getDisToday);  // list distribusi kurir
router.get('/:id/items', getDistributionItems);   // detail barang distribusi
router.post('/:id/pickup', pickupDistribution);  // → kurir pickup (draft → dikirim)

router.post('/:id/cancel', cancelDis)  // → batalkan distribusi
router.post('/:id/receive', receiveDis)  //→ penjaga booth terima (dikirim → diterima) */}
router.get('/:id', getDistributionbyId)  //        → detail distribusi + items
module.exports = router;