// src/components/BarangTable/BarangTable.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BarangTable.module.css';
import TambahBarangModal from './TambahBarangModal';
import EditBarangModal from './EditBarangModal';
import ConfirmModal from '../Shared/ConfirmModal';
import toast from 'react-hot-toast';
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 7;

const statusVariant = {
    'Aktif': 'success',
    'Stok Kritis': 'warning',
    'Nonaktif': 'grey',
};

const kategoriVariant = {
    'Bahan Baku': 'warning',
    'Mixing': 'accent',
    'Packaging': 'warning',
    'Lainnya': 'brown',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Menipis': 'warning',
    'Kritis': 'danger',
    'Habis': 'danger',
    'Nonaktif': 'grey',
};


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
    const [actionLoading, setActionLoading] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null });


    // Reset halaman saat search atau filter berubah
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStokStatus]);

    // ── Filter & Pagination ───────────────────────────────────
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

    // Tambah barang baru — hit API, lalu update state dengan response dari API (yang sudah lengkap dengan stok dan konversi)
    async function handleTambahBarang(formData) {
        setModalLoading(true);
        setModalError(null);

        try {
            const res = await fetch(`${BASE_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? json.message ?? 'Gagal menambahkan barang');

            const newItem = json.payload?.data ?? json;
            if (!newItem) throw new Error('Response API tidak mengandung data barang baru');

            // newItem sudah berupa object hasil API
            const unitMap = { ml: 'L', gram: 'kg' };
            setBarangList(prev => [{
                ...newItem,
                stok_sekarang: 0,
                current_stock: 0,
                display_stok: 0,
                display_unit: unitMap[newItem.unit] || newItem.unit,
                display_last_price: 0,
                min: 0,
                max: 0,
                stock_active: true,
                stok_status: 'Habis',
                status_label: 'Aktif',
            }, ...prev]);
            toast.success(`${newItem.name} berhasil ditambahkan!`);
            setIsTambahOpen(false);
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    }

    // Buka modal edit
    function handleOpenEdit(item) {
        setSelectedItem(item);
        setModalError(null);
        setIsEditOpen(true);
    }

    // Submit edit — hit API, lalu update state
    async function handleEditBarang(formData) {
        setModalLoading(true);
        setModalError(null);
        try {
            const res = await fetch(`${BASE_URL}/items/${selectedItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Gagal mengupdate barang');

            const updatedItem = { ...formData, id: selectedItem.id };
            setBarangList(prev => prev.map(item => {
                if (item.id !== updatedItem.id) return item;
                const unitMap = { ml: 'L', gram: 'kg' };
                const newUnit = updatedItem.unit ?? item.unit;
                return {
                    ...item,
                    ...updatedItem,
                    display_unit: unitMap[newUnit] || newUnit,
                    status_label: (updatedItem.is_active ?? item.is_active) ? 'Aktif' : 'Nonaktif',
                };
            }));
            toast.success(`${updatedItem.name} berhasil diperbarui!`);
            setIsEditOpen(false);
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    }

    // Nonaktifkan — hit API DELETE (soft delete)
    function handleToggleStatus(item) {
        setConfirmModal({ isOpen: true, item });
    }

    async function handleConfirmToggle() {
        const item = confirmModal.item;
        const newStatus = item.is_active ? 0 : 1;

        setActionLoading(item.id);
        try {
            const res = await fetch(`${BASE_URL}/items/${item.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ is_active: newStatus }),
            });

            if (!res.ok) throw new Error('Gagal mengupdate status');

            setBarangList(prev => prev.map(b =>
                b.id === item.id
                    ? { ...b, is_active: newStatus, status_label: newStatus ? 'Aktif' : 'Nonaktif' }
                    : b
            ));
            toast.success(`${item.name} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
            setConfirmModal({ isOpen: false, item: null });
        } catch (err) {
            toast.error(err.message);
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
                                        <tr key={item.id} style={{ opacity: actionLoading === item.id ? 0.5 : 1 }}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td className={styles.namaCell}>{item.name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[kategoriVariant[item.category] ?? 'brown']}`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>
                                                {item.display_last_price != null
                                                    ? `Rp ${Number(item.display_last_price).toLocaleString('id')} / ${item.display_unit}`
                                                    : '-'}
                                            </td>
                                            <td className={styles.monoCell}>{item.display_stok} {item.display_unit}</td>

                                            <td>
                                                <span className={`${styles.pill} ${styles[item.is_active ? stokStatusVariant[item.stok_status] : 'grey']}`}>
                                                    {item.is_active ? item.stok_status : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[item.is_active ? statusVariant[item.status_label] : 'grey']}`}>
                                                    {item.is_active ? item.status_label : 'Nonaktif'}
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
                                                        disabled={actionLoading === item.id}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Nonaktifkan */}

                                                    <button
                                                        className={`${styles.iconBtn} ${item.is_active ? styles.btnNonaktif : styles.btnAktifkan}`}
                                                        aria-label={item.is_active ? "Nonaktifkan barang" : "Aktifkan barang"}
                                                        onClick={() => handleToggleStatus(item)}
                                                        disabled={actionLoading === item.id}
                                                    >
                                                        {item.is_active ? (
                                                            // ikon slash/ban
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        ) : (
                                                            // ikon centang/check
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <span style={{ width: 28 }} />

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
                onClose={() => { setIsTambahOpen(false); setModalError(null); }}
                onSubmit={handleTambahBarang}
                loading={modalLoading}
                submitError={modalError}
                existingNames={barangList.map(b => b.name)}  // ← tambah ini
            />

            {/* Modal Edit */}
            <EditBarangModal
                isOpen={isEditOpen}
                onClose={() => { setIsEditOpen(false); setModalError(null); }}
                onSubmit={handleEditBarang}
                item={selectedItem}
                loading={modalLoading}
                submitError={modalError}
                existingNames={barangList.map(b => b.name)}  // ← tambah ini
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, item: null })}
                onConfirm={handleConfirmToggle}
                variant={confirmModal.item?.is_active ? 'danger' : 'success'}
                title={confirmModal.item?.is_active ? 'Nonaktifkan Barang?' : 'Aktifkan Barang?'}
                message={
                    confirmModal.item?.is_active
                        ? `"${confirmModal.item?.name}" tidak akan muncul dalam perhitungan stok.`
                        : `"${confirmModal.item?.name}" akan aktif kembali dan masuk perhitungan stok.`
                }
                confirmLabel={confirmModal.item?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                loading={actionLoading === confirmModal.item?.id}
            />
        </>
    );
}
