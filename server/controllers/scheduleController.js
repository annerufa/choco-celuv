// controllers/scheduleController.js
const Schedule = require('../models/scheduleModel');
const response = require('../helpers/response');

const getAllSchedules = async (req, res) => {
    try {
        const { employee_id, booth_id } = req.query;
        const data = await Schedule.getActive(employee_id, booth_id);
        response(200, data, 'Berhasil mengambil data jadwal', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getSchedule = async (req, res) => {
    try {
        const data = await Schedule.getById(req.params.id);
        if (!data) return response(404, null, 'Jadwal tidak ditemukan', res);
        response(200, data, 'Berhasil mengambil jadwal', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getScheduleHistory = async (req, res) => {
    try {
        const data = await Schedule.getHistory(req.params.employeeId);
        response(200, data, 'Berhasil mengambil histori jadwal', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const createSchedule = async (req, res) => {
    try {
        const { employee_id, booth_id, shift, expected_clock_in, expected_clock_out } = req.body;

        if (!employee_id || !booth_id || !shift || !expected_clock_in || !expected_clock_out) {
            return response(400, null, 'employee_id, booth_id, shift, expected_clock_in, expected_clock_out wajib diisi', res);
        }
        if (!['pagi', 'malam'].includes(shift)) {
            return response(400, null, 'shift harus pagi atau malam', res);
        }

        const id = await Schedule.create({
            employeeId: employee_id,
            boothId: booth_id,
            shift,
            expectedClockIn: expected_clock_in,
            expectedClockOut: expected_clock_out,
            createdBy: req.user?.id ?? null,
        });

        const data = await Schedule.getById(id);
        response(201, data, 'Jadwal berhasil ditambahkan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const deactivateSchedule = async (req, res) => {
    const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

    try {
        const ok = await Schedule.deactivate(req.params.id, isActive);
        if (!ok) return response(404, null, 'Jadwal tidak ditemukan', res);
        response(200, null, 'Jadwal berhasil dinonaktifkan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const reactivateSchedule = async (req, res) => {
    try {
        await Schedule.reactivate(req.params.id);
        response(200, null, 'Jadwal berhasil diaktifkan kembali', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getMySchedule = async (req, res) => {
    try {
        console.log('User ID dari token:', req.user?.id);
        const data = await Schedule.getMySchedule(req.user.id);
        if (!data) return response(404, null, 'Tidak ada jadwal aktif', res);
        response(200, data, 'Berhasil mengambil jadwal aktif', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const updateSchedule = async (req, res) => {
    try {
        const { booth_id, shift, expected_clock_in, expected_clock_out } = req.body;

        if (!booth_id || !shift || !expected_clock_in || !expected_clock_out) {
            return response(400, null, 'booth_id, shift, expected_clock_in, expected_clock_out wajib diisi', res);
        }

        const ok = await Schedule.update(req.params.id, {
            boothId: booth_id,
            shift,
            expectedClockIn: expected_clock_in,
            expectedClockOut: expected_clock_out,
        });
        if (!ok) return response(404, null, 'Jadwal tidak ditemukan', res);
        response(200, null, 'Jadwal berhasil diupdate', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getAllSchedules, getSchedule, getMySchedule, updateSchedule, getScheduleHistory, createSchedule, deactivateSchedule, reactivateSchedule };
