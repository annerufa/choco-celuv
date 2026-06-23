// src/hooks/useJadwalCheck.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}`;

const useJadwalCheck = () => {
    const [jadwalStatus, setJadwalStatus] = useState({
        loading: true,
        adaJadwal: null,
        jadwal: null,
    });

    const getToken = () => localStorage.getItem('token');
    const headers = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    });

    useEffect(() => {
        const cek = async () => {
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/schedules/checkJadwal`,  // ← fix: API_BASE_URL
                    { headers: headers() }                     // ← fix: headers()
                );
                const { adaJadwal, jadwal } = res.data.payload.data;
                setJadwalStatus({ loading: false, adaJadwal, jadwal });
            } catch {
                setJadwalStatus({ loading: false, adaJadwal: false, jadwal: null });
            }
        };
        cek();
    }, []);

    return jadwalStatus;
};

export default useJadwalCheck;