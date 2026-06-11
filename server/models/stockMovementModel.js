// stockMovementModel.js
const db = require('../connection');

const getByItemId = async (item_id, limit = 20, id_loc, date_from, date_to) => {
    const params = [item_id, id_loc];
    let dateFilter = '';

    if (date_from && date_to) {
        dateFilter = `AND DATE(sm.created_at) BETWEEN ? AND ?`;
        params.push(date_from, date_to);
    }

    const [rows] = await db.query(
        `SELECT 
            sm.*,
            sl.name AS location_name,
            CASE
                WHEN sm.source_type = 'PEMBELIAN'              THEN u_beli.name
                WHEN sm.source_type = 'PEMBATALAN PEMBELIAN'   THEN u_beli.name
                WHEN sm.source_type = 'DISTRIBUSI'             THEN u_dist.name
                WHEN sm.source_type = 'PEMBATALAN DISTRIBUSI'  THEN u_dist.name
                WHEN sm.source_type = 'PRODUKSI'               THEN u_prod.name
                WHEN sm.source_type = 'KOREKSI'                THEN u_kor.name
                ELSE NULL
            END AS created_by_name
        FROM stock_movements sm
        LEFT JOIN stock_locations sl ON sl.id = sm.location_id

        LEFT JOIN purchases p        ON sm.source_type IN ('PEMBELIAN', 'PEMBATALAN PEMBELIAN')
                                     AND p.id = sm.source_id
        LEFT JOIN users u_beli       ON u_beli.id = p.created_by

        LEFT JOIN distributions d    ON sm.source_type IN ('DISTRIBUSI', 'PEMBATALAN DISTRIBUSI')
                                     AND d.id = sm.source_id
        LEFT JOIN users u_dist       ON u_dist.id = d.created_by

        LEFT JOIN productions pr     ON sm.source_type = 'PRODUKSI'
                                     AND pr.id = sm.source_id
        LEFT JOIN users u_prod       ON u_prod.id = pr.created_by

        LEFT JOIN stock_corrections sc ON sm.source_type = 'KOREKSI'
                                       AND sc.id = sm.source_id
        LEFT JOIN users u_kor        ON u_kor.id = sc.created_by

        WHERE sm.item_id = ? AND sm.location_id = ?
        ${dateFilter}
        ORDER BY sm.created_at DESC
        LIMIT ?`,
        [...params, Number(limit)]
    );
    return rows;
};
module.exports = { getByItemId };