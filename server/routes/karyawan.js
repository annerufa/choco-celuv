const router = require('express').Router();
const { getAllKaryawan, createKaryawan, updateKaryawan } = require('../controllers/karyawanController');

router.get('/', getAllKaryawan);
router.post('/', createKaryawan);
router.put('/:id', updateKaryawan);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;