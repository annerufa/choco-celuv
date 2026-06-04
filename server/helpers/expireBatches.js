// Buat helper function, panggil di awal setiap endpoint produksi

const db = require('../connection');
const expireBatches = async () => {
    await db.query(`
        UPDATE production_batches
        SET status = 'EXPIRED'
        WHERE status = 'ACTIVE'
          AND expired_at IS NOT NULL
          AND expired_at <= NOW()
    `);
};