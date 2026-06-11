import { useState, useEffect } from 'react';
import styles from './PurchaseTable.module.css';
import TambahPurchaseModal from './TambahPurchaseModal';
import { usePurchase } from '../../hooks/usePurchase';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


const ITEMS_PER_PAGE = 10;

const typeVariant = {
    'warehouse': 'accent',
    'booth': 'warning',
};

const typeLabel = {
    'warehouse': 'Gudang Pusat',
    'booth': 'Booth',
};

const statusVariant = {
    'dikonfirmasi': 'success',
    'dibatalkan': 'danger',
};

export default function PurchaseTable() {
    const [purchaseList, setPurchaseList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const { getAll, cancelPurchase } = usePurchase();
    const { data: itemList } = useApi('/items/aktif');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Load data pembelian
    useEffect(() => {
        fetchPurchases();
    }, []);

    async function fetchPurchases() {
        setLoading(true);
        setError(null);
        try {
            const result = await getAll();
            setPurchaseList(result.data ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    // Filter berdasarkan supplier
    const filtered = purchaseList.filter(p =>
        p.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    function handleSuccess(newPurchase) {
        fetchPurchases(); // refresh dari server
        toast.success('Pembelian berhasil ditambahkan!');
    }

    async function handleCancel(purchase) {
        if (!window.confirm(`Batalkan pembelian dari "${purchase.supplier}"?`)) return;
        setActionLoading(purchase.id);
        try {
            await cancelPurchase(purchase.id);
            setPurchaseList(prev => prev.map(p =>
                p.id === purchase.id ? { ...p, status: 'dibatalkan' } : p
            ));
            toast.success('Pembelian berhasil dibatalkan');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Pembelian</span>
                    <div className={styles.cardActions}>
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari supplier..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Pembelian
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
                                <th>Supplier</th>
                                <th>Tujuan</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Tidak ada pembelian ditemukan</td></tr>
                            ) : (
                                paginated.map((purchase, index) => {
                                    const nomor = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                    const sudahBatal = purchase.status === 'dibatalkan';
                                    return (
                                        <tr key={purchase.id} style={{ opacity: actionLoading === purchase.id ? 0.5 : 1 }}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td>{new Date(purchase.date).toLocaleDateString('id-ID')}</td>
                                            <td className={styles.namaCell}>{purchase.supplier}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[typeVariant[purchase.type] ?? 'brown']}`}>
                                                    {typeLabel[purchase.type] ?? purchase.type}
                                                    {purchase.type === 'booth' && purchase.location_name
                                                        ? ` — ${purchase.location_name}` : ''}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>
                                                Rp {Number(purchase.total).toLocaleString('id')}
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[statusVariant[purchase.status] ?? 'grey']}`}>
                                                    {purchase.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    {/* Detail */}

                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Lihat detail"
                                                        onClick={() => navigate(`/pembelian/${purchase.id}`)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>

                                                    {/* Batalkan — sembunyikan kalau sudah batal */}
                                                    {!sudahBatal ? (
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.danger}`}
                                                            aria-label="Batalkan"
                                                            onClick={() => handleCancel(purchase)}
                                                            disabled={actionLoading === purchase.id}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span style={{ width: 28 }} />
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

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} pembelian
                        {filtered.length !== purchaseList.length && ` (difilter dari ${purchaseList.length} total)`}
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

            <TambahPurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                itemList={itemList}
            />
        </>
    );
}