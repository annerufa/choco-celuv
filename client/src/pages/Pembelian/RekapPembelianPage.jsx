// src/pages/Pembelian/RekapPembelianPage.jsx
import React, { useState } from 'react';
import styles from './RekapPembelian.module.css';          // pakai CSS yang sama
import tableStyles from '../../components/Produksi/ProduksiTable.module.css';
import { useApi } from '../../hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITEMS_PER_PAGE = 10;

function toInputDate(d) { return new Date(d).toLocaleDateString('en-CA'); }
// console.log('Default date range:', toInputDate(new Date(Date.now() - 30 * 86400000)), 'to', toInputDate(new Date()));
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

const statusVariant = {
    dikonfirmasi: 'success',
    pending: 'grey',
    ditolak: 'danger',
};
const statusLabel = {
    dikonfirmasi: 'Dikonfirmasi',
    pending: 'Pending',
    ditolak: 'Ditolak',
};

export default function RekapPembelianPage() {
    const range = defaultRange();
    const [dateFrom, setDateFrom] = useState(range.from);
    const [dateTo, setDateTo] = useState(range.to);
    // const [boothId, setBoothId] = useState('');
    const [locId, setLocId] = useState('');
    const [statusFilter, setStatusFilter] = useState('dikonfirmasi');
    const [currentPage, setCurrentPage] = useState(1);
    const [expanded, setExpanded] = useState(null); // purchase id yang detail-nya dibuka

    // Fetch booth list

    const { data: locData } = useApi('/purchase/stock-locations');
    const locations = Array.isArray(locData) ? locData : [];
    // console.log('Locations for filter:', locations);

    const query =
        `/sales/rekap/pembelian?from=${dateFrom}&to=${dateTo}` +
        `${locId ? `&loc_id=${locId}` : ''}` +
        `${statusFilter ? `&status=${statusFilter}` : ''}`;

    const { data, loading, error, fetchData: refetch } = useApi(query);

    const summary = data?.summary ?? null;
    const list = Array.isArray(data?.list) ? data.list : [];
    // console.log('Fetched purchase list:', list);

    // Pagination
    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    const paginated = list.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    // Summary
    const totalNilai = list.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const totalItem = list.reduce((s, r) => s + Number(r.total_item ?? 0), 0);
    const uniqueUser = new Set(list.map(r => r.created_by)).size;
    const uniqueBooth = new Set(list.map(r => r.booth_id).filter(Boolean)).size;

    function handleApply() { setCurrentPage(1); setExpanded(null); refetch(); }
    function handleExportExcel() {
        // Sheet 1: Ringkasan
        const summaryData = [
            ['No', 'Tanggal', 'Booth', 'User', 'Total Item', 'Total'],
            ...list.map((p, i) => [
                i + 1,
                formatDate(p.date),
                p.booth_name ?? '-',
                p.user_name ?? '-',
                p.total_item ?? p.items?.length ?? '-',
                Number(p.total),
            ]),
            [],
            ['', '', '', 'Total Transaksi', list.length],
            ['', '', '', 'Total Nilai', Number(summary?.total_nilai ?? 0)],
        ];

        // Sheet 2: Detail Item
        const detailData = [
            ['No Transaksi', 'Tanggal', 'Lokasi', 'Supplier', 'Pembeli', 'Barang', 'Qty', 'Satuan', 'Harga Satuan', 'Subtotal'],
        ];
        list.forEach((p, i) => {
            if (p.items?.length) {
                p.items.forEach(it => {
                    detailData.push([
                        i + 1,
                        formatDate(p.date),
                        p.booth_name ?? '-',
                        p.supplier ?? '-',
                        p.user_name ?? '-',
                        it.item_name ?? it.name,
                        parseFloat(it.qty),
                        it.unit ?? '',
                        Number(it.unit_price ?? it.price),
                        Number(it.total_price ?? (it.qty * (it.unit_price ?? it.price))),
                    ]);
                });
            }
        });

        const wb = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        const wsDetail = XLSX.utils.aoa_to_sheet(detailData);

        XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
        XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Item');

        XLSX.writeFile(wb, `rekap-pembelian-${dateFrom}-${dateTo}.xlsx`);
    }

    function handleExportPdf() {
        const doc = new jsPDF();

        // === HALAMAN 1: Ringkasan ===
        doc.setFontSize(14);
        doc.text('Rekap Pembelian', 14, 16);
        doc.setFontSize(10);
        doc.text(`Periode: ${formatDate(dateFrom)} - ${formatDate(dateTo)}`, 14, 23);

        autoTable(doc, {
            startY: 28,
            head: [['No', 'Tanggal', 'Supplier', 'Booth', 'Pembeli', 'Item', 'Total']],
            body: list.map((p, i) => [
                i + 1,
                formatDate(p.date),
                p.supplier ?? '-',
                p.booth_name ?? '-',
                p.user_name ?? '-',
                p.total_item ?? p.items?.length ?? '-',
                formatRp(p.total),
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [101, 67, 33] },
            columnStyles: { 5: { halign: 'right' } },
        });

        const finalY = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(10);
        doc.text(`Total Transaksi: ${list.length}`, 14, finalY);
        doc.text(`Total Nilai: ${formatRp(summary?.total_nilai ?? 0)}`, 14, finalY + 6);

        // === HALAMAN 2 dst: Detail Item per Transaksi ===
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Detail Item per Transaksi', 14, 16);

        let y = 24;

        list.forEach((p, i) => {
            // Cek butuh halaman baru sebelum mulai blok transaksi
            if (y > 250) {
                doc.addPage();
                y = 16;
            }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(
                `${i + 1}. ${formatDate(p.date)} - ${p.booth_name ?? '-'} - ${p.user_name ?? '-'} - ${formatRp(p.total)}`,
                14, y
            );
            doc.setFont(undefined, 'normal');
            y += 4;

            if (p.items?.length) {
                autoTable(doc, {
                    startY: y,
                    margin: { left: 14 },
                    head: [['Item', 'Qty', 'Satuan', 'Harga', 'Subtotal']],
                    body: p.items.map(it => [
                        it.item_name ?? it.name,
                        parseFloat(it.qty),
                        it.unit ?? '',
                        formatRp(it.unit_price ?? it.price),
                        formatRp(it.total_price ?? (it.qty * (it.unit_price ?? it.price))),
                    ]),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [180, 140, 100] },
                    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
                });
                y = doc.lastAutoTable.finalY + 8;
            } else {
                doc.setFontSize(9);
                doc.text('Tidak ada detail item', 14, y);
                y += 8;
            }
        });

        doc.save(`rekap-pembelian-${dateFrom}-${dateTo}.pdf`);
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Pembelian</span> › Rekap Pembelian
                </div>
                <h1 className={styles.pageTitle}>Rekap Pembelian</h1>
                <p className={styles.pageSubtitle}>Riwayat pembelian seluruh user per booth dan periode</p>
            </div>

            {/* Filter */}
            <div className={styles.filterCard}>
                <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Dari Tanggal</label>
                        <input
                            type="date"
                            className={styles.filterInput}
                            value={dateFrom}
                            max={dateTo}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Sampai Tanggal</label>
                        <input
                            type="date"
                            className={styles.filterInput}
                            value={dateTo}
                            min={dateFrom}
                            onChange={e => setDateTo(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Booth / Lokasi</label>
                        <select
                            className={styles.filterInput}
                            value={locId}
                            onChange={e => setLocId(e.target.value)}
                        >
                            <option value="">Semua Lokasi</option>
                            {locations.map(l => (
                                <option key={l.location_id} value={l.location_id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.btnApply} onClick={handleApply}>Terapkan</button>
                    <button
                        className={styles.btnApply}
                        style={{ background: 'var(--success, #16a34a)' }}
                        onClick={handleExportExcel}
                        disabled={list.length === 0}
                    >
                        Excel
                    </button>
                    <button
                        className={styles.btnApply}
                        style={{ background: 'var(--danger, #dc2626)' }}
                        onClick={handleExportPdf}
                        disabled={list.length === 0}
                    >
                        PDF
                    </button>
                </div>

                {/* Summary */}
                {!loading && summary && (
                    <div className={styles.summaryRow}>
                        {[
                            { label: 'Total Nilai', val: formatRp(summary.total_nilai), color: 'var(--brown-900)' },
                            { label: 'Transaksi', val: summary.total_pembelian, color: 'var(--accent)' },
                        ].map(s => (
                            <div key={s.label} className={styles.summaryItem}>
                                <span className={styles.summaryVal} style={{ color: s.color, fontSize: typeof s.val === 'string' ? 18 : 22 }}>
                                    {s.val}
                                </span>
                                <span className={styles.summaryLbl}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabel */}
            <div className={tableStyles.card}>
                <div className={tableStyles.cardHead} style={{ padding: 20 }}>
                    <span className={tableStyles.cardTitle}>Daftar Pembelian</span>
                </div>
                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Lokasi</th>
                                <th>Suplier</th>
                                <th>Pembeli</th>
                                <th>Barang</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} className={tableStyles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={10} className={tableStyles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={10} className={tableStyles.stateCell}>Tidak ada pembelian pada periode ini</td></tr>
                            ) : paginated.map((purchase, i) => (

                                <React.Fragment key={purchase.id}>
                                    <tr
                                        // key={purchase.id}
                                        style={{
                                            cursor: 'pointer',
                                            background: expanded === purchase.id ? 'var(--brown-50, #fdf8f3)' : undefined,
                                        }}
                                        onClick={() => setExpanded(expanded === purchase.id ? null : purchase.id)}
                                    >
                                        <td className={tableStyles.idCell}>
                                            {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div>{formatDate(purchase.date)}</div>
                                        </td>
                                        {/* <td className={tableStyles.monoCell} style={{ fontWeight: 700 }}>
                                            #{String(purchase.id).padStart(4, '0')}
                                        </td> */}
                                        <td>{purchase.booth_name ?? '-'}</td>
                                        <td>{purchase.supplier ?? '-'}</td>
                                        <td>{purchase.user_name ?? '-'}</td>
                                        <td className={tableStyles.monoCell}>
                                            {purchase.total_item ?? '-'} detail
                                        </td>
                                        {/* <td>
                                            <span className={`${tableStyles.pill} ${tableStyles[statusVariant[purchase.status] ?? 'grey']}`}>
                                                {statusLabel[purchase.status] ?? purchase.status}
                                            </span>
                                        </td> */}
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--brown-900)' }}>
                                            {formatRp(purchase.total)}
                                        </td>
                                        <td>
                                            <svg
                                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                stroke="var(--brown-400)" strokeWidth="2" strokeLinecap="round"
                                                style={{
                                                    transition: 'transform 0.2s',
                                                    transform: expanded === purchase.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                }}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </td>
                                    </tr>

                                    {/* Detail item baris */}

                                    {expanded === purchase.id && purchase.items && (
                                        <tr key={`detail-${purchase.id}`}>
                                            <td colSpan={10} style={{ padding: 0, background: 'var(--brown-50, #fdf8f3)' }}>
                                                <div style={{ padding: '10px 16px 14px 52px' }}>
                                                    <div style={{
                                                        fontSize: 11, fontWeight: 700,
                                                        color: 'var(--brown-400)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        marginBottom: 8,
                                                    }}>
                                                        Detail Item
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                        {purchase.items.map((it, j) => (
                                                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                                                <span style={{ color: 'var(--brown-400)', minWidth: 18, textAlign: 'right', fontSize: 11 }}>
                                                                    {j + 1}.
                                                                </span>
                                                                <span style={{ flex: 1, color: 'var(--brown-900)', fontWeight: 600 }}>
                                                                    {it.item_name ?? it.name}
                                                                </span>
                                                                <span style={{ color: 'var(--brown-500)', minWidth: 60 }}>
                                                                    {parseFloat(it.qty)} {it.unit ?? ''}
                                                                </span>
                                                                <span style={{ color: 'var(--brown-500)', minWidth: 90, textAlign: 'right' }}>
                                                                    {formatRp(it.unit_price ?? it.price)}
                                                                </span>
                                                                <span style={{ color: 'var(--brown-900)', fontWeight: 700, minWidth: 100, textAlign: 'right' }}>
                                                                    {formatRp(it.total_price ?? (it.qty * (it.unit_price ?? it.price)))}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer pagination */}
                <div className={tableStyles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {list.length} pembelian</span>
                    {totalPages > 1 && (
                        <div className={tableStyles.pagination}>
                            <button
                                className={tableStyles.pageBtn}
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${i}`} className={tableStyles.pageEllipsis}>...</span>
                                ) : (
                                    <button
                                        key={`page-${page}`}
                                        className={`${tableStyles.pageBtn} ${page === currentPage ? tableStyles.active : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button
                                className={tableStyles.pageBtn}
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
