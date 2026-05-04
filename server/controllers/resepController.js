const Items = require('../models/resepModel');
const response = require('../helpers/response');

const getAllItems = async (req, res) => {
    try {
        const { location_id } = req.query;

        const data = location_id
            ? await Items.getAllPerLoc(location_id)
            : await Items.getAll();
        response(200, data, 'Berhasil mengambil data barang', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

module.exports = { getAllItems };