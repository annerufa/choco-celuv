// src/pages/Produksi/RekapProduksiPage.jsx
import { useState } from 'react';
import styles from './Produksi.module.css';
import tableStyles from '../../components/Produksi/ProduksiTable.module.css';
import { useApi } from '../../hooks/useApi';

const ITEMS_PER_PAGE = 10;

function toInputDate(d) { return new Date(d).toISOString().slice(0, 10); }
function defaultRange() {
    const to = new Date(), from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: toInputDate(from), to: toInputDate(to) };
}

const typeVariant = { mix: 'accent', adonan: 'warning' };
const typeLabel   = { mix: 'Mixing', adonan: 'Adonan' };

export default function RekapProduksiPage() {
    const range = defaultRange();
    const [dateFrom, setDateFrom]     = useState(range.from);
    const [dateTo, setDateTo]         = useState(range.to);
    const [boothId, setBoothId]       = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch booth list untuk filter
    const { data: boothData } = useApi('/stock-locations?type=booth');
    const booths = Array.isArray(boothData) ? boothData : [];

    // Fetch rekap
    const {
        data, loading, error, fetchData: refetch
    } = useApi(`/productions/rekap?from=${dateFrom}&to=${dateTo}${boothId ? `&booth_id=${boothId}` : ''}`);
    const list = Array.isArray(data) ? data : [];

    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    const paginated  = list.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    // Summary
    const totalMix    = list.filter(p => p.recipe_type === 'mix').length;
    const totalAdonan = list.filter(p => p.recipe_type === 'adonan').length;

    function handleApply() { setCurrentPage(1); refetch(); }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Produksi</span> › Rekap Produksi
                </div>
                <h1 className={styles.pageTitle}>Rekap Produksi</h1>
                <p className={styles.pageSubtitle}>Riwayat produksi per booth dan periode</p>
            </div>

            {/* Filter */}
            <div className={styles.filterCard}>
                <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Dari Tanggal</label>
                        <input type="date" className={styles.filterInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Sampai Tanggal</label>
                        <input type="date" className={styles.filterInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Booth</label>
                        <select className={styles.filterInput} value={boothId} onChange={e => setBoothId(e.target.value)}>
                            <option value="">Semua Booth</option>
                            {booths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <button className={styles.btnApply} onClick={handleApply}>
                        Terapkan
                    </button>
                </div>

                {/* Summary */}
                {!loading && list.length > 0 && (
                    <div className={styles.summaryRow}>
                        {[
                            { label: 'Total Produksi', val: list.length,  color: 'var(--brown-900)' },
                            { label: 'Mixing',         val: totalMix,     color: 'var(--accent)'    },
                            { label: 'Adonan',         val: totalAdonan,  color: 'var(--warning)'   },
                        ].map(s => (
                            <div key={s.label} className={styles.summaryItem}>
                                <span className={styles.summaryVal} style={{ color: s.color }}>{s.val}</span>
                                <span className={styles.summaryLbl}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabel */}
            <div className={tableStyles.card}>
                <div className={tableStyles.cardHeader}>
                    <span className={tableStyles.cardTitle}>Hasil Rekap</span>
                </div>
                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Resep</th>
                                <th>Tipe</th>
                                <th>Batch</th>
                                <th>Output</th>
                                <th>Lokasi</th>
                                <th>Dibuat oleh</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell}>Tidak ada data pada periode ini</td></tr>
                            ) : paginated.map((p, i) => (
                                <tr key={p.id}>
                                    <td className={tableStyles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className={tableStyles.namaCell}>{p.recipe_name}</td>
                                    <td>
                                        <span className={`${tableStyles.pill} ${tableStyles[typeVariant[p.recipe_type] ?? 'grey']}`}>
                                            {typeLabel[p.recipe_type] ?? p.recipe_type}
                                        </span>
                                    </td>
                                    <td className={tableStyles.monoCell}>{p.qty}x</td>
                                    <td className={tableStyles.monoCell}>
                                        {Number(p.output_qty) * p.qty} {p.output_unit ?? ''}
                                        {p.recipe_type === 'mix' && p.output_item_name && (
                                            <span style={{ color: 'var(--brown-400)', fontSize: 11, marginLeft: 4 }}>
                                                ({p.output_item_name})
                                            </span>
                                        )}
                                    </td>
                                    <td>{p.location_name ?? '-'}</td>
                                    <td>{p.created_by_name ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={tableStyles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {list.length} produksi</span>
                    {totalPages > 1 && (
                        <div className={tableStyles.pagination}>
                            <button className={tableStyles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`e-${i}`} className={tableStyles.pageEllipsis}>...</span>
                                ) : (
                                    <button key={page} className={`${tableStyles.pageBtn} ${page === currentPage ? tableStyles.active : ''}`} onClick={() => setCurrentPage(page)}>
                                        {page}
                                    </button>
                                )
                            )}
                            <button className={tableStyles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
