const db = require('../connection');

const getUserLocation = async (userId) => {
    // Ambil role dulu
    const [[user]] = await db.query(
        `SELECT role FROM users WHERE id = ?`, [userId]
    );

    // Owner → langsung ambil gudang pusat
    if (user?.role === 'pemilik') {
        const [[loc]] = await db.query(`
            SELECT id AS location_id, NULL AS booth_id
            FROM stock_locations
            WHERE type = 'warehouse'
            LIMIT 1
        `);
        return loc ?? null;
    }

    // Selain owner → cek jadwal aktif
    const [[loc]] = await db.query(`
        SELECT sl.id AS location_id, es.booth_id
        FROM employee_schedules es
        JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
        WHERE es.employee_id = ? AND es.is_active = 1
        LIMIT 1
    `, [userId]);

    return loc ?? null;
};

module.exports = getUserLocation;