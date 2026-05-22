import { useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import styles from './ResepPage.module.css';
import ResepList from '../../components/ResepList/ResepList';

export default function ResepPage() {
    const {
        data: resepData,
        loading,
        error,
        createData,
        updateData,
        customUpdate,
        deleteData,
    } = useApi('/recipes');

    const {
        data: itemData,
        loading: itemLoading,
    } = useApi('/items'); // ← sesuaikan endpoint-nya

    const resepList = Array.isArray(resepData)
        ? resepData
        : (resepData?.data ?? []);

    const itemList = Array.isArray(itemData)
        ? itemData
        : (itemData?.data ?? []);

    const totalResep = resepList.length;
    const totalMixing = resepList.filter(r => r.tipe === 'mixing' && r.tipe !== 'arsip').length;
    const totalAdonan = resepList.filter(r => r.tipe === 'adonan').length;
    // console.log({ loading, error, resepList });
    const stats = [
        { value: totalResep, label: 'Total Resep' },
        { value: totalMixing, label: 'Resep Mixing' },
        { value: totalAdonan, label: 'Resep Adonan' },
    ];
    // buat fungsi toggle:
    const handleToggleStatus = async (id, isActive) => {
        await customUpdate(`/${id}/status`, { is_active: isActive });
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span> › Resep
                </div>
                <h1 className={styles.pageTitle}>Manajemen Resep</h1>
                <p className={styles.pageSubtitle}>
                    Kelola resep mixing & adonan
                </p>
            </div>

            {/* <div className={styles.statsRow}>
                {stats.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statVal}>{s.value}</div>
                        <div className={styles.statLbl}>{s.label}</div>
                    </div>
                ))}
            </div> */}

            <ResepList
                resepList={resepList}
                loading={loading}
                error={error}
                itemList={itemList}
                onCreate={createData}
                onUpdate={updateData}
                onDelete={deleteData}
                onToggleStatus={handleToggleStatus}
            />
        </div>
    );
}