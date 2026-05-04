const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE role = 'kurir' OR role = 'penjaga_booth' ORDER BY id DESC;",
    );
    return rows[0];
};

const create = async (data) => {
    const { name, no_hp, alamat, role, entry_date, username, password, is_active } = data;

    // console.log("data d model:", name, no_hp, alamat, role, entry_date, username, password, is_active);
    const conn = await db.getConnection();

    try {
        // await conn.beginTransaction();

        // 1. Insert item baru
        const [result] = await conn.execute(
            `INSERT INTO users (name,no_hp,alamat,  role, entry_date, username, password,  is_active )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, no_hp, alamat, role, entry_date, username, password, is_active ?? 1]
        );


        await conn.commit();
        return { id: result.insertId, ...data };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
const findById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE id=?', [id]);
    return rows[0];
};


const update = async (id, data) => {

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        // const { id } = req.params;

        // Ambil data lama 
        const existing = await findById(id);
        if (!existing) {
            throw new Error(`Karyawan dengan id ${id} tidak ditemukan`);
        }

        // Buat query update dinamis (hanya field yang dikirim)
        const fields = [];
        const values = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.no_hp !== undefined) {
            fields.push('no_hp = ?');
            values.push(data.no_hp);
        }
        if (data.alamat !== undefined) {
            fields.push('alamat = ?');
            values.push(data.alamat);
        }
        if (data.role !== undefined) {
            fields.push('role = ?');
            values.push(data.role);
        }
        if (data.entry_date !== undefined) {
            fields.push('entry_date = ?');
            values.push(data.entry_date);
        }
        if (data.username !== undefined) {
            fields.push('username = ?');
            values.push(data.username);
        }
        if (data.password !== undefined) {
            fields.push('password = ?');
            values.push(data.password);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(data.is_active);
        }

        if (fields.length === 0) {
            throw new Error('Tidak ada data yang akan diupdate');
        }

        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

        console.log('Query:', query);
        console.log('Values:', values);

        const [result] = await conn.execute(query, values);

        await conn.commit();

        // Ambil data setelah update
        const updatedData = await findById(id);

        return updatedData;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// const create = (data) => new Promise((resolve, reject) => {
//     const { nama, username, no_hp, role, password_hash, is_active } = data;
//     db.query(
//         'INSERT INTO users (nama, username, no_hp, role, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
//         [nama, username, no_hp, role, password_hash, is_active],
//         (err, res) => err ? reject(err) : resolve(res)
//     );
// });

// update, remove, getById, dll...

module.exports = { getAll, create, update };