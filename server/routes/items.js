const router = require('express').Router();
const { getAllItems, getMyItems, createItems, updateItems, statusItem, getItem, deleteItems, getBoothSettings, updateBoothSettings, getByItemOrLocation, getItemsPerLoc, getConversions } = require('../controllers/itemController');
const { trackItem } = require('../controllers/stockMovementController');
const { getMatrix, toggleActive } = require('../controllers/matrixController');


router.get('/', getAllItems);        // pemilik → semua item (rekap)
router.get('/my', getMyItems);      // penjaga booth → item di lokasinya
router.post('/', createItems);
router.put('/:id', updateItems);
router.put('/:id/status', statusItem);


router.get('/stockPer', getByItemOrLocation); //stok 1 item d semua lokasi atau semua item di 1 lokasi, query: ?item_id= atau ?location_id=
router.get('/perLoc', getItemsPerLoc);
router.get('/trackItem', trackItem);

router.get('/matrix', getMatrix);
// Update booth yang berubah saja
router.patch('/:id/booth-settings', updateBoothSettings);

router.patch('/toggle', toggleActive);
router.get('/conversions/:item_id', getConversions);
router.get('/:id', getItem); //detail 1 item


// Ambil semua booth settings untuk 1 item → buat isi modal
// router.get('/:id/booth-settings', getBoothSettings);

module.exports = router;