const db = require('../connection');

// ─── Helper: hitung jarak GPS (meter) ─────────────────────────────────────────
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Helper: apakah koordinat dalam radius booth ──────────────────────────────
const ALLOWED_RADIUS_METERS = Number(process.env.BOOTH_RADIUS_METERS) || 500;

const isWithinBooth = (userLat, userLon, boothLat, boothLon) => {
  const dist = haversineDistance(userLat, userLon, boothLat, boothLon);
  return { valid: dist <= ALLOWED_RADIUS_METERS, distanceMeters: Math.round(dist) };
};

// ─── Helper: tentukan status berdasarkan jam ───────────────────────────────────
const LATE_TOLERANCE_MINUTES = Number(process.env.LATE_TOLERANCE_MINUTES) || 15;

const resolveStatus = (expectedClockIn, actualClockIn) => {
  const [expH, expM] = expectedClockIn.split(':').map(Number);
  const actual = new Date(actualClockIn);
  const expected = new Date(actual);
  expected.setHours(expH, expM, 0, 0);
  const diffMinutes = (actual - expected) / 60000;
  return diffMinutes <= LATE_TOLERANCE_MINUTES ? 'hadir' : 'terlambat';
};

// -------------------------------------------------------
// CLOCK IN
// -------------------------------------------------------
const clockIn = async ({ employeeId, boothId, scheduleId, shift, lat, lon, isOverride = false, createdBy = null }) => {
  // const today = new Date().toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA');
  const [existing] = await db.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND date = ? AND shift = ?`,
    [employeeId, today, shift]
  );
  if (existing.length > 0) throw new Error('Sudah melakukan clock-in untuk shift ini hari ini.');

  const clockInTime = new Date();

  // Ambil expected dari jadwal — snapshot langsung
  let expectedIn = null;
  let expectedOut = null;
  let status = 'hadir';

  if (scheduleId) {
    const [schedRows] = await db.query(
      `SELECT expected_clock_in, expected_clock_out FROM employee_schedules WHERE id = ?`,
      [scheduleId]
    );
    if (schedRows[0]) {
      expectedIn = schedRows[0].expected_clock_in;
      expectedOut = schedRows[0].expected_clock_out;
      status = resolveStatus(expectedIn, clockInTime);
    }
  }

  const [result] = await db.query(
    `INSERT INTO attendance
           (employee_id, booth_id, schedule_id, expected_clock_in, expected_clock_out,
            date, shift, is_override, status, clock_in, lat_in, lon_in, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [employeeId, boothId, scheduleId || null, expectedIn, expectedOut,
      today, shift, isOverride ? 1 : 0, status, clockInTime, lat, lon, createdBy]
  );

  return { attendanceId: result.insertId, status, clockInTime };
};

// -------------------------------------------------------
// CLOCK OUT
// -------------------------------------------------------
const clockOut = async ({ attendanceId, lat, lon }) => {
  const [rows] = await db.query(
    `SELECT * FROM attendance WHERE id = ?`,
    [attendanceId]
  );
  if (!rows[0]) throw new Error('Data absensi tidak ditemukan.');
  if (rows[0].clock_out) throw new Error('Sudah melakukan clock-out.');

  const clockOutTime = new Date();
  await db.query(
    `UPDATE attendance SET clock_out = ?, lat_out = ?, lon_out = ? WHERE id = ?`,
    [clockOutTime, lat, lon, attendanceId]
  );

  return { clockOutTime };
};

// -------------------------------------------------------
// GET absensi hari ini (untuk owner dashboard)
// -------------------------------------------------------
const getToday = async (boothId) => {
  // const today = new Date().toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA');
  let sql = `
    SELECT
      a.*,
      e.name        AS employee_name,
      b.name        AS booth_name,
      b.latitude         AS booth_lat,
      b.longitude         AS booth_lon,
      es.expected_clock_in,
      es.expected_clock_out
    FROM attendance a
    JOIN users e  ON e.id  = a.employee_id
    JOIN booth    b  ON b.id  = a.booth_id
    LEFT JOIN employee_schedules es ON es.id = a.schedule_id
    WHERE a.date = ?
  `;
  const params = [today];

  if (boothId) {
    sql += ' AND a.booth_id = ?';
    params.push(boothId);
  }

  sql += ' ORDER BY a.clock_in ASC';
  const [rows] = await db.query(sql, params);

  return rows.map((row) => ({
    ...row,
    location_in_valid:
      row.lat_in && row.booth_lat
        ? isWithinBooth(row.lat_in, row.lon_in, row.booth_lat, row.booth_lon).valid
        : null,
    location_out_valid:
      row.lat_out && row.booth_lat
        ? isWithinBooth(row.lat_out, row.lon_out, row.booth_lat, row.booth_lon).valid
        : null,
  }));
};

// -------------------------------------------------------
// GET rekap absensi by rentang tanggal (untuk owner)
// -------------------------------------------------------
const getByDateRange = async (startDate, endDate, employeeId, boothId) => {
  let sql = `
    SELECT
      a.*,
      e.name  AS employee_name,
      b.name  AS booth_name,
      b.latitude   AS booth_lat,
      b.longitude   AS booth_lon,
      es.expected_clock_in,
      es.expected_clock_out,
      CASE
        WHEN a.clock_in IS NOT NULL AND a.clock_out IS NOT NULL
        THEN TIMESTAMPDIFF(MINUTE, a.clock_in, a.clock_out)
        ELSE NULL
      END AS actual_work_minutes,
      CASE
        WHEN es.expected_clock_in IS NOT NULL AND es.expected_clock_out IS NOT NULL
        THEN TIME_TO_SEC(TIMEDIFF(es.expected_clock_out, es.expected_clock_in)) / 60
        ELSE NULL
      END AS expected_work_minutes
    FROM attendance a
    JOIN users e  ON e.id  = a.employee_id
    JOIN booth    b  ON b.id  = a.booth_id
    LEFT JOIN employee_schedules es ON es.id = a.schedule_id
    WHERE 1=1
  `;
  const params = [];

  if (startDate) { sql += ' AND a.date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND a.date <= ?'; params.push(endDate); }
  if (employeeId) { sql += ' AND a.employee_id = ?'; params.push(employeeId); }
  if (boothId) { sql += ' AND a.booth_id = ?'; params.push(boothId); }

  sql += ' ORDER BY a.date DESC, e.name ASC';
  const [rows] = await db.query(sql, params);

  return rows.map((row) => ({
    ...row,
    location_in_valid:
      row.lat_in && row.booth_lat
        ? isWithinBooth(row.lat_in, row.lon_in, row.booth_lat, row.booth_lon).valid
        : null,
    location_out_valid:
      row.lat_out && row.booth_lat
        ? isWithinBooth(row.lat_out, row.lon_out, row.booth_lat, row.booth_lon).valid
        : null,
  }));
};

// -------------------------------------------------------
// GET absensi aktif (sudah clock-in, belum clock-out)
// -------------------------------------------------------
const getOpenAttendance = async (employeeId) => {
  // const today = new Date().toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA');
  const [rows] = await db.query(
    `SELECT a.*, b.latitude AS booth_lat, b.longitude AS booth_lon
     FROM attendance a
     JOIN booth b ON b.id = a.booth_id
     WHERE a.employee_id = ? AND a.date = ? AND a.clock_out IS NULL
     LIMIT 1`,
    [employeeId, today]
  );
  return rows[0] || null;
};
// GET sesi clock-in yang masih terbuka hari ini (belum clock-out)
const getOpen = async (employeeId) => {
  // const today = new Date().toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA');
  const [rows] = await db.query(
    `SELECT a.*, b.latitude AS booth_lat, b.longitude AS booth_lon
         FROM attendance a
         JOIN booth b ON b.id = a.booth_id
         WHERE a.employee_id = ? AND a.date = ? AND a.clock_out IS NULL
         LIMIT 1`,
    [employeeId, today]
  );
  return rows[0] || null;
};

// GET semua histori absensi milik karyawan sendiri (30 hari terakhir)
const getMine = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT
            a.*,
            b.name        AS booth_name,
            b.latitude    AS booth_lat,
            b.longitude   AS booth_lon,
            CASE
                WHEN a.lat_in IS NOT NULL AND b.latitude IS NOT NULL
                THEN (
                    6371000 * 2 * ATAN2(
                        SQRT(
                            POW(SIN(RADIANS(a.lat_in - b.latitude) / 2), 2) +
                            COS(RADIANS(b.latitude)) * COS(RADIANS(a.lat_in)) *
                            POW(SIN(RADIANS(a.lon_in - b.longitude) / 2), 2)
                        ),
                        SQRT(1 - (
                            POW(SIN(RADIANS(a.lat_in - b.latitude) / 2), 2) +
                            COS(RADIANS(b.latitude)) * COS(RADIANS(a.lat_in)) *
                            POW(SIN(RADIANS(a.lon_in - b.longitude) / 2), 2)
                        ))
                    )
                ) <= 100
                ELSE NULL
            END AS location_in_valid,
            CASE
                WHEN a.lat_out IS NOT NULL AND b.latitude IS NOT NULL
                THEN (
                    6371000 * 2 * ATAN2(
                        SQRT(
                            POW(SIN(RADIANS(a.lat_out - b.latitude) / 2), 2) +
                            COS(RADIANS(b.latitude)) * COS(RADIANS(a.lat_out)) *
                            POW(SIN(RADIANS(a.lon_out - b.longitude) / 2), 2)
                        ),
                        SQRT(1 - (
                            POW(SIN(RADIANS(a.lat_out - b.latitude) / 2), 2) +
                            COS(RADIANS(b.latitude)) * COS(RADIANS(a.lat_out)) *
                            POW(SIN(RADIANS(a.lon_out - b.longitude) / 2), 2)
                        ))
                    )
                ) <= 100
                ELSE NULL
            END AS location_out_valid
         FROM attendance a
         JOIN booth b ON b.id = a.booth_id
         WHERE a.employee_id = ?
         ORDER BY a.date DESC, a.clock_in DESC
         LIMIT 30`,
    [employeeId]
  );
  return rows;
};

// GET absensi hari ini versi owner:
// Gabungkan semua karyawan berjadwal hari ini + data absensinya (kalau ada)
const getTodayOwner = async () => {
  const today = new Date().toLocaleDateString('en-CA');
  // console.log('hari ca: ', today1); // Hasil: "2026-05-19" (Sesuai tanggal lokalmu)
  // const today = new Date().toISOString().slice(0, 10);
  console.log('hari ini:', today);
  const [rows] = await db.query(
    `SELECT
            es.employee_id,
            es.booth_id,
            es.id          AS schedule_id,
            es.shift,
            es.expected_clock_in,
            es.expected_clock_out,
            u.name         AS employee_name,
            b.name         AS booth_name,
            b.latitude     AS booth_lat,
            b.longitude    AS booth_lon,
            a.id           AS attendance_id,
            a.status,
            a.clock_in,
            a.clock_out,
            a.lat_in,
            a.lon_in,
            a.lat_out,
            a.lon_out,
            a.notes,
            CASE
                WHEN a.lat_in IS NOT NULL
                THEN (6371000 * 2 * ATAN2(
                    SQRT(POW(SIN(RADIANS(a.lat_in - b.latitude)/2),2) + COS(RADIANS(b.latitude))*COS(RADIANS(a.lat_in))*POW(SIN(RADIANS(a.lon_in - b.longitude)/2),2)),
                    SQRT(1-(POW(SIN(RADIANS(a.lat_in - b.latitude)/2),2) + COS(RADIANS(b.latitude))*COS(RADIANS(a.lat_in))*POW(SIN(RADIANS(a.lon_in - b.longitude)/2),2)))
                )) <= 500
                ELSE NULL
            END AS location_in_valid,
            CASE
                WHEN a.lat_out IS NOT NULL
                THEN (6371000 * 2 * ATAN2(
                    SQRT(POW(SIN(RADIANS(a.lat_out - b.latitude)/2),2) + COS(RADIANS(b.latitude))*COS(RADIANS(a.lat_out))*POW(SIN(RADIANS(a.lon_out - b.longitude)/2),2)),
                    SQRT(1-(POW(SIN(RADIANS(a.lat_out - b.latitude)/2),2) + COS(RADIANS(b.latitude))*COS(RADIANS(a.lat_out))*POW(SIN(RADIANS(a.lon_out - b.longitude)/2),2)))
                )) <= 500
                ELSE NULL
            END AS location_out_valid
        FROM employee_schedules es
        JOIN users u ON u.id = es.employee_id
        JOIN booth b ON b.id = es.booth_id
        LEFT JOIN attendance a
            ON a.employee_id = es.employee_id
            AND a.date = ?
            AND a.shift = es.shift
        WHERE es.is_active = 1
        ORDER BY es.shift ASC, u.name ASC`,
    [today]
  );
  return rows;
};

// INSERT absensi manual (izin/sakit/libur) oleh owner
const insertManual = async ({ employeeId, boothId, scheduleId, shift, status, notes, createdBy }) => {
  // const today = new Date().toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA');
  // Cek apakah sudah ada record hari ini
  const [existing] = await db.query(
    `SELECT id FROM attendance WHERE employee_id = ? AND date = ? AND shift = ?`,
    [employeeId, today, shift]
  );
  if (existing.length > 0) {
    throw new Error('Karyawan sudah memiliki record absensi hari ini.');
  }

  // Ambil snapshot expected dari jadwal
  let expectedIn = null;
  let expectedOut = null;
  if (scheduleId) {
    const [sched] = await db.query(
      `SELECT expected_clock_in, expected_clock_out FROM employee_schedules WHERE id = ?`,
      [scheduleId]
    );
    if (sched[0]) {
      expectedIn = sched[0].expected_clock_in;
      expectedOut = sched[0].expected_clock_out;
    }
  }

  const [result] = await db.query(
    `INSERT INTO attendance
           (employee_id, booth_id, schedule_id, expected_clock_in, expected_clock_out,
            date, shift, is_override, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [employeeId, boothId, scheduleId || null, expectedIn, expectedOut,
      today, shift, status, notes || null, createdBy]
  );
  return result.insertId;
};

module.exports = {
  isWithinBooth,
  resolveStatus,
  clockIn,
  clockOut,
  getToday,
  getByDateRange,
  getOpenAttendance,
  getOpen,
  getMine,
  getTodayOwner,
  insertManual
};