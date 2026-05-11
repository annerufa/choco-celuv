require('dotenv').config(); // ← baris paling atas
const express = require("express");
const cors = require("cors"); // Tambahkan ini agar bisa diakses React
const app = express();
const port = 3001;
const authenticate = require('./middleware/authenticate');


// Middleware
app.use(cors());           // Izinkan akses dari frontend (Vite)
app.use(express.json());   // Pengganti body-parser.json()

app.get("/", (req, res) => {
    response(200, "API Ready", "Success", res);
});

// login
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/products', authenticate, require('./routes/products')); // proteksi
// app.use('/api/products', require('./routes/products'));

// Route untuk mengambil data barang
app.use("/api/items", authenticate, require("./routes/items"));
app.use("/api/booth", require("./routes/booth"));
app.use("/api/resep", require("./routes/resep"));
// app.use("/api/stock-per-location", require("./routes/stockLoc"));
// app.use('/api/stock/matrix', require('./routes/items'));

// http://localhost:3001/api/stock-per-location?location_id=1

app.use('/api/karyawan', require('./routes/karyawan')); //
app.use('/api/purchase', authenticate, require('./routes/purchase'));
app.use('/api/distribution', authenticate, require('./routes/distribution'));
// app.use('/api/karyawan', require('./routes/karyawan'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
