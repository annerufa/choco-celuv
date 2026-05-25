// src/components/Products/ProductsTable.jsx
import { useState } from 'react';
import styles from './ProductsTable.module.css';
import ProductModal from './ProductModal';
import ComponentsModal from './ComponentsModal';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }

const ITEMS_PER_PAGE = 10;
const sizeOrder = { kecil: 1, sedang: 2, jumbo: 3 };

export default function ProductsTable() {
    const [search, setSearch]             = useState('');
    const [currentPage, setCurrentPage]   = useState(1);
    const [modalMode, setModalMode]       = useState(null); // null | 'add' | 'edit'
    const [editTarget, setEditTarget]     = useState(null);
    const [compTarget, setCompTarget]     = useState(null); // produk yang dibuka komponennya
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const { data, loading, error, fetchData: refetch } = useApi('/products');
    const list = Array.isArray(data) ? data : [];

    const filtered = list.filter(p => {
        const q = search.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.recipe_name?.toLowerCase().includes(q) ||
            p.size?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    async function handleDelete(prod) {
        setActionLoading(prod.id);
        try {
            await axios.delete(`${BASE_URL}/products/${prod.id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            toast.success('Produk berhasil dihapus');
            setDeleteTarget(null);
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.payload?.message ?? 'Gagal menghapus');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleToggleActive(prod) {
        try {
            await axios.put(`${BASE_URL}/products/${prod.id}`,
                { is_active: prod.is_active ? 0 : 1 },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            toast.success(`Produk ${prod.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.payload?.message ?? 'Gagal update');
        }
    }

    return (
        <>
            <div className={styles.card}>
                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Produk</span>
                    <div className={styles.cardActions}>
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                placeholder="Cari produk atau resep..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button className={styles.btnPrimary} onClick={() => setModalMode('add')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Produk
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Produk</th>
                                <th>Resep</th>
                                <th>Ukuran</th>
                                <th>Harga</th>
                                <th>Adonan (ml)</th>
                                <th>Status</th>
                                <th>Komponen</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} className={styles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Tidak ada produk ditemukan</td></tr>
                            ) : paginated.map((p, i) => (
                                <tr key={p.id} style={{ opacity: actionLoading === p.id ? 0.5 : 1 }}>
                                    <td className={styles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                                    <td className={styles.namaCell}>{p.name}</td>
                                    <td>{p.recipe_name}</td>
                                    <td>
                                        <span className={`${styles.pill} ${styles[`size_${p.size}`]}`}>
                                            {p.size}
                                        </span>
                                    </td>
                                    <td className={styles.monoCell}>
                                        Rp {Number(p.price).toLocaleString('id')}
                                    </td>
                                    <td className={styles.monoCell}>{p.adonan_ml} ml</td>
                                    <td>
                                        <button
                                            className={`${styles.toggleBtn} ${p.is_active ? styles.toggleOn : styles.toggleOff}`}
                                            onClick={() => handleToggleActive(p)}
                                            title={p.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                                        >
                                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.compBtn}
                                            onClick={() => setCompTarget(p)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12">
                                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                            Kelola
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button
                                                className={styles.iconBtn}
                                                title="Edit"
                                                onClick={() => { setEditTarget(p); setModalMode('edit'); }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`${styles.iconBtn} ${styles.dangerBtn}`}
                                                title="Hapus"
                                                onClick={() => setDeleteTarget(p)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {filtered.length} produk</span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {pageNumbers.map((page, i) =>
                                page === '...' ? <span key={`e-${i}`} className={styles.pageEllipsis}>...</span> : (
                                    <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                                )
                            )}
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirm */}
            {deleteTarget && (
                <div className={styles.backdrop} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmIcon} style={{ background: '#FEE2E2', color: 'var(--danger)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                        </div>
                        <div className={styles.confirmTitle}>Hapus Produk?</div>
                        <div className={styles.confirmDesc}>
                            <strong>{deleteTarget.name}</strong> ({deleteTarget.size}) dan semua komponennya akan dihapus permanen.
                        </div>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnGhost} onClick={() => setDeleteTarget(null)} disabled={!!actionLoading}>Batal</button>
                            <button className={styles.btnDanger} onClick={() => handleDelete(deleteTarget)} disabled={!!actionLoading}>
                                {actionLoading === deleteTarget.id ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal (add/edit) */}
            {modalMode && (
                <ProductModal
                    mode={modalMode}
                    produk={editTarget}
                    onClose={() => { setModalMode(null); setEditTarget(null); }}
                    onSuccess={() => { refetch(); toast.success(modalMode === 'add' ? 'Produk berhasil dibuat!' : 'Produk berhasil diperbarui!'); setModalMode(null); setEditTarget(null); }}
                />
            )}

            {/* Components Modal */}
            {compTarget && (
                <ComponentsModal
                    produk={compTarget}
                    onClose={() => setCompTarget(null)}
                />
            )}
        </>
    );
}
