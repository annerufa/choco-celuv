// middleware/withUserLocation.js
const getUserLocation = require('../helpers/getUserLocation');

module.exports = async (req, res, next) => {
    const loc = await getUserLocation(req.user.id);
    if (!loc) return res.status(400).json({ message: 'Kamu belum punya jadwal aktif' });
    req.userLocation = loc; // { location_id, booth_id }
    next();
};