// Buat helper function, panggil di awal setiap endpoint produksi
//expireBatches akan dijalankan setiap 1 menit sekali untuk memastikan batch yang sudah expired akan diupdate statusnya menjadi EXPIRED
const db = require('../connection');
const expireBatches = async () => {
    // Expire batch ACTIVE/FROZEN yang sudah lewat expired_at
    await db.query(`
        UPDATE batches
        SET status = 'EXPIRED'
        WHERE status IN ('ACTIVE', 'FROZEN')
          AND expired_at IS NOT NULL
          AND expired_at <= NOW()
    `);

    // Expire batch FROZEN yang sudah > 24 jam di freezer
    await db.query(`
        UPDATE batches
        SET status = 'EXPIRED'
        WHERE status = 'FROZEN'
          AND frozen_at IS NOT NULL
          AND frozen_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
};
module.exports = expireBatches;