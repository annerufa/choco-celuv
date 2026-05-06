// src/components/BarangTable/BarangTable.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BarangTable.module.css';
import TambahBarangModal from './TambahBarangModal';
import EditBarangModal from './EditBarangModal';
import toast from 'react-hot-toast';
// import { useApi } from '../../hooks/useApi';
// import { useAuth } from '../../context/AuthContext'; // tambah ini

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 7;

const statusVariant = {
    'Aktif': 'success',
    'Stok Kritis': 'warning',
    'Nonaktif': 'grey',
};

const kategoriVariant = {
    'Bahan Baku': 'warning',
    'Hasil Mixing': 'accent',
    'Packaging': 'warning',
    'Lainnya': 'brown',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Menipis': 'warning',
    'Kritis': 'danger',
    'Habis': 'danger',
};

// function getStokStatus(stok, min, max) {
//     if (stok <= 0) return 'Habis';

//     // Threshold kritis: 40% dari batas min (sensitif visit rutin)
//     const criticalThreshold = min * 0.4;

//     if (stok <= criticalThreshold) return 'Kritis';
//     if (stok <= min) return 'Menipis';
//     if (stok > max) return 'Overstock';

//     return 'Aman';
// }
function getToken() {
    return localStorage.getItem('token');
}

export default function BarangTable({ barangList, setBarangList, loading, error }) {
    // const { user } = useAuth();
    const navigate = useNavigate();

    // const stokEndpoint = user?.location_id ? `/items?location_id=${user.location_id}` : null;
    // console.log("location id:", user.location_id);
    // console.log("stok endpoint:", stokEndpoint);
    // const { data: stokData, loading: loadingItems, error: errorItems } = useApi(stokEndpoint);

    // const loading = loading;
    // const error = error;

    const [isTambahOpen, setIsTambahOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    // const [barangList, setBarangList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStokStatus, setFilterStokStatus] = useState([]); // array of selected status
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // const [actionLoading, setActionLoading] = useState(null); // item id yang sedang diproses

    /// Proses data item + stok (tanpa merge manual)
    // useEffect(() => {
    //     if (!stokData) return;

    //     // Langsung ambil array dari response API
    //     const itemsWithStock = Array.isArray(stokData) ? stokData : (stokData.payload?.data ?? []);
    //     // Buat kamus konversi (bisa ditaruh di luar map agar lebih efisien)
    //     const unitMap = { ml: 'L', gram: 'kg' };

    //     const processed = itemsWithStock.map(item => {
    //         // Karena data sudah digabung dari backend, langsung ambil property-nya
    //         const stok_sekarang = parseFloat(item.current_stock ?? 0);
    //         const min = item.min_qty ?? 0;
    //         const max = item.max_qty ?? 0;

    //         return {
    //             ...item,
    //             // --- LOGIKA KONVERSI RINGKAS ---
    //             // Jika satuan ada di unitMap (ml/gram), bagi 1000. Jika tidak, biarkan.
    //             display_stok: unitMap[item.unit] ? stok_sekarang / 1000 : stok_sekarang,
    //             // Jika satuan ada di unitMap, ubah namanya (L/kg). Jika tidak, pakai aslinya.
    //             display_unit: unitMap[item.unit] || item.unit,
    //             // -------------------------------
    //             min,
    //             max,
    //             // Gunakan fungsi getStokStatus yang sudah kita buat
    //             stok_status: getStokStatus(stok_sekarang, min, max),
    //             status_label: item.is_active ? 'Aktif' : 'Nonaktif',
    //         };
    //     });

    //     setBarangList(processed);
    // }, [stokData]); // Hapus 'items' dari sini karena sudah tidak dipakai

    // Reset halaman saat search berubah
    // useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    // Reset halaman saat search atau filter berubah
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStokStatus]);
    // ── Filter & Pagination ───────────────────────────────────
    // const filtered = barangList.filter(b =>
    //     b.name.toLowerCase().includes(searchQuery.toLowerCase())
    // );
    const filtered = barangList.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStok = filterStokStatus.length === 0 || filterStokStatus.includes(b.stok_status);
        return matchSearch && matchStok;
    });

    const toggleFilterStok = (status) => {
        setFilterStokStatus(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
        .reduce((acc, page, i, arr) => {
            if (i > 0 && page - arr[i - 1] > 1) acc.push('...');
            acc.push(page);
            return acc;
        }, []);

    // ── Handlers ─────────────────────────────────────────────

    // Tambah barang baru — hit API

    function handleTambahBarang(newItem) {
        // newItem sudah berupa object hasil API
        setBarangList(prev => [{
            ...newItem,
            stok_sekarang: 0,
            // display_stok: 0,
            min: 0,
            max: 0,
            stock_active: true,
            stok_status: 'Habis',
            status_label: 'Aktif',
        }, ...prev]);
        toast.success(`${newItem.name} berhasil ditambahkan!`);
    }

    // Buka modal edit
    function handleOpenEdit(item) {
        setSelectedItem(item);
        setIsEditOpen(true);
    }

    // Submit edit — hit API
    function handleEditBarang(updatedItem) {
        setBarangList(prev => prev.map(item =>
            item.id === updatedItem.id
                ? { ...item, ...updatedItem } // ← merge, jadi min/max/stok tetap dari data lama
                : item
        ));
        toast.success(`${updatedItem.name} berhasil diperbarui!`);
    }

    // Nonaktifkan — hit API DELETE (soft delete)
    async function handleNonaktifkan(item) {
        if (!confirm(`Nonaktifkan "${item.name}"?`)) return;

        setActionLoading(item.id);
        try {
            const res = await fetch(`${BASE_URL}/items/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Gagal menonaktifkan barang');

            setBarangList(prev => prev.map(b =>
                b.id === item.id
                    ? { ...b, is_active: 0, status_label: 'Nonaktif' }
                    : b
            ));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    // Lihat detail — pindah halaman
    function handleDetail(item) {
        navigate(`/barang/${item.id}`);
    }

    return (
        <>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Barang — Gudang Pusat</span>
                    <div className={styles.cardActions}>

                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari barang..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* 
                        <button className={styles.btnGhost}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filter
                        </button> */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={styles.btnGhost}
                                onClick={() => setIsFilterOpen(prev => !prev)}
                                style={filterStokStatus.length > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                Filter
                                {filterStokStatus.length > 0 && (
                                    <span style={{
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        padding: '0 6px',
                                        marginLeft: '4px',
                                        lineHeight: '8px',
                                    }}>
                                        {filterStokStatus.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    background: 'var(--surface, #fff)',
                                    border: '1px solid var(--border, #e5e7eb)',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                                    padding: '12px',
                                    minWidth: '180px',
                                    zIndex: 100,
                                }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-400, #9ca3af)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Status Stok
                                    </p>
                                    {Object.keys(stokStatusVariant).map(status => (
                                        <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px' }}>
                                            <input
                                                type="checkbox"
                                                checked={filterStokStatus.includes(status)}
                                                onChange={() => toggleFilterStok(status)}
                                                style={{ accentColor: 'var(--accent)', width: '15px', height: '15px' }}
                                            />
                                            <span className={`${styles.pill} ${styles[stokStatusVariant[status]]}`} style={{ marginBottom: 0 }}>
                                                {status}
                                            </span>
                                        </label>
                                    ))}
                                    {filterStokStatus.length > 0 && (
                                        <button
                                            onClick={() => setFilterStokStatus([])}
                                            style={{ marginTop: '10px', width: '100%', fontSize: '12px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 4px' }}
                                        >
                                            ✕ Reset filter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className={styles.btnPrimary} onClick={() => setIsTambahOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Barang
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Kategori</th>
                                <th>Harga Terakhir</th>
                                <th>Stok</th>
                                <th>Status Stok</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--danger)' }}>Gagal memuat data barang</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Tidak ada barang ditemukan</td></tr>
                            ) : (
                                paginated.map((item, index) => {
                                    const nomor = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                    return (
                                        <tr key={item.id} style={{ opacity: loading === item.id ? 0.5 : 1 }}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td className={styles.namaCell}>{item.name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[kategoriVariant[item.category] ?? 'brown']}`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>
                                                {item.last_price
                                                    ? `Rp ${Number(item.last_price).toLocaleString('id')} / ${item.unit}`
                                                    : '-'}
                                            </td>
                                            <td className={styles.monoCell}>{item.display_stok} {item.display_unit}</td>

                                            <td>
                                                <span className={`${styles.pill} ${styles[item.stock_active ? stokStatusVariant[item.stok_status] : 'grey']}`}>
                                                    {item.stock_active ? item.stok_status : 'Nonaktif'}
                                                </span>
                                                {/* <span className={`${styles.pill} ${styles[stokStatusVariant[item.stok_status]]}`}>
                                                    {item.stok_status}
                                                </span> */}
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[item.stock_active ? statusVariant[item.status_label] : 'grey']}`}>
                                                    {item.status_label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    {/* Detail */}
                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Lihat detail"
                                                        onClick={() => handleDetail(item)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Edit barang"
                                                        onClick={() => handleOpenEdit(item)}
                                                        disabled={loading === item.id}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Nonaktifkan — sembunyikan kalau sudah nonaktif */}
                                                    {item.stock_active ? (
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.danger}`}
                                                            aria-label="Nonaktifkan"
                                                            onClick={() => handleNonaktifkan(item)}
                                                            disabled={loading === item.id}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span style={{ width: 28 }} /> // placeholder biar kolom tidak geser
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer pagination */}
                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} barang
                        {filtered.length !== barangList.length && ` (difilter dari ${barangList.length} total)`}
                    </span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Tambah */}
            <TambahBarangModal
                isOpen={isTambahOpen}
                onClose={() => setIsTambahOpen(false)}
                onSubmit={handleTambahBarang}
            />

            {/* Modal Edit */}
            <EditBarangModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleEditBarang}
                item={selectedItem}
            />
        </>
    );
}
