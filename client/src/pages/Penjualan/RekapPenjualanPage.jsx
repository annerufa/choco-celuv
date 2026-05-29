// src/pages/Penjualan/RekapPenjualanPage.jsx
import { useState } from 'react';
import styles from './Penjualan.module.css';
import tableStyles from '../../components/Produksi/ProduksiTable.module.css';
import { useApi } from '../../hooks/useApi';

const ITEMS_PER_PAGE = 10;

function toInputDate(d) { return new Date(d).toISOString().slice(0, 10); }
function defaultRange() {
    const to = new Date(), from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: toInputDate(from), to: toInputDate(to) };
}
function formatRp(val) {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
}
function formatDate(d) {
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(d) {
    return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const methodVariant = { tunai: 'success', qris: 'accent' };
const methodLabel   = { tunai: 'Tunai', qris: 'QRIS' };

export default function RekapPenjualanPage() {
    const range = defaultRange();
    const [dateFrom, setDateFrom]   = useState(range.from);
    const [dateTo, setDateTo]       = useState(range.to);
    const [boothId, setBoothId]     = useState('');
    const [method, setMethod]       = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expanded, setExpanded]   = useState(null); // sale id yang detail-nya dibuka

    // Fetch booth list
    const { data: boothData } = useApi('/booth/loc');
    const booths = Array.isArray(boothData) ? boothData : [];

    // Fetch rekap penjualan
    const { data, loading, error, fetchData: refetch } = useApi(
        `/sales/rekap?from=${dateFrom}&to=${dateTo}` +
        `${boothId ? `&booth_id=${boothId}` : ''}` +
        `${method  ? `&method=${method}`    : ''}`
    );
    const list = Array.isArray(data) ? data : [];

    // Pagination
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
    const totalOmzet  = list.reduce((s, r) => s + Number(r.grand_total), 0);
    const totalTunai  = list.filter(r => r.payment_method === 'tunai').reduce((s, r) => s + Number(r.grand_total), 0);
    const totalQris   = list.filter(r => r.payment_method === 'qris').reduce((s, r) => s + Number(r.grand_total), 0);
    const totalItem   = list.reduce((s, r) => s + Number(r.total_item ?? 0), 0);

    function handleApply() { setCurrentPage(1); setExpanded(null); refetch(); }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Penjualan</span> › Rekap Penjualan
                </div>
                <h1 className={styles.pageTitle}>Rekap Penjualan</h1>
                <p className={styles.pageSubtitle}>Riwayat transaksi kasir per booth dan periode</p>
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
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Metode</label>
                        <select className={styles.filterInput} value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="">Semua Metode</option>
                            <option value="tunai">Tunai</option>
                            <option value="qris">QRIS</option>
                        </select>
                    </div>
                    <button className={styles.btnApply} onClick={handleApply}>Terapkan</button>
                </div>

                {/* Summary */}
                {!loading && list.length > 0 && (
                    <div className={styles.summaryRow}>
                        {[
                            { label: 'Total Omzet',  val: formatRp(totalOmzet),  color: 'var(--brown-900)' },
                            { label: 'Tunai',         val: formatRp(totalTunai),  color: 'var(--accent)' },
                            { label: 'QRIS',          val: formatRp(totalQris),   color: 'var(--blue, #2563a8)' },
                            { label: 'Transaksi',     val: list.length,           color: 'var(--brown-700)' },
                            { label: 'Total Item',    val: totalItem,             color: 'var(--brown-500)' },
                        ].map(s => (
                            <div key={s.label} className={styles.summaryItem}>
                                <span className={styles.summaryVal} style={{ color: s.color, fontSize: typeof s.val === 'string' ? 18 : 22 }}>{s.val}</span>
                                <span className={styles.summaryLbl}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabel */}
            <div className={tableStyles.card}>
                <div className={tableStyles.cardHeader}>
                    <span className={tableStyles.cardTitle}>Daftar Transaksi</span>
                </div>
                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Waktu</th>
                                <th>Invoice</th>
                                <th>Booth</th>
                                <th>Kasir</th>
                                <th>Item</th>
                                <th>Metode</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell}>Tidak ada transaksi pada periode ini</td></tr>
                            ) : paginated.map((sale, i) => (
                                <>
                                    <tr
                                        key={sale.id}
                                        style={{ cursor: 'pointer', background: expanded === sale.id ? 'var(--brown-50, #fdf8f3)' : undefined }}
                                        onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                                    >
                                        <td className={tableStyles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div>{formatDate(sale.created_at)}</div>
                                            <div style={{ fontSize: 11, color: 'var(--brown-400)' }}>{formatTime(sale.created_at)}</div>
                                        </td>
                                        <td className={tableStyles.monoCell} style={{ fontWeight: 700 }}>
                                            #{String(sale.id).padStart(4, '0')}
                                        </td>
                                        <td>{sale.booth_name ?? '-'}</td>
                                        <td>{sale.kasir_name ?? '-'}</td>
                                        <td className={tableStyles.monoCell}>{sale.total_item} item</td>
                                        <td>
                                            <span className={`${tableStyles.pill} ${tableStyles[methodVariant[sale.payment_method] ?? 'grey']}`}>
                                                {methodLabel[sale.payment_method] ?? sale.payment_method}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brown-900)' }}>
                                            {formatRp(sale.grand_total)}
                                        </td>
                                        <td>
                                            <svg
                                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="var(--brown-400)" strokeWidth="2" strokeLinecap="round"
                                                style={{ transition: 'transform 0.2s', transform: expanded === sale.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            >
                                                <polyline points="6 9 12 15 18 9"/>
                                            </svg>
                                        </td>
                                    </tr>

                                    {/* Detail item baris */}
                                    {expanded === sale.id && sale.items && (
                                        <tr key={`detail-${sale.id}`}>
                                            <td colSpan={9} style={{ padding: 0, background: 'var(--brown-50, #fdf8f3)' }}>
                                                <div style={{ padding: '10px 16px 14px 52px' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                                        Detail Item
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                        {sale.items.map((it, j) => (
                                                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                                                <span style={{ color: 'var(--brown-400)', minWidth: 18, textAlign: 'right', fontSize: 11 }}>{j + 1}.</span>
                                                                <span style={{ flex: 1, color: 'var(--brown-900)', fontWeight: 600 }}>
                                                                    {it.product_name}
                                                                    {it.size && (
                                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#EDE9FE', color: '#5B21B6', marginLeft: 6 }}>
                                                                            {it.size}
                                                                        </span>
                                                                    )}
                                                                    {it.is_less_ice ? (
                                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8', marginLeft: 4 }}>
                                                                            Less Ice
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                                <span style={{ color: 'var(--brown-500)', minWidth: 40 }}>{it.qty}×</span>
                                                                <span style={{ color: 'var(--brown-500)', minWidth: 90, textAlign: 'right' }}>{formatRp(it.unit_price)}</span>
                                                                <span style={{ color: 'var(--brown-900)', fontWeight: 700, minWidth: 100, textAlign: 'right' }}>{formatRp(it.total_price)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={tableStyles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {list.length} transaksi</span>
                    {totalPages > 1 && (
                        <div className={tableStyles.pagination}>
                            <button className={tableStyles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
