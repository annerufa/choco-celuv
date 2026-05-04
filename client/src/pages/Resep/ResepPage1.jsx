// src/pages/Resep/ResepPage.jsx
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import styles from './ResepPage.module.css';
import ResepList from '../../components/ResepList/ResepList';


// ── Dummy data ─────────────────────────────────────────────────
// Stok barang (nanti dari useApi('/items?location_id=...'))
const DUMMY_STOK = [
    { id: 1, name: 'Bubuk Coklat Mixing', unit: 'gram', current_stock: 4200, min_qty: 500, max_qty: 10000 },
    { id: 2, name: 'Susu Diamond Full Cream', unit: 'ml', current_stock: 18500, min_qty: 2000, max_qty: 30000 },
    { id: 3, name: 'Air', unit: 'gram', current_stock: 620, min_qty: 1000, max_qty: 10000 },
    { id: 4, name: 'Es Batu', unit: 'gram', current_stock: 50000, min_qty: 5000, max_qty: 80000 },
    { id: 5, name: 'Perisa Vanilla', unit: 'ml', current_stock: 250, min_qty: 100, max_qty: 500 },
    { id: 6, name: 'Sirup Coklat', unit: 'ml', current_stock: 1800, min_qty: 500, max_qty: 3000 },
    { id: 7, name: 'Bubuk Matcha', unit: 'gram', current_stock: 2100, min_qty: 300, max_qty: 5000 },
    { id: 8, name: 'Tepung Terigu', unit: 'gram', current_stock: 1100, min_qty: 2000, max_qty: 20000 },
    { id: 9, name: 'Telur Ayam', unit: 'butir', current_stock: 48, min_qty: 10, max_qty: 100 },
    { id: 10, name: 'Mentega', unit: 'gram', current_stock: 80, min_qty: 200, max_qty: 3000 },
    { id: 11, name: 'Garam', unit: 'gram', current_stock: 500, min_qty: 50, max_qty: 1000 },
    { id: 12, name: 'Bubuk Coklat Putih', unit: 'gram', current_stock: 1800, min_qty: 300, max_qty: 5000 },
];

// Resep (nanti dari useApi('/recipes'))
// bahan: [{ item_id, qty_per_unit, unit }]  unit = 'porsi' | 'batch'
const DUMMY_RESEP = [
    {
        id: 1,
        nama: 'Choco Celuv Original',
        tipe: 'mixing',
        deskripsi: 'Minuman coklat celup — varian utama',
        unit_label: 'porsi',
        is_active: true,
        bahan: [
            { item_id: 1, qty_per_unit: 30 },
            { item_id: 2, qty_per_unit: 200 },
            { item_id: 3, qty_per_unit: 15 },
            { item_id: 4, qty_per_unit: 100 },
            { item_id: 5, qty_per_unit: 3 },
            { item_id: 6, qty_per_unit: 10 },
        ],
        last_made: '2025-05-01T08:00:00Z',
    },
    {
        id: 2,
        nama: 'Adonan Stick Celup',
        tipe: 'adonan',
        deskripsi: 'Stick berbasis tepung untuk pencelup',
        unit_label: 'batch',
        is_active: true,
        bahan: [
            { item_id: 8, qty_per_unit: 500 },
            { item_id: 9, qty_per_unit: 2 },
            { item_id: 10, qty_per_unit: 100 },
            { item_id: 11, qty_per_unit: 5 },
            { item_id: 3, qty_per_unit: 20 },
        ],
        last_made: '2025-04-30T14:00:00Z',
    },
    {
        id: 3,
        nama: 'Choco Celuv Matcha',
        tipe: 'mixing',
        deskripsi: 'Varian matcha premium',
        unit_label: 'porsi',
        is_active: true,
        bahan: [
            { item_id: 7, qty_per_unit: 20 },
            { item_id: 2, qty_per_unit: 200 },
            { item_id: 3, qty_per_unit: 10 },
            { item_id: 4, qty_per_unit: 100 },
            { item_id: 5, qty_per_unit: 3 },
        ],
        last_made: '2025-05-01T07:00:00Z',
    },
    {
        id: 4,
        nama: 'Choco Celuv White',
        tipe: 'mixing',
        deskripsi: 'Varian coklat putih',
        unit_label: 'porsi',
        is_active: true,
        bahan: [
            { item_id: 12, qty_per_unit: 30 },
            { item_id: 2, qty_per_unit: 200 },
            { item_id: 3, qty_per_unit: 15 },
            { item_id: 4, qty_per_unit: 100 },
            { item_id: 5, qty_per_unit: 3 },
        ],
        last_made: '2025-04-29T09:00:00Z',
    },
    {
        id: 5,
        nama: 'Adonan Waffle Mini',
        tipe: 'adonan',
        deskripsi: 'Adonan waffle ukuran mini',
        unit_label: 'batch',
        is_active: true,
        bahan: [
            { item_id: 8, qty_per_unit: 300 },
            { item_id: 9, qty_per_unit: 3 },
            { item_id: 10, qty_per_unit: 80 },
            { item_id: 2, qty_per_unit: 100 },
            { item_id: 3, qty_per_unit: 30 },
        ],
        last_made: '2025-04-28T10:00:00Z',
    },
];

// ── Helper: hitung kapasitas produksi dari stok ────────────────
// ── Helper: hitung kapasitas produksi dari stok ────────────────
export function hitungKapasitas(resep, stokMap) {
    if (!resep.bahan?.length) return { maks: 0, bottleneck: null };
    let maks = Infinity;
    let bottleneck = null;
    resep.bahan.forEach(b => {
        const stok = stokMap[b.item_id]?.current_stock ?? 0;
        const cap = b.qty_per_unit > 0 ? Math.floor(stok / b.qty_per_unit) : Infinity;
        if (cap < maks) {
            maks = cap;
            bottleneck = b.item_id;
        }
    });
    return { maks: maks === Infinity ? 0 : maks, bottleneck };
}

export default function ResepPage() {
    // const { user } = useAuth();
    // const { data: stokData }  = useApi(user?.location_id ? `/items?location_id=${user.location_id}` : null);
    // const { data: resepData, loading, error, createData, updateData, deleteData } = useApi('/recipes');

    const { user } = useAuth();

    // ── Ambil stok barang berdasarkan lokasi user ──────────────
    const stokEndpoint = user?.location_id ? `/items?location_id=${user.location_id}` : null;

    const {
        data: stokData,
        loading: stokLoading,
        error: stokError,
    } = useApi(stokEndpoint);

    // ── Ambil daftar resep ─────────────────────────────────────
    const {
        data: resepData,
        loading: resepLoading,
        error: resepError,
        createData,
        updateData,
        deleteData,
    } = useApi('/recipes');

    const stokList = stokData ?? [];
    const resepList = resepData ?? [];

    const loading = stokLoading || resepLoading;
    const error = stokError || resepError;

    // stok map: { item_id: stokObject }
    const stokMap = useMemo(
        () => Object.fromEntries(stokList.map(s => [s.id, s])),
        [stokList]
    );

    // ── Stats ─────────────────────────────────────────────────
    const totalResep = resepList.length;
    const totalMixing = resepList.filter(r => r.tipe === 'mixing').length;
    const totalAdonan = resepList.filter(r => r.tipe === 'adonan').length;

    // Hitung bahan menipis unik di semua resep aktif
    const bahanMenipis = new Set(
        resepList.flatMap(r =>
            r.bahan
                .filter(b => {
                    const s = stokMap[b.item_id];
                    return s && s.current_stock <= s.min_qty;
                })
                .map(b => b.item_id)
        )
    ).size;

    const stats = [
        { value: totalResep, label: 'Total Resep' },
        { value: totalMixing, label: 'Resep Mixing' },
        { value: totalAdonan, label: 'Resep Adonan' },
        { value: bahanMenipis, label: 'Bahan Stok Menipis', warn: bahanMenipis > 0 },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span> › Resep
                </div>
                <h1 className={styles.pageTitle}>Manajemen Resep</h1>
                <p className={styles.pageSubtitle}>Kelola resep mixing & adonan yang terhubung ke stok barang</p>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                {stats.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={`${styles.statVal} ${s.warn ? styles.statWarn : ''}`}>{s.value}</div>
                        <div className={styles.statLbl}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Resep List */}
            <ResepList
                resepList={resepList}
                setResepList={setResepList}
                stokMap={stokMap}
                stokList={stokList}
                loading={loading}
                error={error}
                hitungKapasitas={hitungKapasitas}
            />
        </div>
    );
}
