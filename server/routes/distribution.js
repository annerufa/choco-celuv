const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/distributionController');
const auth = require('../middleware/authenticate');


router.get('/', auth, getAll);
router.post('/', auth, create);
// router.get('/:loc_id', auth, getByLoc);
// router.patch('/:id/cancel', auth, cancel);
// router.get('/:id', auth, getById);

module.exports = router;