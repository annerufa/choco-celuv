const router = require('express').Router();
const { getAllKaryawan, createKaryawan, updateKaryawan, statusKaryawan, getKurir, getPenjaga, getAllKaryawanwithJadwal, updatePassword } = require('../controllers/karyawanController');

router.get('/', getAllKaryawan);
router.get('/withJadwal', getAllKaryawanwithJadwal);
router.post('/', createKaryawan);
router.put('/:id', updateKaryawan);
router.patch('/update-password', updatePassword);
router.patch('/:id/status', statusKaryawan);



router.get('/kurir', getKurir);
router.get('/penjaga', getPenjaga);
// router.put('/:id', updateProduct);
// router.delete('/:id', deleteProduct);

module.exports = router;