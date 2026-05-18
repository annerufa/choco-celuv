// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAttendanceToday,
    getAttendanceRange,
    clockIn,
    clockOut,
    getOpen,
    getMine,
    getTodayOwner,
    insertManual
} = require('../controllers/attendanceController');

router.get('/today', getAttendanceToday);
router.get('/range', getAttendanceRange);
router.post('/clockin', clockIn);
router.post('/clockout', clockOut);
router.get('/open', getOpen);
router.get('/mine', getMine);
router.get('/today-owner', getTodayOwner);
router.post('/manual', insertManual);
module.exports = router;
