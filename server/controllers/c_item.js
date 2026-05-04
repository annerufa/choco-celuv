const Item = require("../models/m_item");
const response = require("../response");

const getItems = (req, res) => {
    Item.getAll((err, results) => {
        if (err) {
            response(500, "Error", err.message, res);
        } else {
            response(200, results, "Get all items success", res);
        }
    });
};

module.exports = { getItems };