const db = require('../connection');

// Ambil semua item berserta data stoknya di satu lokasi 
const getByLocation = async (location_id) => {
    const [rows] = await db.query(
        `SELECT i.*, sl.current_stock as stok
     FROM items i
     LEFT JOIN stock_per_location sl 
       ON i.id = sl.item_id 
     WHERE sl.location_id = ?`,
        [location_id]
    );
    return rows;
};

// Ambil stok satu item di satu lokasi
const getByItemAndLocation = async (item_id, location_id) => {
    const [rows] = await db.query(
        'SELECT * FROM stock_per_location WHERE item_id = ? AND location_id = ?', [item_id, location_id]
    );
    return rows[0];
};


// Saat purchase, update stock_per_location
// Pakai UPDATE saja — karena record sudah pasti ada
// (sudah di-INSERT saat pemilik set min/max)
const updateStockPerLoc = async (qty, item_id, location_id) => {
    const [rows] = await db.query(
        `UPDATE stock_per_location    SET current_stock = current_stock + ?   WHERE item_id = ? AND location_id = ?`,
        [qty, item_id, location_id]
    );
    return rows[0];
};

// Kalau affected rows = 0 → berarti item belum di-setup
// untuk lokasi ini → kembalikan error ke user
// update, remove, getById, dll...

module.exports = { getByLocation, getByItemAndLocation };