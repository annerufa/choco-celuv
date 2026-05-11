const router = require('express').Router();
const { getAllKaryawan, createKaryawan, updateKaryawan, getKurir, getPenjaga } = require('../controllers/karyawanController');

router.get('/', getAllKaryawan);
router.post('/', createKaryawan);
router.put('/:id', updateKaryawan);


router.get('/kurir', getKurir);
router.get('/penjaga', getPenjaga);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;