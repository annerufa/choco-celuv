// src/components/Distribusi/DistribusiTable.jsx
import { useState, useEffect } from 'react';
import styles from './DistribusiTable.module.css';
import TambahDistribusiModal from './TambahDistribusiModal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 10;

function getToken() { return localStorage.getItem('token'); }

const typeVariant = {
    'warehouse_to_booth': 'accent',
    'booth_to_booth': 'warning',
};

const typeLabel = {
    'warehouse_to_booth': 'Gudang → Booth',
    'booth_to_booth': 'Booth → Booth',
};

const statusVariant = {
    'draft': 'grey',
    'dikirim': 'warning',
    'sampai': 'warning',
    'sesuai': 'success',
    'kurang': 'danger',
};

export default function DistribusiTable() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [distribusiList, setDistribusiList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchDistribusi(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    async function fetchDistribusi() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/distribution`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const json = await res.json();

            if (!res.ok) throw new Error(json.payload?.message ?? json.message ?? 'Gagal memuat data');
            // response() helper-mu wrap data di payload.data
            setDistribusiList(json.payload?.data?.data ?? json.payload?.data ?? json.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Filter berdasarkan asal/tujuan/notes
    const filtered = distribusiList.filter(d => {
        const q = searchQuery.toLowerCase();
        return (
            d.from_location_name?.toLowerCase().includes(q) ||
            d.to_location_name?.toLowerCase().includes(q) ||
            d.notes?.toLowerCase().includes(q) ||
            d.created_by_name?.toLowerCase().includes(q)
        );
    });

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

    function handleSuccess() {
        fetchDistribusi();
        toast.success('Distribusi berhasil dibuat!');
    }
    // async function handleCancel(distribusi) {
    //     if (!window.confirm(`Batalkan distribusi ke "${distribusi.to_location_name}"?`)) return;
    //     setActionLoading(distribusi.id);
    //     try {
    //         const res = await fetch(`${BASE_URL}/distribusi/${distribusi.id}/cancel`, {
    //             method: 'PATCH',
    //             headers: { Authorization: `Bearer ${getToken()}` },
    //         });
    //         const json = await res.json();
    //         if (!res.ok) throw new Error(json.message ?? 'Gagal membatalkan');
    //         setDistribusiList(prev => prev.map(d =>
    //             d.id === distribusi.id ? { ...d, status: 'dibatalkan' } : d
    //         ));
    //         toast.success('Distribusi berhasil dibatalkan');
    //     } catch (err) {
    //         toast.error(err.message);
    //     } finally {
    //         setActionLoading(null);
    //     }
    // }

    return (
        <>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Distribusi</span>
                    <div className={styles.cardActions}>
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari lokasi atau pembuat..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Distribusi
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
                                <th>Tipe</th>
                                <th>Asal</th>
                                <th>Tujuan</th>
                                <th>Pembuat</th>
                                <th>Keterangan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Tidak ada distribusi ditemukan</td></tr>
                            ) : (
                                paginated.map((d, index) => {
                                    const nomor = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                    const bisaBatal = !['dibatalkan', 'diterima'].includes(d.status);
                                    return (
                                        <tr key={d.id} style={{ opacity: actionLoading === d.id ? 0.5 : 1 }}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td>{new Date(d.planned_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[typeVariant[d.type] ?? 'grey']}`}>
                                                    {typeLabel[d.type] ?? d.type}
                                                </span>
                                            </td>
                                            <td className={styles.namaCell}>{d.from_location_name ?? '-'}</td>
                                            <td className={styles.namaCell}>{d.to_location_name ?? '-'}</td>
                                            <td>{d.created_by_name ?? '-'}</td>
                                            <td className={styles.notesCell}>
                                                {d.notes ? (
                                                    <span title={d.notes}>{d.notes.length > 30 ? d.notes.slice(0, 30) + '…' : d.notes}</span>
                                                ) : <span style={{ color: 'var(--brown-300)' }}>-</span>}
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[statusVariant[d.status] ?? 'grey']}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Lihat detail"
                                                        onClick={() => navigate(`/distribusi/${d.id}`)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>

                                                    {/* {bisaBatal ? (
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.danger}`}
                                                            aria-label="Batalkan"
                                                            onClick={() => handleCancel(d)}
                                                            disabled={actionLoading === d.id}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span style={{ width: 28 }} />
                                                    )} */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} distribusi
                        {filtered.length !== distribusiList.length && ` (difilter dari ${distribusiList.length} total)`}
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

            <TambahDistribusiModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                userLocationId={user?.location_id}
            />
        </>
    );
}