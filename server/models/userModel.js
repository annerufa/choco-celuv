const db = require('../connection');

const findByEmail = (email) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, res) => {
        err ? reject(err) : resolve(res[0]);
    });
});

// const findByUsername = async (username) => {
//     const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
//     return rows[0];
// };

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


module.exports = { findByEmail, findByUsername };