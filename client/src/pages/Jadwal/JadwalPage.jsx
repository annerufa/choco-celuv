// src/pages/Jadwal/JadwalPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import styles from './JadwalPage.module.css';
import JadwalTable from '../../components/JadwalTable/JadwalTable';
import toast from 'react-hot-toast';


export default function JadwalPage() {
    const { user } = useAuth();
    const { data: jadwalList, loading, error, fetchData, createData, updateData,
        customUpdate, deleteData } = useApi('/schedules');

    // const [jadwalList, setJadwalList] = useState([]);

    // useEffect(() => {
    //     if (!scheduleData) return;
    //     const schedules = Array.isArray(scheduleData) ? scheduleData : (scheduleData.payload?.data ?? []);
    //     if (schedules.length > 0) {
    //         setJadwalList(schedules);
    //     }
    // }, [scheduleData]);

    // tambahjadwal baru
    const handleCreate = async (formData) => {
        await createData(formData);
        toast.success('Jadwal berhasil ditambahkan');
        await fetchData();
    }
    // const handleEdit = async (formData) => {
    //     await updateData(formData);
    //     toast.success('Jadwal berhasil diubah');
    //     await fetchData();
    // }
    const handleUpdate = async (id, formData) => {
        await updateData(`${id}`, formData); // customUpdate pakai PUT
        toast.success('Jadwal berhasil diupdate!');
        await fetchData();
    };

    // buat fungsi toggle:
    const handleToggleStatus = async (id, isActive) => {
        await customUpdate(`/${id}/status`, { is_active: isActive });
        await fetchData();
    };
    const handleDeactivate = async (id, newStatus) => {
        if (newStatus === 1) {
            await customUpdate(`/${id}/reactivate`, {});
        } else {
            await customUpdate(`/${id}/deactivate`, {});
        }
        await fetchData();
    };

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span>
                    ›
                    Jadwal Jaga
                </div>
                <h1 className={styles.pageTitle}>Jadwal Jaga</h1>
                <p className={styles.pageSubtitle}>Kelola jadwal jaga booth</p>
            </div>


            {/* Tabel */}
            <JadwalTable
                jadwalList={jadwalList}
                // setJadwalList={setJadwalList}
                loading={loading}
                error={error}
                // fetchData={fetchData}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDeactivate={handleDeactivate}
            />

        </div>
    );
}