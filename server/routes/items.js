const router = require('express').Router();
const { getAllItems, getBoothStock, getMyItems, createItems, updateItems, statusItem, getUnitConversions, createUnitConversion, deleteUnitConversion, getItem, deleteItems, getBoothSettings, updateBoothSettings, getByItemOrLocation, getItemsPerLoc, getConversions } = require('../controllers/itemController');
const { trackItem } = require('../controllers/stockMovementController');
const { getMatrix, toggleActive } = require('../controllers/matrixController');


router.get('/', getAllItems);        // pemilik → semua item (rekap)
router.get('/my', getMyItems);      // penjaga booth → item di lokasinya

router.get('/stockPer', getByItemOrLocation);
router.get('/perLoc', getItemsPerLoc);
router.get('/boothStock', getBoothStock);
router.get('/trackItem', trackItem);
router.get('/matrix', getMatrix);
router.get('/conversions/:item_id', getConversions);
router.patch('/toggle', toggleActive);


router.post('/', createItems);
router.put('/:id', updateItems);
router.put('/:id/status', statusItem);

// ✅ Unit conversions — taruh SETELAH semua route /:id biasa
router.get('/:id/unit-conversions', getUnitConversions);
router.post('/:id/unit-conversions', createUnitConversion);
router.delete('/:id/unit-conversions/:ucId', deleteUnitConversion);
router.patch('/:id/booth-settings', updateBoothSettings);



router.get('/:id', getItem); //detail 1 item


// Ambil semua booth settings untuk 1 item → buat isi modal
// router.get('/:id/booth-settings', getBoothSettings);

module.exports = router;