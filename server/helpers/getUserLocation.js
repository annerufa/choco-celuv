// helpers/getUserLocation.js

const db = require('../connection');
const getUserLocation = async (userId) => {
    const [[loc]] = await db.query(`
        SELECT sl.id AS location_id, es.booth_id
        FROM employee_schedules es
        JOIN stock_locations sl ON sl.booth_id = es.booth_id AND sl.type = 'booth'
        WHERE es.employee_id = ? AND es.is_active = 1
        LIMIT 1
    `, [userId]);
    return loc ?? null; // null kalau belum ada jadwal aktif
};
module.exports = getUserLocation;