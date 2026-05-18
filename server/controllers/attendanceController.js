// controllers/attendanceController.js
const Attendance = require('../models/AttendanceModel');
const Schedule = require('../models/ScheduleModel');
const response = require('../helpers/response');
const { get } = require('../routes/schedule');

const getAttendanceToday = async (req, res) => {
    try {
        const { booth_id } = req.query;
        const data = await Attendance.getToday(booth_id);
        response(200, data, 'Berhasil mengambil data absensi hari ini', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getAttendanceRange = async (req, res) => {
    try {
        const { start_date, end_date, employee_id, booth_id } = req.query;

        if (!start_date || !end_date) {
            return response(400, null, 'start_date dan end_date wajib diisi', res);
        }

        const data = await Attendance.getByDateRange(start_date, end_date, employee_id, booth_id);
        response(200, data, 'Berhasil mengambil rekap absensi', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const clockIn = async (req, res) => {
    try {
        const { booth_id, shift, lat, lon, is_override } = req.body;
        const employeeId = req.user?.id;

        if (!booth_id || !shift || lat === undefined || lon === undefined) {
            return response(400, null, 'booth_id, shift, lat, lon wajib diisi', res);
        }
        if (!['pagi', 'malam'].includes(shift)) {
            return response(400, null, 'shift harus pagi atau malam', res);
        }

        // Ambil jadwal aktif karyawan untuk validasi lokasi & schedule_id
        const schedule = await Schedule.getActiveByEmployee(employeeId);

        // Validasi lokasi terhadap booth yang dituju
        if (schedule?.lat && schedule?.lon) {
            const { valid, distanceMeters } = Attendance.isWithinBooth(lat, lon, schedule.lat, schedule.lon);
            if (!valid) {
                return response(400, null, `Lokasi terlalu jauh dari booth (${distanceMeters}m). Maksimal 100m.`, res);
            }
        }

        const data = await Attendance.clockIn({
            employeeId,
            boothId: booth_id,
            scheduleId: schedule?.id ?? null,
            shift,
            lat,
            lon,
            isOverride: is_override ?? false,
            createdBy: employeeId,
        });

        response(201, data, 'Clock-in berhasil dicatat', res);
    } catch (err) {
        // Pesan dari model (misal double clock-in) langsung diteruskan
        const status = err.message.includes('Sudah') ? 409 : 500;
        response(status, null, err.message, res);
    }
};

const clockOut = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        const employeeId = req.user?.id;

        if (lat === undefined || lon === undefined) {
            return response(400, null, 'lat dan lon wajib diisi', res);
        }

        // Cari record clock-in yang masih terbuka
        const open = await Attendance.getOpenAttendance(employeeId);
        if (!open) return response(404, null, 'Tidak ada sesi clock-in yang aktif hari ini', res);

        // Validasi lokasi saat clock-out
        if (open.booth_lat && open.booth_lon) {
            const { valid, distanceMeters } = Attendance.isWithinBooth(lat, lon, open.booth_lat, open.booth_lon);
            if (!valid) {
                return response(400, null, `Lokasi terlalu jauh dari booth (${distanceMeters}m). Maksimal 100m.`, res);
            }
        }

        const data = await Attendance.clockOut({ attendanceId: open.id, lat, lon });
        response(200, data, 'Clock-out berhasil dicatat', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getOpen = async (req, res) => {
    try {
        const data = await Attendance.getOpen(req.user.id);
        response(200, data, 'Berhasil mengambil sesi aktif', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getMine = async (req, res) => {
    try {
        const data = await Attendance.getMine(req.user.id);
        response(200, data, 'Berhasil mengambil riwayat absensi', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getTodayOwner = async (req, res) => {
    try {
        const data = await Attendance.getTodayOwner();
        response(200, data, 'Berhasil mengambil absensi hari ini', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const insertManual = async (req, res) => {
    try {
        const { employee_id, booth_id, schedule_id, shift, status, notes } = req.body;

        if (!employee_id || !booth_id || !shift || !status) {
            return response(400, null, 'employee_id, booth_id, shift, status wajib diisi', res);
        }
        if (!['izin', 'sakit', 'libur'].includes(status)) {
            return response(400, null, 'Status harus izin, sakit, atau libur', res);
        }

        await Attendance.insertManual({
            employeeId: employee_id,
            boothId: booth_id,
            scheduleId: schedule_id || null,
            shift,
            status,
            notes,
            createdBy: req.user.id,
        });
        response(201, null, `Status ${status} berhasil dicatat`, res);
    } catch (err) {
        const code = err.message.includes('sudah memiliki') ? 409 : 500;
        response(code, null, err.message, res);
    }
};

module.exports = { getAttendanceToday, getAttendanceRange, clockIn, clockOut, getOpen, getMine, getTodayOwner, insertManual };