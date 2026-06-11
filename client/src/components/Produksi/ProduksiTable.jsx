// src/components/Produksi/ProduksiTable.jsx
import { useState } from 'react';
import styles from './ProduksiTable.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TambahProduksiModal from './TambahProduksiModal';
import EditProduksiModal from './EditProduksiModal';
import DetailProduksiModal from './DetailProduksiModal';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 10;

const typeVariant = { mix: 'accent', adonan: 'warning' };
const typeLabel = { mix: 'Mixing', adonan: 'Adonan' };
function getToken() { return localStorage.getItem('token'); }

export default function ProduksiTable() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [detailTarget, setDetailTarget] = useState(null); // ← NEW
    const [actionLoading, setActionLoading] = useState(null);

    const { data, loading, error, fetchData: refetch } = useApi('/productions');
    const list = Array.isArray(data) ? data : [];

    // ── Filter ────────────────────────────────────────────────
    const filtered = list.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
            p.recipe_name?.toLowerCase().includes(q) ||
            p.created_by_name?.toLowerCase().includes(q) ||
            p.location_name?.toLowerCase().includes(q) ||
            p.output_item_name?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    // ── Delete ────────────────────────────────────────────────
    async function handleDelete(prod) {
        setActionLoading(prod.id);
        try {
            await axios.delete(`${BASE_URL}/productions/${prod.id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            toast.success('Produksi berhasil dihapus');
            setDeleteTarget(null);
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.payload?.message ?? 'Gagal menghapus');
        } finally {
            setActionLoading(null);
        }
    }

    // Lihat detail — pindah halaman
    function handleDetail(p) {
        navigate(`/produksi/${p.id}`);
    }
    return (
        <>
            <div className={styles.card}>
                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Produksi</span>
                    <div className={styles.cardActions}>
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari resep atau pembuat..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <button className={styles.btnPrimary} onClick={() => setIsAddOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Produksi
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Resep</th>
                                <th>Tipe</th>
                                <th>Output</th>
                                <th>Lokasi</th>
                                <th>Dibuat oleh</th>
                                <th>Jumlah</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} className={styles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Tidak ada produksi ditemukan</td></tr>
                            ) : paginated.map((p, i) => (
                                <tr key={p.id} style={{ opacity: actionLoading === p.id ? 0.5 : 1 }}>
                                    <td className={styles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className={styles.namaCell}>{p.recipe_name}</td>
                                    <td>
                                        <span className={`${styles.pill} ${styles[typeVariant[p.recipe_type] ?? 'grey']}`}>
                                            {typeLabel[p.recipe_type] ?? p.recipe_type}
                                        </span>
                                    </td>
                                    <td className={styles.monoCell}>
                                        {Number(p.output_qty) * p.qty} {p.output_unit ?? ''}
                                    </td>
                                    <td>{p.location_name ?? '-'}</td>
                                    <td>{p.created_by_name ?? '-'}</td>
                                    <td className={styles.monoCell}>{parseFloat(p.qty)}x</td>
                                    <td className={styles.monoCell}>{p.status ?? '-'}</td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            {/* ── Detail (NEW) ── */}
                                            <button
                                                className={styles.iconBtn}
                                                title="Lihat detail"
                                                // onClick={() => setDetailTarget(p)}
                                                onClick={() => handleDetail(p)}
                                                disabled={actionLoading === p.id}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                                                </svg>
                                            </button>
                                            {/* Edit */}
                                            {p.created_by_id === user.id && (
                                                <>
                                                    {/* Edit button */}
                                                    <button
                                                        className={styles.iconBtn}
                                                        title="Edit qty"
                                                        onClick={() => setEditTarget(p)}
                                                        disabled={actionLoading === p.id}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Delete button */}
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.dangerBtn}`}
                                                        title="Hapus"
                                                        onClick={() => setDeleteTarget(p)}
                                                        disabled={actionLoading === p.id}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                            <path d="M10 11v6M14 11v6" />
                                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} produksi
                        {filtered.length !== list.length && ` (difilter dari ${list.length} total)`}
                    </span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`e-${i}`} className={styles.pageEllipsis}>...</span>
                                ) : (
                                    <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`} onClick={() => setCurrentPage(page)}>
                                        {page}
                                    </button>
                                )
                            )}
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Confirm Delete Dialog ─────────────────────── */}
            {deleteTarget && (
                <div className={styles.backdrop} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmIcon} style={{ background: '#FEE2E2', color: 'var(--danger)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                        </div>
                        <div className={styles.confirmTitle}>Hapus Produksi?</div>
                        <div className={styles.confirmDesc}>
                            Stok bahan akan dikembalikan{deleteTarget.recipe_type === 'mix' ? ' dan stok output akan dikurangi' : ''}. Semua batch terkait juga akan dihapus. Tindakan ini tidak dapat diurungkan.
                        </div>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnGhost} onClick={() => setDeleteTarget(null)} disabled={!!actionLoading}>
                                Batal
                            </button>
                            <button
                                className={styles.btnDanger}
                                onClick={() => handleDelete(deleteTarget)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === deleteTarget.id ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modals ───────────────────────────────────── */}
            <TambahProduksiModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => { refetch(); toast.success('Produksi berhasil dibuat!'); }}
            />
            {editTarget && (
                <EditProduksiModal
                    produksi={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSuccess={() => { refetch(); toast.success('Produksi berhasil diperbarui!'); setEditTarget(null); }}
                />
            )}
            {/* ── Detail Modal (NEW) ── */}
            {detailTarget && (
                <DetailProduksiModal
                    produksi={detailTarget}
                    onClose={() => setDetailTarget(null)}
                />
            )}
        </>
    );
}