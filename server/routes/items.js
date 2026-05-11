const router = require('express').Router();
const { getAllItems, createItems, getItem, deleteItems, updateItems, getByItemOrLocation, getItemsPerLoc, getConversions } = require('../controllers/itemController');
const { trackItem } = require('../controllers/stockMovementController');
const { getMatrix, toggleActive } = require('../controllers/matrixController');

router.get('/', getAllItems);
router.post('/', createItems);
router.put('/:id', updateItems);
router.delete('/:id', deleteItems);

router.get('/stockPer', getByItemOrLocation); //stok 1 item d semua lokasi atau semua item di 1 lokasi, query: ?item_id= atau ?location_id=
router.get('/perLoc', getItemsPerLoc);
router.get('/trackItem', trackItem);

router.get('/matrix', getMatrix);
router.patch('/toggle', toggleActive);
router.get('/conversions/:item_id', getConversions);
router.get('/:id', getItem); //detail 1 item

module.exports = router;