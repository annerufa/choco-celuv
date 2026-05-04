import axios from 'axios';

const BASE = 'http://localhost:3001/api/products';

// Ambil semua produk, return payload.data langsung
export const getProducts = async () => {
  const res = await axios.get(BASE);
  return res.data.payload.data;
};

export const createProduct = async (data) => {
  const res = await axios.post(BASE, data);
  return res.data.payload.data;
};

export const updateProduct = async (id, data) => {
  const res = await axios.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await axios.delete(`${BASE}/${id}`);
  return res.data;
};
