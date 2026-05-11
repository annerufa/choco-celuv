const router = require('express').Router();
const { getAll, getKurir, getPenjaga } = require('../controllers/UserController');

router.get('/', getAll);
router.get('/kurir', getKurir);
router.get('/penjaga', getPenjaga);
// router.post('/', createBooth);
// router.put('/:id', updateBooth);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;