// src/pages/Penjualan/RekapPenjualanPage.jsx
import { useState, useMemo } from 'react';
import styles from './Penjualan.module.css';
import tableStyles from '../../components/Produksi/ProduksiTable.module.css';
import { useApi } from '../../hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const methodLabel = { tunai: 'Tunai', qris: 'QRIS' };
const methodVariant = { tunai: 'success', qris: 'accent' };

export default function RekapPenjualanPage() {
    const range = defaultRange();
    const [dateFrom, setDateFrom] = useState(range.from);
    const [dateTo, setDateTo] = useState(range.to);
    const [boothId, setBoothId] = useState('');
    const [method, setMethod] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedDay, setExpandedDay] = useState(null);     // key = `${tanggal}_${booth_id}`
    const [expandedSale, setExpandedSale] = useState(null);   // sale_id

    // Fetch booth list
    const { data: boothData } = useApi('/booth/loc');
    const booths = Array.isArray(boothData) ? boothData : [];

    // Fetch rekap HPP
    const { data, loading, error, fetchData: refetch } = useApi(
        `/sales/rekap-hpp?from=${dateFrom}&to=${dateTo}` +
        `${boothId ? `&booth_id=${boothId}` : ''}`
    );
    const rawList = Array.isArray(data) ? data : [];

    // ── Filter metode di frontend ──────────────────────────────
    // Kalau ada filter metode, filter transaksi di dalam setiap hari,
    // lalu recalculate total omzet/hpp/laba per hari
    const list = useMemo(() => {
        if (!method) return rawList;

        return rawList
            .map(day => {
                const filteredTrx = day.detail_per_transaksi.filter(
                    t => t.payment_method === method
                );
                if (filteredTrx.length === 0) return null;

                const total_pendapatan = filteredTrx.reduce((s, t) => s + Number(t.grand_total), 0);
                const total_hpp = filteredTrx.reduce((s, t) => s + Number(t.total_hpp), 0);
                const total_laba = filteredTrx.reduce((s, t) => s + Number(t.laba), 0);

                return {
                    ...day,
                    total_pendapatan,
                    total_hpp,
                    total_laba,
                    jumlah_transaksi: filteredTrx.length,
                    detail_per_transaksi: filteredTrx,
                };
            })
            .filter(Boolean);
    }, [rawList, method]);

    // ── Summary ────────────────────────────────────────────────
    const summary = useMemo(() => ({
        omzet: list.reduce((s, d) => s + Number(d.total_pendapatan), 0),
        hpp: list.reduce((s, d) => s + Number(d.total_hpp), 0),
        labaRugi: list.reduce((s, d) => s + Number(d.total_laba), 0),
        transaksi: list.reduce((s, d) => s + Number(d.jumlah_transaksi), 0),
    }), [list]);

    // ── Pagination ─────────────────────────────────────────────
    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    const paginated = list.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    function handleApply() { setCurrentPage(1); setExpandedDay(null); setExpandedSale(null); refetch(); }

    // ── Export Excel ───────────────────────────────────────────
    function handleExportExcel() {
        // Sheet 1: Ringkasan per hari
        const ringkasan = [
            ['No', 'Tanggal', 'Booth', 'Transaksi', 'Omzet', 'HPP', 'Laba/Rugi', 'Ket.'],
            ...list.map((day, i) => [
                i + 1,
                day.tanggal,
                day.booth_name ?? '-',
                day.jumlah_transaksi,
                Number(day.total_pendapatan),
                Number(day.total_hpp),
                Number(day.total_laba),
                Number(day.total_laba) >= 0 ? 'LABA' : 'RUGI',
            ]),
            [],
            ['', '', 'TOTAL', summary.transaksi, summary.omzet, summary.hpp, summary.labaRugi, summary.labaRugi >= 0 ? 'LABA' : 'RUGI'],
        ];

        // Sheet 2: Detail per transaksi + item
        const detail = [
            ['Tanggal', 'Booth', 'Invoice', 'Waktu', 'Metode', 'Produk', 'Size', 'Less Ice', 'Qty', 'Harga Satuan', 'Subtotal', 'HPP Adonan', 'HPP Packaging', 'Total HPP', 'Laba/Rugi'],
        ];
        list.forEach(day => {
            day.detail_per_transaksi.forEach(trx => {
                trx.items?.forEach(it => {
                    detail.push([
                        day.tanggal,
                        day.booth_name ?? '-',
                        `#${String(trx.sale_id).padStart(4, '0')}`,
                        formatTime(trx.waktu),
                        methodLabel[trx.payment_method] ?? trx.payment_method,
                        it.product_name,
                        it.size ?? '-',
                        it.is_less_ice ? 'Ya' : 'Tidak',
                        Number(it.qty),
                        Number(it.unit_price),
                        Number(it.total_price),
                        Number(it.hpp_adonan),
                        Number(it.hpp_packaging),
                        Number(it.total_hpp),
                        Number(it.laba),
                    ]);
                });
            });
        });

        const wb = XLSX.utils.book_new();

        // ── Helper: apply styling ke worksheet ──
        const applyStyle = (ws, data, titleRows = 0) => {
            const headerRowIdx = titleRows; // 0-based index baris header
            const totalRows = data.length;
            const totalCols = data[headerRowIdx]?.length ?? 0;

            const yellow = { fgColor: { rgb: 'FFD700' } };
            const darkYellow = { fgColor: { rgb: 'FFC000' } };
            const borderThin = {
                top: { style: 'thin', color: { rgb: '111111' } },
                bottom: { style: 'thin', color: { rgb: '111111' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
            };

            for (let R = titleRows; R < totalRows; R++) {
                for (let C = 0; C < totalCols; C++) {
                    const addr = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[addr]) ws[addr] = { t: 's', v: '' };

                    const isHeader = R === headerRowIdx;
                    const isTotalRow = R === totalRows - 1 && data[R][0] === '';

                    ws[addr].s = {
                        fill: isHeader ? { patternType: 'solid', fgColor: { rgb: 'FFD700' } }
                            : isTotalRow ? { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } }
                                : { patternType: 'none' },
                        font: {
                            bold: isHeader || isTotalRow,
                            name: 'Arial',
                            sz: 10,
                        },
                        alignment: {
                            horizontal: C === 0 ? 'center'
                                : (typeof data[R][C] === 'number') ? 'right'
                                    : 'left',
                            vertical: 'center',
                        },
                        border: borderThin,
                    };
                }
            }

            // Lebar kolom otomatis
            ws['!cols'] = data[headerRowIdx].map((h, i) => {
                const maxLen = Math.max(
                    String(h ?? '').length,
                    ...data.slice(headerRowIdx + 1).map(row => String(row[i] ?? '').length)
                );
                return { wch: Math.min(maxLen + 4, 30) };
            });
        };

        // Sheet 1: Ringkasan
        const ws1 = XLSX.utils.aoa_to_sheet(ringkasan);
        applyStyle(ws1, ringkasan);
        XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

        // Sheet 2: Detail
        const ws2 = XLSX.utils.aoa_to_sheet(detail);
        applyStyle(ws2, detail);
        XLSX.utils.book_append_sheet(wb, ws2, 'Detail Transaksi');

        XLSX.writeFile(wb, `rekap-penjualan-${dateFrom}-${dateTo}.xlsx`, { bookSST: false, cellStyles: true });
    }

    // ── Export PDF ─────────────────────────────────────────────
    function handleExportPdf() {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Halaman 1: Ringkasan per hari
        doc.setFontSize(14);
        doc.text('Rekap Penjualan', 14, 16);
        doc.setFontSize(10);
        doc.text(`Periode: ${formatDate(dateFrom)} s/d ${formatDate(dateTo)}`, 14, 23);
        if (boothId) {
            const boothName = booths.find(b => String(b.id) === String(boothId))?.name ?? '';
            doc.text(`Booth: ${boothName}`, 14, 29);
        }

        autoTable(doc, {
            startY: boothId ? 34 : 28,
            head: [['No', 'Tanggal', 'Booth', 'Transaksi', 'Omzet', 'HPP', 'L/R', 'Ket.']],
            body: list.map((day, i) => [
                i + 1,
                formatDate(day.tanggal),
                day.booth_name ?? '-',
                day.jumlah_transaksi,
                formatRp(day.total_pendapatan),
                formatRp(day.total_hpp),
                `${Number(day.total_laba) >= 0 ? '+' : '-'}${formatRp(Math.abs(Number(day.total_laba)))}`,
                Number(day.total_laba) >= 0 ? 'LABA' : 'RUGI',
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [101, 67, 33], halign: 'center' },
            columnStyles: {
                0: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'center' },
            },
        });

        const y1 = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Omzet: ${formatRp(summary.omzet)}   |   Total HPP: ${formatRp(summary.hpp)}   |   ${summary.labaRugi >= 0 ? 'Total Laba' : 'Total Rugi'}: ${formatRp(Math.abs(summary.labaRugi))}`, 14, y1);
        doc.setFont(undefined, 'normal');

        // Halaman 2+: Detail per transaksi
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Detail Transaksi per Hari', 14, 16);

        let y = 24;
        list.forEach((day, di) => {
            if (y > 170) { doc.addPage(); y = 16; }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`${formatDate(day.tanggal)} — ${day.booth_name ?? '-'} | Omzet: ${formatRp(day.total_pendapatan)} | HPP: ${formatRp(day.total_hpp)} | L/R: ${formatRp(day.total_laba)}`, 14, y);
            doc.setFont(undefined, 'normal');
            y += 5;

            const rows = [];
            day.detail_per_transaksi.forEach(trx => {
                trx.items?.forEach((it, j) => {
                    rows.push([
                        j === 0 ? `#${String(trx.sale_id).padStart(4, '0')}` : '',
                        j === 0 ? formatTime(trx.waktu) : '',
                        j === 0 ? (methodLabel[trx.payment_method] ?? trx.payment_method) : '',
                        it.product_name + (it.size ? ` (${it.size})` : '') + (it.is_less_ice ? ' LI' : ''),
                        it.qty,
                        formatRp(it.unit_price),
                        formatRp(it.total_price),
                        formatRp(it.total_hpp),
                        `${Number(it.laba) >= 0 ? '+' : ''}${formatRp(it.laba)}`,
                    ]);
                });
            });

            autoTable(doc, {
                startY: y,
                head: [['Invoice', 'Waktu', 'Metode', 'Produk', 'Qty', 'Harga', 'Subtotal', 'HPP', 'L/R']],
                body: rows,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [160, 92, 32], halign: 'center' },
                columnStyles: {
                    0: { halign: 'center' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                },
                margin: { left: 14 },
            });
            y = doc.lastAutoTable.finalY + 10;
        });

        doc.save(`rekap-penjualan-${dateFrom}-${dateTo}.pdf`);
    }

    function toggleDay(key) {
        setExpandedDay(prev => prev === key ? null : key);
        setExpandedSale(null);
    }
    function toggleSale(saleId) {
        setExpandedSale(prev => prev === saleId ? null : saleId);
    }

    const isLaba = (val) => Number(val) >= 0;

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Penjualan</span> › Rekap Penjualan
                </div>
                <h1 className={styles.pageTitle}>Rekap Penjualan</h1>
                <p className={styles.pageSubtitle}>Laporan omzet, HPP, dan laba rugi per hari</p>
            </div>

            {/* ── Filter ── */}
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

                {/* Summary cards */}
                {!loading && list.length > 0 && (
                    <div className={styles.summaryRow}>
                        {[
                            { label: 'Total Omzet', val: formatRp(summary.omzet), color: 'var(--brown-900)' },
                            { label: 'Total HPP', val: formatRp(summary.hpp), color: 'var(--brown-600)' },
                            {
                                label: isLaba(summary.labaRugi) ? 'Total Laba' : 'Total Rugi',
                                val: formatRp(Math.abs(summary.labaRugi)),
                                color: isLaba(summary.labaRugi) ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)'
                            },
                            { label: 'Total Transaksi', val: summary.transaksi, color: 'var(--brown-700)' },
                        ].map(s => (
                            <div key={s.label} className={styles.summaryItem}>
                                <span className={styles.summaryVal} style={{ color: s.color, fontSize: typeof s.val === 'string' ? 16 : 22 }}>
                                    {s.val}
                                </span>
                                <span className={styles.summaryLbl}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Tabel ── */}
            <div className={tableStyles.card}>
                <div className={tableStyles.cardHeader}>
                    <span className={tableStyles.cardTitle}>Rekap Per Hari</span>
                </div>
                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Booth</th>
                                <th style={{ textAlign: 'right' }}>Omzet</th>
                                <th style={{ textAlign: 'right' }}>HPP</th>
                                <th style={{ textAlign: 'right' }}>L / R</th>
                                <th style={{ textAlign: 'center' }}>Ket.</th>
                                <th style={{ textAlign: 'center' }}>Transaksi</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell} style={{ color: 'var(--danger)' }}>{error}</td></tr>
                            ) : list.length === 0 ? (
                                <tr><td colSpan={9} className={tableStyles.stateCell}>Tidak ada data pada periode ini</td></tr>
                            ) : paginated.map((day, i) => {
                                const dayKey = `${day.tanggal}_${day.booth_id}`;
                                const isExpanded = expandedDay === dayKey;
                                const lr = Number(day.total_laba);
                                const laba = lr >= 0;

                                return (
                                    <>
                                        {/* ── Baris Hari ── */}
                                        <tr
                                            key={dayKey}
                                            style={{ cursor: 'pointer', background: isExpanded ? 'var(--brown-50, #fdf8f3)' : undefined }}
                                            onClick={() => toggleDay(dayKey)}
                                        >
                                            <td className={tableStyles.idCell}>
                                                {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                                            </td>
                                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {formatDate(day.tanggal)}
                                            </td>
                                            <td>{day.booth_name ?? '-'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--brown-900)' }}>
                                                {formatRp(day.total_pendapatan)}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--brown-600)' }}>
                                                {formatRp(day.total_hpp)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: laba ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)' }}>
                                                {laba ? '+' : '-'}{formatRp(Math.abs(lr))}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                                    borderRadius: 20,
                                                    background: laba ? '#dcfce7' : '#fee2e2',
                                                    color: laba ? '#15803d' : '#b91c1c',
                                                }}>
                                                    {laba ? 'LABA' : 'RUGI'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', color: 'var(--brown-600)' }}>
                                                {day.jumlah_transaksi} transaksi
                                            </td>
                                            <td>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                    stroke="var(--brown-400)" strokeWidth="2" strokeLinecap="round"
                                                    style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }}>
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </td>
                                        </tr>

                                        {/* ── Expand: Daftar Transaksi ── */}
                                        {isExpanded && day.detail_per_transaksi.map((trx, ti) => {
                                            const trxExpanded = expandedSale === trx.sale_id;
                                            const trxLr = Number(trx.laba);
                                            const trxLaba = trxLr >= 0;

                                            return (
                                                <>
                                                    {/* Baris Transaksi */}
                                                    <tr
                                                        key={`trx-${trx.sale_id}`}
                                                        style={{ background: trxExpanded ? '#f0fdf4' : '#fdf8f3', cursor: 'pointer' }}
                                                        onClick={e => { e.stopPropagation(); toggleSale(trx.sale_id); }}
                                                    >
                                                        <td style={{ paddingLeft: 32, color: 'var(--brown-400)', fontSize: 11 }}>
                                                            {ti + 1}.
                                                        </td>
                                                        <td style={{ fontSize: 12, color: 'var(--brown-500)', whiteSpace: 'nowrap' }}>
                                                            {formatTime(trx.waktu)}
                                                        </td>
                                                        <td>
                                                            <span className={`${tableStyles.monoCell}`} style={{ fontWeight: 700, fontSize: 12 }}>
                                                                #{String(trx.sale_id).padStart(4, '0')}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                                                            {formatRp(trx.grand_total)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--brown-500)' }}>
                                                            {formatRp(trx.total_hpp)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: trxLaba ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)' }}>
                                                            {trxLaba ? '+' : '-'}{formatRp(Math.abs(trxLr))}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span className={`${tableStyles.pill} ${tableStyles[methodVariant[trx.payment_method] ?? 'grey']}`} style={{ fontSize: 10 }}>
                                                                {methodLabel[trx.payment_method] ?? trx.payment_method}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: 11, color: 'var(--brown-400)' }}>
                                                            {trx.items?.length ?? 0} item
                                                        </td>
                                                        <td>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                                stroke="var(--brown-400)" strokeWidth="2" strokeLinecap="round"
                                                                style={{ transition: 'transform 0.2s', transform: trxExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }}>
                                                                <polyline points="6 9 12 15 18 9" />
                                                            </svg>
                                                        </td>
                                                    </tr>

                                                    {/* Expand: Detail Item */}
                                                    {trxExpanded && trx.items?.map((it, j) => {
                                                        const itLr = Number(it.laba);
                                                        const itLaba = itLr >= 0;
                                                        return (
                                                            <tr key={`item-${trx.sale_id}-${j}`} style={{ background: '#f0fdf4' }}>
                                                                <td colSpan={9} style={{ padding: '6px 16px 6px 64px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                                                                        {/* Nama produk + badge */}
                                                                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--brown-900)' }}>
                                                                            <span style={{ color: 'var(--brown-400)', fontSize: 11 }}>{j + 1}.</span>
                                                                            {it.product_name}
                                                                            {it.size && (
                                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#EDE9FE', color: '#5B21B6' }}>
                                                                                    {it.size}
                                                                                </span>
                                                                            )}
                                                                            {it.is_less_ice ? (
                                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8' }}>
                                                                                    Less Ice
                                                                                </span>
                                                                            ) : null}
                                                                        </span>

                                                                        {/* Qty × harga */}
                                                                        <span style={{ color: 'var(--brown-500)', minWidth: 70, textAlign: 'right' }}>
                                                                            {it.qty}× {formatRp(it.unit_price)}
                                                                        </span>

                                                                        {/* Subtotal */}
                                                                        <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right', color: 'var(--brown-900)' }}>
                                                                            {formatRp(it.total_price)}
                                                                        </span>

                                                                        {/* HPP */}
                                                                        <span style={{ color: 'var(--brown-500)', minWidth: 90, textAlign: 'right', fontSize: 11 }}>
                                                                            HPP {formatRp(it.total_hpp)}
                                                                        </span>

                                                                        {/* L/R */}
                                                                        <span style={{
                                                                            fontWeight: 700, minWidth: 90, textAlign: 'right', fontSize: 11,
                                                                            color: itLaba ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)'
                                                                        }}>
                                                                            {itLaba ? '+' : '-'}{formatRp(Math.abs(itLr))}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer pagination */}
                <div className={tableStyles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {list.length} hari</span>
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