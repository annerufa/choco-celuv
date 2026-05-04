const router = require('express').Router();
const { getAllBooth, createBooth } = require('../controllers/boothController');

router.get('/', getAllBooth);
router.post('/', createBooth);
// router.put('/:id', updateBooth);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;