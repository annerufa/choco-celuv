const router = require('express').Router();
const { getAllBooth, getBoothwithloc, createBooth, updateBooth, statusBooth } = require('../controllers/boothController');

router.get('/', getAllBooth);
router.get('/loc', getBoothwithloc);
router.post('/', createBooth);
router.put('/:id', updateBooth);
router.patch('/:id/status', statusBooth);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;