const db = require('../connection');

const findUsername = async (username) => {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
};
// Ambil location_id gudang pusat (untuk pemilik)
// Gudang pusat = stock_locations type 'warehouse', asumsi hanya 1

const getLocationId = async (employeeId) => {
    const [rows] = await db.query(
        `SELECT es.booth_id, sl.id AS location_id
       FROM employee_schedules es
       JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
       WHERE es.employee_id = ?
         AND es.is_active = 1
       LIMIT 1`,
        [employeeId]
    );
    return rows[0] || null;
}

const findByUsername = async (username) => {
    const [rows] = await db.query(
        `SELECT u.*, ea.booth_id, sl.id as location_id
     FROM users u
     LEFT JOIN employee_assignments ea 
       ON ea.employee_id = u.id 
       AND ea.status = 'aktif'
     LEFT JOIN stock_locations sl 
       ON ea.booth_id = sl.booth_id 
       AND sl.type = 'booth'
     WHERE u.username = ?
     LIMIT 1`,
        [username]
    );
    return rows[0];
};


module.exports = { findByUsername, findUsername, getLocationId };