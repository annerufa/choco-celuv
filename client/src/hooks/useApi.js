// hooks/useApi.js
import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}`;

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
// ✅ Definisikan reducer di luar
const initialState = {
    data: [],
    loading: false,
    error: null,
    message: '',
    metadata: { prev: null, next: null, current: null }
};

function apiReducer(state, action) {
    switch (action.type) {
        case 'LOADING':
            return { ...state, loading: true, error: null };
        case 'SUCCESS':
            return {
                ...state,
                loading: false,
                data: action.data,
                message: action.message,
                metadata: action.metadata
            };
        case 'ERROR':
            return { ...state, loading: false, error: action.error, data: [] };
        default:
            return state;
    }
}

export function useApi(endpoint) {
    // ✅ useReducer di top level
    const [state, dispatch] = useReducer(apiReducer, initialState);

    const fetchData = useCallback(async (params = '') => {
        if (!endpoint) return;

        dispatch({ type: 'LOADING' }); // 1 dispatch = 1 re-render

        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}${params}`);
            const { payload, metadata: meta } = response.data;

            dispatch({             // 1 dispatch = 1 re-render
                type: 'SUCCESS',
                data: payload.data ?? [],
                message: payload.message || 'Success',
                metadata: meta ?? { prev: null, next: null, current: null }
            });

        } catch (err) {
            dispatch({             // 1 dispatch = 1 re-render
                type: 'ERROR',
                error: err.response?.data?.payload?.message || err.message
            });
        }
    }, [endpoint]);


    const createData = async (newData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${endpoint}`, newData);
            const { payload } = response.data;
            if (payload.data) {
                dispatch({ type: 'SUCCESS', data: [...state.data, payload.data], message: payload.message, metadata: state.metadata });
                await fetchData();
                return payload.data;
            }
        } catch (err) {
            dispatch({ type: 'ERROR', error: err.response?.data?.payload?.message || err.message });
            throw err;
        }
    };

    const updateData = async (id, updatedData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}${endpoint}/${id}`, updatedData);
            const { payload } = response.data;
            await fetchData(); // ← re-fetch
            return payload.data;
        } catch (err) {
            dispatch({ type: 'ERROR', error: err.response?.data?.payload?.message || err.message });
            throw err;
        }
    };

    const deleteData = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}${endpoint}/${id}`);
            await fetchData(); // ← re-fetch
        } catch (err) {
            dispatch({ type: 'ERROR', error: err.response?.data?.payload?.message || err.message });
            throw err;
        }
    };
    const customUpdate = async (subPath, data) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}${endpoint}${subPath}`, data);
            const { payload } = response.data;
            await fetchData();
            return payload.data;
        } catch (err) {
            dispatch({ type: 'ERROR', error: err.response?.data?.payload?.message || err.message });
            throw err;
        }
    };

    const hasFetched = useRef(false);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ Spread state agar cara pakainya sama seperti sebelumnya
    return {
        ...state,
        fetchData,
        createData,  // fungsi lainnya tetap sama
        updateData,
        customUpdate,
        deleteData
    };
}