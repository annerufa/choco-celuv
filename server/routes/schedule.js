// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllSchedules,
    getSchedule,
    getMySchedule,
    updateSchedule,
    getScheduleHistory,
    createSchedule,
    deactivateSchedule,
    reactivateSchedule
} = require('../controllers/scheduleController');

router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.get('/me', getMySchedule);
router.get('/:id', getSchedule);
router.put('/:id', updateSchedule);
router.get('/history/:employeeId', getScheduleHistory);
router.patch('/:id/deactivate', deactivateSchedule);
router.patch('/:id/reactivate', reactivateSchedule);
module.exports = router;
