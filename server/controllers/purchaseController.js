const purchaseModel = require('../models/purchaseModel');
const db = require('../connection');

// ─────────────────────────────────────────────
// CREATE PURCHASE
// POST /api/purchase
// ─────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const { supplier, date, items } = req.body;
    const { id: created_by, role, location_id } = req.user;

    // ── Validasi input ────────────────────────────────────────────
    if (!supplier) return res.status(400).json({ message: 'Supplier wajib diisi' });
    if (!date) return res.status(400).json({ message: 'Tanggal wajib diisi' });
    if (!items?.length) return res.status(400).json({ message: 'Items tidak boleh kosong' });

    // ── Validasi role ─────────────────────────────────────────────
    if (!['pemilik', 'penjaga_booth'].includes(role)) {
      return res.status(403).json({ message: 'Tidak memiliki akses' });
    }

    // ── Tentukan loc_id & type dari role ──────────────────────────
    let loc_id, type;

    if (role === 'pemilik') {
      const [warehouse] = await db.query(
        `SELECT id FROM stock_locations WHERE type = 'warehouse' LIMIT 1`
      );
      if (!warehouse.length) {
        return res.status(500).json({ message: 'Gudang pusat belum di-setup' });
      }
      loc_id = warehouse[0].id;
      type = 'warehouse';

    } else {
      if (!location_id) {
        return res.status(403).json({
          message: 'Kamu tidak memiliki jadwal jaga aktif'
        });
      }
      loc_id = location_id;
      type = 'booth';
      console.log('type purchase:', type);
      console.log('location id:', loc_id);

    }

    // ── Validasi tiap item ────────────────────────────────────────
    for (const item of items) {
      if (!item.item_id) {
        return res.status(400).json({ message: 'item_id wajib diisi' });
      }
      if (!item.buy_qty || item.buy_qty <= 0) {
        return res.status(400).json({ message: `buy_qty item ${item.item_id} tidak valid` });
      }
      if (!item.unit_price || item.unit_price <= 0) {
        return res.status(400).json({ message: `unit_price item ${item.item_id} tidak valid` });
      }
    }

    const result = await purchaseModel.create({
      supplier, loc_id, created_by, type, date, items
    });

    res.status(201).json({
      message: 'Purchase berhasil dibuat',
      purchase_id: result.purchase_id,
      total: result.total,
    });

  } catch (err) {
    console.error('[create purchase]', err);

    if (err.message.includes('belum di-setup')) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// ─────────────────────────────────────────────
// CANCEL PURCHASE
// PATCH /api/purchase/:id/cancel
// Hanya pemilik yang boleh cancel
// ─────────────────────────────────────────────
const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: cancelled_by, role } = req.user;

    if (role !== 'pemilik') {
      return res.status(403).json({ message: 'Hanya pemilik yang bisa membatalkan purchase' });
    }

    await purchaseModel.cancel(id, cancelled_by);

    res.json({ message: `Purchase #${id} berhasil dibatalkan` });

  } catch (err) {
    console.error('[cancel purchase]', err);

    if (
      err.message.includes('tidak ditemukan') ||
      err.message.includes('sudah dibatalkan') ||
      err.message.includes('tidak mencukupi')
    ) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// ─────────────────────────────────────────────
// GET ALL PURCHASES
// GET /api/purchase
// Query params: type, status, start_date, end_date, limit, offset
// ─────────────────────────────────────────────
const getAll = async (req, res) => {
  const location_id = req.user.location_id ?? null;

  try {
    const { type, status, start_date, end_date, limit, offset } = req.query;

    const result = await purchaseModel.getAll({
      location_id, type, status, start_date, end_date, limit, offset
    });

    res.json({
      data: result.data,
      total_count: result.total_count,
    });

  } catch (err) {
    console.error('[getAll purchase]', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const getByLoc = async (req, res) => {
  try {
    const location_id = req.user.location_id ?? null;
    const { type, status, start_date, end_date, limit, offset } = req.query;

    const result = await purchaseModel.getByLoc({
      location_id, type, status, start_date, end_date, limit, offset
    });

    res.json({
      data: result.data,
      total_count: result.total_count,
    });

  } catch (err) {
    console.error('[getAll purchase]', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// ─────────────────────────────────────────────
// GET PURCHASE BY ID
// GET /api/purchase/:id
// ─────────────────────────────────────────────
const getById = async (req, res) => {
  try {
    const purchase = await purchaseModel.getById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase tidak ditemukan' });
    }

    res.json(purchase);

  } catch (err) {
    console.error('[getById purchase]', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

module.exports = { create, cancel, getAll, getById, getByLoc };