const db = require('../connection');

const getAll = () => new Promise((resolve, reject) => {
    db.query('SELECT * FROM items ORDER BY id DESC', (err, res) => {
        err ? reject(err) : resolve(res);
    });
});

const create = (data) => new Promise((resolve, reject) => {
    const { nama, kategori, stok, harga, satuan } = data;
    db.query(
        'INSERT INTO products (nama, kategori, stok, harga, satuan) VALUES (?, ?, ?, ?, ?)',
        [nama, kategori, stok, harga, satuan],
        (err, res) => err ? reject(err) : resolve(res)
    );
});

// update, remove, getById, dll...

module.exports = { getAll, create };