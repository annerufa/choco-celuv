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
    // 'Stok Kritis': 'warning',
    'Nonaktif': 'danger',
};

const kategoriVariant = {
    'Bahan Baku': 'warning',
    'Hasil Mixing': 'accent',
    'Packaging': 'warning',
    'Lainnya': 'brown',
};


function getToken() {
    return localStorage.getItem('token');
}

export default function KaryawanTable({ karyawanList, setkaryawanList, loading, error }) {
    // const { user } = useAuth();
    const navigate = useNavigate();

    const [isTambahOpen, setIsTambahOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset halaman saat search berubah
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // ── Filter & Pagination ───────────────────────────────────
    const filtered = karyawanList.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log(karyawanList);


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

    // Tambah karyawan baru — hit API

    function handleTambahKaryawan(newKaryawan) {
        // newItem sudah berupa object hasil API
        setKaryawanList(prev => [{
            ...newKaryawan,
            stok_sekarang: 0,
            min: 0,
            max: 0,
            stok_status: 'Kritis',
            status_label: 'Aktif',
        }, ...prev]);
        toast.success(`${newKaryawan.name} berhasil ditambahkan!`);
        toast.error('Gagal menambahkan karyawan');
    }

    // Buka modal edit
    function handleOpenEdit(item) {
        setSelectedItem(item);
        setIsEditOpen(true);
    }

    // Submit edit — hit API
    async function handleEditKaryawan(id, formData) {
        try {
            const res = await fetch(`${BASE_URL}/karyawan/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Gagal mengupdate barang');

            const updated = json.payload?.data ?? json;
            setBarangList(prev => prev.map(b =>
                b.id === id
                    ? { ...b, ...updated, status_label: updated.is_active ? 'Aktif' : 'Nonaktif' }
                    : b
            ));

            toast.success(`${updated.name} berhasil diupdate!`); // ← tambah ini

        } catch (err) {
            toast.error(err.message); // ← dan ini
        }
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
        navigate(`/karyawan/${item.id}`);
    }

    return (
        <>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Karyawan</span>
                    <div className={styles.cardActions}>

                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari karyawan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* <button className={styles.btnGhost}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filter
                        </button> */}

                        <button className={styles.btnPrimary} onClick={() => setIsTambahOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Karyawan
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Tugas</th>
                                <th>No HP</th>
                                <th>Tanggal Masuk</th>
                                {/* <th>Status Stok</th> */}
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--danger)' }}>Gagal memuat data karyawan</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Tidak ada karyawan ditemukan</td></tr>
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
                                            <td className={styles.monoCell}>{item.display_stok} {item.unit}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[stokStatusVariant[item.stok_status]]}`}>
                                                    {item.stok_status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[statusVariant[item.status_label]]}`}>
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
                                                    {item.is_active ? (
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
                        {filtered.length !== karyawanList.length && ` (difilter dari ${karyawanList.length} total)`}
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
                onSubmit={handleTambahKaryawan}
            />

            {/* Modal Edit */}
            <EditBarangModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleEditKaryawan}
                item={selectedItem}
            />
        </>
    );
}
