// routes/stockMatrix.js
const router = require('express').Router();
const { getMatrix, toggleActive } = require('../controllers/matrixController');
// const { verifyToken } = require('../middleware/auth'); // sesuaikan middleware auth kamu

router.get('/', getMatrix);
router.patch('/toggle', toggleActive);

module.exports = router;