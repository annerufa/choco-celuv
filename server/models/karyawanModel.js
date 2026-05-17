const db = require('../connection');


const getAll = async () => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE role = 'kurir' OR role = 'penjaga_booth' ORDER BY created_at DESC;",
    );
    return rows;
};
const getAllwithJadwal = async () => {
    const [rows] = await db.query(
        "SELECT k.id, k.name, k.no_hp, k.alamat, k.entry_date, k.role, j.booth_id, b.name AS nama_booth, b.longitude, b.latitude, j.shift, j.expected_clock_in AS jam_masuk, j.expected_clock_out AS jam_pulang, k.is_active FROM users k LEFT JOIN ( SELECT s1.* FROM employee_schedules s1 WHERE s1.created_at = ( SELECT MAX(s2.created_at) FROM employee_schedules s2 WHERE s2.employee_id = s1.employee_id AND s2.is_active = 1 ) AND s1.employee_id IN ( SELECT id FROM users WHERE role != 'kurir' ) ) j ON k.id = j.employee_id LEFT JOIN booth b ON j.booth_id = b.id WHERE k.role != 'pemilik' ORDER BY k.created_at DESC",
    );
    return rows;
};
const getKurir = async () => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE role = 'kurir' ORDER BY id DESC;",
    );
    return rows;
};
const getPenjaga = async () => {
    const [rows] = await db.query(
        "SELECT * FROM users WHERE role = 'penjaga_booth' ORDER BY created_at DESC;",
    );
    return rows;
};
const create = async (data) => {
    const { name, no_hp, alamat, role, entry_date, username, password } = data;
    const is_active = 1; // Set default is_active ke 1 (aktif)
    // console.log("data d model:", name, no_hp, alamat, role, entry_date, username, password);

    const [result] = await db.execute(
        `INSERT INTO users (name, username, password, no_hp,  role,  alamat,entry_date,  is_active )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, username, password, no_hp, role, alamat, entry_date, is_active ?? 1]
    );
    return { id: result.insertId, ...data };
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

const statusChange = async (id, isActive) => {
    const [row] = await db.execute(
        `UPDATE users SET is_active=? WHERE id=?`,
        [isActive, id]
    );
    return row[0];
};

module.exports = { getAll, create, update, statusChange, getKurir, getPenjaga, getAllwithJadwal };