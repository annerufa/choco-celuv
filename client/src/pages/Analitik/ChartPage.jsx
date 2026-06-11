// src/pages/Analitik/BatchUtilizationPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale,
    BarElement, Title, Tooltip, Legend
} from 'chart.js';
import styles from './Analitik.module.css';
import tableStyles from '../../components/Produksi/ProduksiTable.module.css';
import { useApi } from '../../hooks/useApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ── Helpers ──────────────────────────────────────────────────
function toInputDate(d) { return new Date(d).toISOString().slice(0, 10); }

function defaultRange(preset = '30') {
    const to = new Date(), from = new Date();
    if (preset === '7') from.setDate(from.getDate() - 7);
    if (preset === '30') from.setDate(from.getDate() - 30);
    if (preset === '90') from.setDate(from.getDate() - 90);
    return { from: toInputDate(from), to: toInputDate(to) };
}

function pct(val, total) {
    if (!total) return 0;
    return Math.round((val / total) * 100);
}

function utilizationColor(rate) {
    if (rate >= 85) return '#16a34a';
    if (rate >= 60) return '#d97706';
    return '#dc2626';
}

// ── Utilization Badge ─────────────────────────────────────────
function UtilBadge({ rate }) {
    const color = utilizationColor(rate);
    const bg = rate >= 85
        ? 'rgba(22,163,74,0.1)'
        : rate >= 60
            ? 'rgba(217,119,6,0.1)'
            : 'rgba(220,38,38,0.1)';
    return (
        <span style={{
            fontWeight: 800, fontSize: 13,
            padding: '3px 10px', borderRadius: 20,
            background: bg, color,
        }}>
            {rate}%
        </span>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ChartPage() {
    const [preset, setPreset] = useState('30');
    const [dateFrom, setDateFrom] = useState(defaultRange('30').from);
    const [dateTo, setDateTo] = useState(defaultRange('30').to);
    const [boothId, setBoothId] = useState('');
    const [applied, setApplied] = useState({
        from: defaultRange('30').from,
        to: defaultRange('30').to,
        booth_id: '',
    });

    const { data: boothData } = useApi('/booth/loc');
    const booths = Array.isArray(boothData) ? boothData : [];

    const { data, loading, error, fetchData: refetch } = useApi(
        `/batches/utilization?from=${applied.from}&to=${applied.to}` +
        `${applied.booth_id ? `&booth_id=${applied.booth_id}` : ''}`
    );
    const rows = Array.isArray(data) ? data : [];

    useEffect(() => {
        if (preset === 'custom') return;
        const r = defaultRange(preset);
        setDateFrom(r.from);
        setDateTo(r.to);
    }, [preset]);

    function handleApply() {
        setApplied({ from: dateFrom, to: dateTo, booth_id: boothId });
    }

    // Summary
    const sumProduksi = rows.reduce((s, r) => s + Number(r.total_produksi), 0);
    const sumTerjual = rows.reduce((s, r) => s + Number(r.total_terjual), 0);
    const sumWaste = rows.reduce((s, r) => s + Number(r.total_waste), 0);
    const avgUtil = pct(sumTerjual, sumProduksi);

    // Chart.js data
    const chartData = {
        labels: rows.map(r => r.booth_name),
        datasets: [
            {
                label: 'Terjual',
                data: rows.map(r => Number(r.total_terjual)),
                backgroundColor: 'rgba(22,163,74,0.85)',
                borderRadius: 6,
                borderSkipped: false,
            },
            {
                label: 'Waste (Expired/Damaged)',
                data: rows.map(r => Number(r.total_waste)),
                backgroundColor: 'rgba(220,38,38,0.8)',
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { font: { size: 12 }, padding: 20, usePointStyle: true },
            },
            tooltip: {
                callbacks: {
                    afterBody: (items) => {
                        const idx = items[0]?.dataIndex;
                        if (idx === undefined) return '';
                        const r = rows[idx];
                        const total = Number(r.total_produksi);
                        const terjual = Number(r.total_terjual);
                        return `Utilisasi: ${pct(terjual, total)}%`;
                    },
                    label: (item) => {
                        return ` ${item.dataset.label}: ${item.raw} cup`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 12 }, color: '#6b5a42' },
            },
            y: {
                grid: { color: '#f0e8df' },
                ticks: {
                    font: { size: 11 }, color: '#a8967e',
                    callback: v => `${v} cup`,
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Analitik</span> › Utilisasi Batch
                </div>
                <h1 className={styles.pageTitle}>Utilisasi Batch Adonan</h1>
                <p className={styles.pageSubtitle}>
                    Perbandingan adonan terjual vs terbuang (expired/damaged) per booth
                </p>
            </div>

            {/* Filter */}
            <div className={styles.filterCard}>
                <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Periode</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[
                                { val: '7', label: '7 Hari' },
                                { val: '30', label: '30 Hari' },
                                { val: '90', label: '3 Bulan' },
                                { val: 'custom', label: 'Custom' },
                            ].map(p => (
                                <button
                                    key={p.val}
                                    onClick={() => setPreset(p.val)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                        fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
                                        border: `1.5px solid ${preset === p.val ? 'var(--accent)' : 'var(--brown-200)'}`,
                                        background: preset === p.val ? 'var(--accent)' : '#fff',
                                        color: preset === p.val ? '#fff' : 'var(--brown-600)',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {preset === 'custom' && (
                        <>
                            <div className={styles.filterField}>
                                <label className={styles.filterLabel}>Dari</label>
                                <input type="date" className={styles.filterInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className={styles.filterField}>
                                <label className={styles.filterLabel}>Sampai</label>
                                <input type="date" className={styles.filterInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </>
                    )}

                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Booth</label>
                        <select className={styles.filterInput} value={boothId} onChange={e => setBoothId(e.target.value)}>
                            <option value="">Semua Booth</option>
                            {booths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    <button className={styles.btnApply} onClick={handleApply}>Terapkan</button>
                </div>

                {/* Summary */}
                {!loading && rows.length > 0 && (
                    <div className={styles.summaryRow}>
                        {[
                            { label: 'Total Diproduksi', val: `${sumProduksi} cup`, color: 'var(--brown-900)' },
                            { label: 'Terjual', val: `${sumTerjual} cup`, color: '#16a34a' },
                            { label: 'Waste', val: `${sumWaste} cup`, color: '#dc2626' },
                            { label: 'Avg. Utilisasi', val: `${avgUtil}%`, color: utilizationColor(avgUtil) },
                        ].map(s => (
                            <div key={s.label} className={styles.summaryItem}>
                                <span className={styles.summaryVal} style={{ color: s.color }}>{s.val}</span>
                                <span className={styles.summaryLbl}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className={tableStyles.card} style={{ marginBottom: 16, padding: '20px 24px' }}>
                <div className={tableStyles.cardHeader} style={{ marginBottom: 16 }}>
                    <span className={tableStyles.cardTitle}>Terjual vs Waste per Booth</span>
                    <span style={{ fontSize: 12, color: 'var(--brown-400)' }}>
                        {applied.from} — {applied.to}
                    </span>
                </div>

                {loading ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-400)', fontSize: 13 }}>
                        Memuat data...
                    </div>
                ) : rows.length === 0 ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-400)', fontSize: 13 }}>
                        Tidak ada data pada periode ini
                    </div>
                ) : (
                    <div style={{ height: 300 }}>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                )}
            </div>

            {/* Tabel detail */}
            <div className={tableStyles.card}>
                <div className={tableStyles.cardHeader}>
                    <span className={tableStyles.cardTitle}>Detail per Booth</span>
                </div>
                <div className={tableStyles.tableWrap}>
                    <table className={tableStyles.table}>
                        <thead>
                            <tr>
                                <th>Booth</th>
                                <th>Total Batch</th>
                                <th>Diproduksi</th>
                                <th>Terjual</th>
                                <th>Waste</th>
                                <th>Expired</th>
                                <th>Damaged</th>
                                <th>Utilisasi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell} style={{ color: '#dc2626' }}>{error}</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={8} className={tableStyles.stateCell}>Tidak ada data</td></tr>
                            ) : rows.map(r => {
                                const utilRate = pct(Number(r.total_terjual), Number(r.total_produksi));
                                return (
                                    <tr key={r.booth_id}>
                                        <td style={{ fontWeight: 600 }}>{r.booth_name}</td>
                                        <td className={tableStyles.monoCell}>{r.total_batch}</td>
                                        <td className={tableStyles.monoCell}>{r.total_produksi} cup</td>
                                        <td className={tableStyles.monoCell} style={{ color: '#16a34a', fontWeight: 700 }}>
                                            {r.total_terjual} cup
                                        </td>
                                        <td className={tableStyles.monoCell} style={{ color: '#dc2626', fontWeight: 700 }}>
                                            {r.total_waste} cup
                                        </td>
                                        <td className={tableStyles.monoCell} style={{ color: 'var(--brown-500)' }}>
                                            {r.total_expired} cup
                                        </td>
                                        <td className={tableStyles.monoCell} style={{ color: 'var(--brown-500)' }}>
                                            {r.total_damaged} cup
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#f0e8df', overflow: 'hidden', minWidth: 60 }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 99,
                                                        width: `${utilRate}%`,
                                                        background: utilizationColor(utilRate),
                                                        transition: 'width 0.4s ease',
                                                    }} />
                                                </div>
                                                <UtilBadge rate={utilRate} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {rows.length > 1 && (
                            <tfoot>
                                <tr style={{ background: '#fdf8f3', fontWeight: 700 }}>
                                    <td>Total</td>
                                    <td className={tableStyles.monoCell}>
                                        {rows.reduce((s, r) => s + Number(r.total_batch), 0)}
                                    </td>
                                    <td className={tableStyles.monoCell}>{sumProduksi} cup</td>
                                    <td className={tableStyles.monoCell} style={{ color: '#16a34a' }}>{sumTerjual} cup</td>
                                    <td className={tableStyles.monoCell} style={{ color: '#dc2626' }}>{sumWaste} cup</td>
                                    <td className={tableStyles.monoCell}>
                                        {rows.reduce((s, r) => s + Number(r.total_expired), 0)} cup
                                    </td>
                                    <td className={tableStyles.monoCell}>
                                        {rows.reduce((s, r) => s + Number(r.total_damaged), 0)} cup
                                    </td>
                                    <td><UtilBadge rate={avgUtil} /></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}