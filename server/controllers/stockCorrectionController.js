const db = require('../connection');
const { create } = require('../models/stockCorrectionModel');
const { insertMovement } = require('../helpers/stockHelper');
const response = require('../helpers/response');

const koreksi = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { item_id, location_id, qty, movement_type, notes } = req.body;
        const created_by = req.user.id;

        if (!item_id || !location_id || !qty || !movement_type) {
            return response(400, null, 'item_id, location_id, qty, movement_type wajib diisi', res);
        }
        if (Number(qty) <= 0) {
            return response(400, null, 'Qty harus lebih dari 0', res);
        }

        // Cek stok sekarang
        const [[stokRow]] = await conn.query(
            `SELECT current_stock FROM stock_per_location WHERE item_id = ? AND location_id = ?`,
            [item_id, location_id]
        );
        if (!stokRow) return response(404, null, 'Stok di lokasi ini tidak ditemukan', res);

        const stokNow = parseFloat(stokRow.current_stock ?? 0);
        if (movement_type === 'OUT' && qty > stokNow) {
            return response(400, null, `Stok tidak cukup (saat ini: ${stokNow})`, res);
        }

        // Simpan ke stock_corrections
        const correctionId = await create({ item_id, location_id, qty, movement_type, notes, created_by });

        // Insert ke stock_movements + update stok pakai helper yang sudah ada
        await insertMovement(conn, {
            item_id,
            location_id,
            qty,
            movement_type,
            source_type: 'KOREKSI',
            source_id: correctionId,
        });

        await conn.commit();
        response(200, { correction_id: correctionId }, 'Koreksi stok berhasil', res);
    } catch (err) {
        await conn.rollback();
        response(500, null, err.message, res);
    } finally {
        conn.release();
    }
};

module.exports = { koreksi };