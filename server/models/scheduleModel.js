const db = require('../connection');


// -------------------------------------------------------
// GET semua jadwal aktif (opsional filter by employee/booth)
// -------------------------------------------------------
const getActive = async (employeeId, boothId) => {
  let sql = `
      SELECT
        es.*,
        e.name        AS employee_name,
        b.name        AS booth_name,
        es.shift,
        es.expected_clock_in,
        es.expected_clock_out,
        creator.name  AS created_by_name
      FROM employee_schedules es
      JOIN users e  ON e.id  = es.employee_id
      JOIN booth    b  ON b.id  = es.booth_id
      LEFT JOIN users creator ON creator.id = es.created_by
      
    `;
  const params = [];

  if (employeeId) {
    sql += ' AND es.employee_id = ?';
    params.push(employeeId);
  }
  if (boothId) {
    sql += ' AND es.booth_id = ?';
    params.push(boothId);
  }

  sql += ' ORDER BY es.is_active DESC, es.updated_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
};

// -------------------------------------------------------
// GET jadwal aktif milik 1 karyawan (untuk clock-in)
// -------------------------------------------------------
const getActiveByEmployee = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT es.*, b.name AS booth_name, b.latitude, b.longitude
       FROM employee_schedules es
       JOIN booth b ON b.id = es.booth_id
       WHERE es.employee_id = ? AND es.is_active = 1
       LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
};

// -------------------------------------------------------
// GET by ID (detail jadwal tertentu)
// -------------------------------------------------------
const getById = async (id) => {
  const [rows] = await db.query(
    `SELECT es.*, e.name AS employee_name, b.name AS booth_name
       FROM employee_schedules es
       JOIN users e ON e.id = es.employee_id
       JOIN booth    b ON b.id = es.booth_id
       WHERE es.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// -------------------------------------------------------
// BUAT jadwal baru
// Otomatis nonaktifkan jadwal lama karyawan di booth yg sama
// -------------------------------------------------------
const create = async ({ employeeId, boothId, shift, expectedClockIn, expectedClockOut, createdBy }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Nonaktifkan jadwal aktif lama karyawan ini
    await conn.query(
      `UPDATE employee_schedules
         SET is_active = 0
         WHERE employee_id = ? AND is_active = 1`,
      [employeeId]
    );

    // Buat jadwal baru
    const [result] = await conn.query(
      `INSERT INTO employee_schedules
           (employee_id, booth_id, shift, expected_clock_in, expected_clock_out, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, boothId, shift, expectedClockIn, expectedClockOut, createdBy]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// -------------------------------------------------------
// NONAKTIFKAN jadwal (soft delete)
// -------------------------------------------------------
const deactivate = async (id, is_active) => {
  const [result] = await db.query(
    `UPDATE employee_schedules SET is_active = ? WHERE id = ?`,
    [is_active, id]
  );
  return result.affectedRows > 0;
};
const reactivate = async (id, createdBy) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil data jadwal yang mau diaktifkan
    const [rows] = await conn.query(
      `SELECT * FROM employee_schedules WHERE id = ?`, [id]
    );
    if (!rows[0]) throw new Error('Jadwal tidak ditemukan.');

    const jadwal = rows[0];

    // Nonaktifkan jadwal aktif lain milik karyawan ini
    await conn.query(
      `UPDATE employee_schedules SET is_active = 0 WHERE employee_id = ? AND is_active = 1`,
      [jadwal.employee_id]
    );

    // Aktifkan jadwal ini
    await conn.query(
      `UPDATE employee_schedules SET is_active = 1 WHERE id = ?`, [id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// -------------------------------------------------------
// GET semua jadwal (aktif + nonaktif) untuk histori
// -------------------------------------------------------
const getHistory = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT es.*, b.name AS booth_name
       FROM employee_schedules es
       JOIN booth b ON b.id = es.booth_id
       WHERE es.employee_id = ?
       ORDER BY es.created_at DESC`,
    [employeeId]
  );
  return rows;
};
// GET jadwal aktif milik karyawan yang sedang login (via token)
const getMySchedule = async (employeeId) => {
  const [rows] = await db.query(
    `SELECT es.*, b.name AS booth_name, b.latitude AS booth_latitude, b.longitude AS booth_longitude
         FROM employee_schedules es
         JOIN booth b ON b.id = es.booth_id
         WHERE es.employee_id = ? AND es.is_active = 1
         LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
};

const update = async (id, { boothId, shift, expectedClockIn, expectedClockOut }) => {
  const [result] = await db.query(
    `UPDATE employee_schedules
         SET booth_id = ?, shift = ?, expected_clock_in = ?, expected_clock_out = ?
         WHERE id = ?`,
    [boothId, shift, expectedClockIn, expectedClockOut, id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  getActive,
  getActiveByEmployee,
  getById,
  create,
  update,
  reactivate,
  deactivate,
  getHistory,
  getMySchedule
};
