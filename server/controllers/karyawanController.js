const Karyawan = require('../models/karyawanModel');
const response = require('../helpers/response');
const bcrypt = require('bcryptjs');

const getAllKaryawan = async (req, res) => {
    try {
        const data = await Karyawan.getAll();
        response(200, data, 'Berhasil mengambil data Karyawan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getAllKaryawanwithJadwal = async (req, res) => {
    try {
        const data = await Karyawan.getAllwithJadwal();
        response(200, data, 'Berhasil mengambil data Karyawan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getKurir = async (req, res) => {
    try {
        const data = await Karyawan.getKurir();
        response(200, data, 'Berhasil mengambil data Kurir', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const getPenjaga = async (req, res) => {
    try {
        const data = await Karyawan.getPenjaga();
        response(200, data, 'Berhasil mengambil data penjaga booth', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
const createKaryawan = async (req, res) => {
    try {
        // hashing password sebelum disimpan ke database
        const passwordd = req.body.no_hp;
        // passwordkamu123
        const hashedPassword = await bcrypt.hash(passwordd, 10);
        const karyawanData = { ...req.body, password: hashedPassword, username: req.body.no_hp, is_active: 1 };
        console.log(karyawanData);

        // memanggil model untuk menyimpan data karyawan
        const result = await Karyawan.create(karyawanData);

        // memisahkan password dari objek karyawanData
        const { password, ...dataResponse } = result;

        // Ini membuat objek baru — menggabungkan id dari hasil insert database + semua isi dataResponse
        const data = { ...dataResponse };
        response(200, data, 'Karyawan berhasil ditambahkan', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const updateKaryawan = async (req, res) => {

    try {
        const { id } = req.params;

        // Hash password kalau dikirim
        let karyawanData = { ...req.body };
        if (req.body.password) {
            karyawanData.password = await bcrypt.hash(req.body.password, 10);
        }

        const result = await Karyawan.update(id, karyawanData);

        if (result.affectedRows === 0) {
            return response(404, null, 'Karyawan tidak ditemukan', res);
        }

        const { password, ...dataResponse } = karyawanData;
        response(200, { id, ...dataResponse }, 'Karyawan berhasil diupdate', res);

    } catch (err) {
        response(500, null, err.message, res);
    }
};

const deleteKaryawan = async (req, res) => {
    try {
        await Karyawan.remove(req.params.id);
        response(200, null, 'Karyawan berhasil dihapus', res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};

const statusKaryawan = async (req, res) => {
    try {
        // const locationId = req.user.location_id ?? null;
        const isActive = req.body.is_active ?? 0; // 0 = nonaktif, 1 = aktifkan

        await Karyawan.statusChange(req.params.id, isActive);

        const msg = isActive ? 'Karyawan berhasil diaktifkan' : 'Karyawan berhasil dinonaktifkan';
        response(200, null, msg, res);
    } catch (err) {
        response(500, null, err.message, res);
    }
};
module.exports = { getAllKaryawan, createKaryawan, updateKaryawan, deleteKaryawan, statusKaryawan, getKurir, getPenjaga, getAllKaryawanwithJadwal };