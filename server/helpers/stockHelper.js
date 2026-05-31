// helpers/stockHelper.js

/**
 * Ambil saldo terakhir suatu item di lokasi tertentu,
 * lalu INSERT stock_movement dengan saldo_after yang sudah dihitung.
 * 
 * Selalu pakai `conn` (connection dalam transaksi), bukan `db`.
 */
const insertMovement = async (conn, { item_id, location_id, qty, movement_type, source_type, source_id }) => {
    // Ambil saldo terakhir item ini di lokasi ini
    const [[last]] = await conn.execute(
        `SELECT saldo_after FROM stock_movements 
         WHERE item_id = ? AND location_id = ?
         ORDER BY id DESC LIMIT 1`,
        [item_id, location_id]
    );

    const prevSaldo = Number(last?.saldo_after ?? 0);
    const newSaldo = movement_type === 'IN'
        ? prevSaldo + Number(qty)
        : prevSaldo - Number(qty);

    await conn.execute(
        `INSERT INTO stock_movements 
            (item_id, location_id, qty, movement_type, source_type, source_id, saldo_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item_id, location_id, qty, movement_type, source_type, source_id, newSaldo]
    );

    return newSaldo;
};

module.exports = { insertMovement };