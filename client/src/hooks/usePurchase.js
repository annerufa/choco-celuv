import { useState, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function usePurchase() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getToken = () => localStorage.getItem('token');
    const headers = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    });

    const createPurchase = useCallback(async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                supplier: formData.supplier,
                date: formData.date,
                items: formData.items.map(i => ({
                    item_id: Number(i.item_id),
                    buy_qty: Number(i.buy_qty),
                    buy_unit: i.buy_unit || null,
                    unit_price: Number(i.unit_price),
                })),
            };
            const res = await axios.post(`${BASE_URL}/purchase`, payload, { headers: headers() });
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal membuat purchase';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const getAll = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${BASE_URL}/purchase`, {
                headers: headers(),
                params,
            });
            return res.data; // { data, total_count }
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal mengambil data purchase';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelPurchase = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.patch(`${BASE_URL}/purchase/${id}/cancel`, {}, { headers: headers() });
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal membatalkan purchase';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const getUnitConversions = useCallback(async (item_id) => {
        try {
            const res = await axios.get(`${BASE_URL}/items/conversions/${item_id}`, {
                headers: headers()
            });
            return res.data?.payload?.data ?? [];
        } catch {
            return [];
        }
    }, []);

    return { createPurchase, getAll, cancelPurchase, getUnitConversions, loading, error };
}