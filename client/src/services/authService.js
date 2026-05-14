// src/services/authService.js
import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth`;

export const login = async (username, password) => {
    const res = await axios.post(`${BASE}/login`, { username, password });
    return res.data.payload.data; // { token, user }
};
