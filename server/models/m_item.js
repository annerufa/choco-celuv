const db = require("../connection");

const Item = {
    getAll: (callback) => {
        const sql = "SELECT * FROM items";
        db.query(sql, callback);
    }
};

module.exports = Item;