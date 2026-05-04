const bcrypt = require('bcryptjs');
const db = require('./connection'); // sesuaikan path koneksi DB kamu


async function hashAllPasswords() {
    db.query('SELECT id, password FROM users', async (err, users) => {
        if (err) throw err;

        for (const user of users) {
            const hashed = await bcrypt.hash(user.password, 10);
            db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id], (err) => {
                if (err) throw err;
                console.log(`Updated user id: ${user.id}`);
            });
        }

        console.log('Selesai!');
        setTimeout(() => process.exit(), 1000);
    });
}

hashAllPasswords();