// pages/RekapAbsensiPage.jsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import AbsensiHariIni from '../components/AbsensiTable/AbsensiHariIni';
import AbsensiRekap from '../components/AbsensiTable/AbsensiRekap';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function authApi() {
    return axios.create({
        baseURL: API,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
}

export default function RekapAbsensiPage() {
    const [activeTab, setActiveTab] = useState('hari-ini');

    // Tab Hari Ini — data absensi hari ini + karyawan belum absen
    const {
        data: hariIniList,
        loading: loadingHariIni,
        error: errorHariIni,
        fetchData: refetchHariIni,
    } = useApi('/attendance/today-owner');

    // Handler ubah status (izin/sakit/libur) untuk yang belum absen
    const handleUbahStatus = async (employeeId, boothId, scheduleId, shift, status, notes) => {
        try {
            await authApi().post('/attendance/manual', {
                employee_id: employeeId,
                booth_id: boothId,
                schedule_id: scheduleId,
                shift,
                status,
                notes,
            });
            toast.success(`Status berhasil diubah ke ${status}`);
            await refetchHariIni();
        } catch (err) {
            toast.error(err.response?.data?.payload?.message || 'Gagal mengubah status');
            throw err;
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 20,
                background: '#fff',
                border: '1px solid var(--brown-100)',
                borderRadius: 10,
                padding: 4,
                width: 'fit-content',
            }}>
                {[
                    { key: 'hari-ini', label: 'Hari Ini' },
                    { key: 'rekap', label: 'Rekap' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '7px 20px',
                            borderRadius: 7,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--font)',
                            transition: 'all 0.15s',
                            background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                            color: activeTab === tab.key ? '#fff' : 'var(--brown-500)',
                            boxShadow: activeTab === tab.key ? '0 2px 6px rgba(212,80,10,.25)' : 'none',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'hari-ini' && (
                <AbsensiHariIni
                    data={hariIniList}
                    loading={loadingHariIni}
                    error={errorHariIni}
                    onUbahStatus={handleUbahStatus}
                />
            )}

            {activeTab === 'rekap' && (
                <AbsensiRekap />
            )}
        </div>
    );
}
