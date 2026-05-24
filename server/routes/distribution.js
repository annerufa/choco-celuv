const express = require('express');
const router = express.Router();
const { getAll, create, getMyDistributions, getRekapKurir, updateDistributionStatus, updateDistributionItem, getDisBooth, doneDistributions, arriveDistribution, getDisToday, getDistributionbyId, getDistributionItems, pickupDistribution, cancelDis, receiveDis } = require('../controllers/distributionController');
const auth = require('../middleware/authenticate');


router.get('/', auth, getAll);
router.post('/', auth, create);

router.get('/my', auth, getMyDistributions);  // list distribusi kurir
router.get('/my/sampai', auth, doneDistributions);  // list distribusi kurir
router.get('/my-today', auth, getDisToday);  // list distribusi kurir
router.get('/booth', auth, getDisBooth);  // list distribusi ke booth

router.get('/:id/items', auth, getDistributionItems);   // detail barang distribusi
router.post('/:id/pickup', auth, pickupDistribution);  // → kurir pickup (draft → dikirim)
router.post('/:id/arrive', auth, arriveDistribution)  // → batalkan distribusi
router.get('/rekap', auth, getRekapKurir);

router.put('/:id/items/:item_id', auth, updateDistributionItem);
router.put('/:id/status', auth, updateDistributionStatus);

router.post('/:id/cancel', auth, cancelDis)  // → batalkan distribusi
router.post('/:id/receive', auth, receiveDis)  //→ penjaga booth terima (dikirim → diterima) */}
router.get('/:id', auth, getDistributionbyId)  //        → detail distribusi + items
module.exports = router;