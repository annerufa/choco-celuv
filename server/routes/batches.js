const router = require('express').Router();
// const { getUtilization } = require('../controllers/batchController');
const auth = require('../middleware/authenticate');
const { getUtilizations, freeze, thaw, damage, detail } = require('../controllers/batchController');

router.get('/utilization', auth, getUtilizations);
router.patch('/:id/freeze', auth, freeze);
router.patch('/:id/thaw', auth, thaw);
router.patch('/:id/damage', auth, damage);
router.get('/:id', auth, detail);
module.exports = router;