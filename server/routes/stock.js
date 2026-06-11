const express = require('express');
const router = express.Router();
const { koreksi } = require('../controllers/stockCorrectionController');

router.post('/koreksi', koreksi);

module.exports = router;