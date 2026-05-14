

import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/items`;

// Ambil semua produk, return payload.data langsung
export const getAllItems = async () => {
    const res = await axios.get(BASE);
    return res.data.payload.data;
};

export const createItems = async (data) => {
    const res = await axios.post(BASE, data);
    return res.data.payload.data;
};

export const updateItems = async (id, data) => {
    const res = await axios.put(`${BASE}/${id}`, data);
    return res.data;
};

export const deleteItems = async (id) => {
    const res = await axios.delete(`${BASE}/${id}`);
    return res.data;
};
