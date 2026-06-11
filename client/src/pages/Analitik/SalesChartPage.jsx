// src/pages/Analitik/SalesChartPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import styles from './Analitik.module.css';
import { useApi } from '../../hooks/useApi';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
);

// ── Helpers ──────────────────────────────────────────────────
function toInputDate(d) { return new Date(d).toISOString().slice(0, 10); }

function defaultRange(preset = '30') {
    const to = new Date(), from = new Date();
    if (preset === '7') from.setDate(from.getDate() - 7);
    else if (preset === '30') from.setDate(from.getDate() - 30);
    else if (preset === '90') from.setDate(from.getDate() - 90);
    return { from: toInputDate(from), to: toInputDate(to) };
}

function formatRupiah(val) {
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
    return `Rp ${val}`;
}

function formatRupiahFull(val) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
}

// Granularitas label sumbu X berdasarkan range hari
function buildTrendLabels(rows, dayCount) {
    if (dayCount <= 14) {
        // Per hari — format "1 Jan"
        return rows.map(r => {
            const d = new Date(r.tanggal);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        });
    }
    if (dayCount <= 90) {
        // Per minggu — group, ambil label minggu pertama
        const seen = new Set();
        return rows.map(r => {
            const d = new Date(r.tanggal);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const key = toInputDate(weekStart);
            if (seen.has(key)) return '';
            seen.add(key);
            return weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        });
    }
    // Per bulan
    const seen = new Set();
    return rows.map(r => {
        const d = new Date(r.tanggal);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (seen.has(key)) return '';
        seen.add(key);
        return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    });
}

// Summary card kecil
function SummaryCard({ label, value, sub, accent }) {
    return (
        <div className={styles.summaryCard}>
            <div className={styles.summaryVal} style={{ color: accent }}>{value}</div>
            {sub && <div className={styles.summarySub}>{sub}</div>}
            <div className={styles.summaryLbl}>{label}</div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function SalesChartPage() {
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

    // Fetch tren harian
    const trendUrl = `/sales/chart/trend?from=${applied.from}&to=${applied.to}` +
        (applied.booth_id ? `&booth_id=${applied.booth_id}` : '');
    const { data: trendRaw, loading: trendLoading } = useApi(trendUrl);
    const trendRows = Array.isArray(trendRaw) ? trendRaw : [];

    // Fetch per booth
    const boothUrl = `/sales/chart/per-booth?from=${applied.from}&to=${applied.to}`;
    const { data: boothRaw, loading: boothLoading } = useApi(boothUrl);
    const boothRows = Array.isArray(boothRaw) ? boothRaw : [];

    useEffect(() => {
        if (preset === 'custom') return;
        const r = defaultRange(preset);
        setDateFrom(r.from);
        setDateTo(r.to);
    }, [preset]);

    function handleApply() {
        setApplied({ from: dateFrom, to: dateTo, booth_id: boothId });
    }

    // Hitung range hari
    const dayCount = useMemo(() => {
        const diff = new Date(applied.to) - new Date(applied.from);
        return Math.max(1, Math.round(diff / 86400000));
    }, [applied]);

    // Summary
    const totalPenjualan = trendRows.reduce((s, r) => s + Number(r.total_penjualan), 0);
    const totalTransaksi = trendRows.reduce((s, r) => s + Number(r.total_transaksi), 0);
    const avgHarian = trendRows.length ? Math.round(totalPenjualan / trendRows.length) : 0;
    const boothTerbaik = boothRows.length
        ? boothRows.reduce((a, b) => Number(a.total_penjualan) > Number(b.total_penjualan) ? a : b)
        : null;

    // ── Chart 1: Line (Tren Harian) ──
    const trendLabels = buildTrendLabels(trendRows, dayCount);
    const trendChartData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'Penjualan',
                data: trendRows.map(r => Number(r.total_penjualan)),
                borderColor: '#C4692A',
                backgroundColor: 'rgba(196,105,42,0.10)',
                pointBackgroundColor: '#C4692A',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: trendRows.length > 30 ? 2 : 5,
                pointHoverRadius: 7,
                tension: 0.35,
                fill: true,
                borderWidth: 2.5,
            },
        ],
    };

    const trendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#2C1A0E',
                titleColor: '#F5E6D8',
                bodyColor: '#E8C4A8',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    title: (items) => {
                        const idx = items[0]?.dataIndex;
                        if (idx === undefined) return '';
                        const r = trendRows[idx];
                        return new Date(r.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        });
                    },
                    label: (item) => ` ${formatRupiahFull(item.raw)}`,
                    afterLabel: (item) => {
                        const r = trendRows[item.dataIndex];
                        return ` ${r.total_transaksi} transaksi`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 11 },
                    color: '#A0643F',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10,
                },
            },
            y: {
                grid: { color: '#F5E6D8' },
                ticks: {
                    font: { size: 11 },
                    color: '#A0643F',
                    callback: v => formatRupiah(v),
                },
                beginAtZero: true,
            },
        },
    };

    // ── Chart 2: Bar (Per Booth) ──
    // Warna per booth
    const boothColors = [
        'rgba(196,105,42,0.85)',
        'rgba(46,125,82,0.85)',
        'rgba(37,99,235,0.8)',
        'rgba(217,119,6,0.85)',
        'rgba(124,58,237,0.8)',
        'rgba(220,38,38,0.8)',
    ];

    const boothChartData = {
        labels: boothRows.map(r => r.booth_name),
        datasets: [
            {
                label: 'Total Penjualan',
                data: boothRows.map(r => Number(r.total_penjualan)),
                backgroundColor: boothRows.map((_, i) => boothColors[i % boothColors.length]),
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const boothOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#2C1A0E',
                titleColor: '#F5E6D8',
                bodyColor: '#E8C4A8',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (item) => ` ${formatRupiahFull(item.raw)}`,
                    afterLabel: (item) => {
                        const r = boothRows[item.dataIndex];
                        return ` ${r.total_transaksi} transaksi`;
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
                grid: { color: '#F5E6D8' },
                ticks: {
                    font: { size: 11 },
                    color: '#A0643F',
                    callback: v => formatRupiah(v),
                },
                beginAtZero: true,
            },
        },
    };

    const PRESETS = [
        { val: '7', label: '7 Hari' },
        { val: '30', label: '30 Hari' },
        { val: '90', label: '90 Hari' },
        { val: 'custom', label: 'Custom' },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Analitik</span> › Grafik Penjualan
                </div>
                <h1 className={styles.pageTitle}>Grafik Penjualan</h1>
                <p className={styles.pageSubtitle}>
                    Tren penjualan harian dan perbandingan antar booth
                </p>
            </div>

            {/* Filter Card */}
            <div className={styles.filterCard}>
                <div className={styles.filterRow}>
                    {/* Preset */}
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Periode</label>
                        <div className={styles.presetGroup}>
                            {PRESETS.map(p => (
                                <button
                                    key={p.val}
                                    className={`${styles.presetBtn} ${preset === p.val ? styles.presetBtnActive : ''}`}
                                    onClick={() => setPreset(p.val)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom date */}
                    {preset === 'custom' && (
                        <>
                            <div className={styles.filterField}>
                                <label className={styles.filterLabel}>Dari</label>
                                <input
                                    type="date"
                                    className={styles.filterInput}
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div className={styles.filterField}>
                                <label className={styles.filterLabel}>Sampai</label>
                                <input
                                    type="date"
                                    className={styles.filterInput}
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Filter booth */}
                    <div className={styles.filterField}>
                        <label className={styles.filterLabel}>Booth</label>
                        <select
                            className={styles.filterInput}
                            value={boothId}
                            onChange={e => setBoothId(e.target.value)}
                        >
                            <option value="">Semua Booth</option>
                            {booths.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <button className={styles.btnApply} onClick={handleApply}>
                        Terapkan
                    </button>
                </div>

                {/* Summary row */}
                {!trendLoading && trendRows.length > 0 && (
                    <div className={styles.summaryRow}>
                        <SummaryCard
                            label="Total Penjualan"
                            value={formatRupiahFull(totalPenjualan)}
                            accent="var(--brown-900)"
                        />
                        <SummaryCard
                            label="Total Transaksi"
                            value={totalTransaksi.toLocaleString('id')}
                            sub="transaksi"
                            accent="#C4692A"
                        />
                        <SummaryCard
                            label="Rata-rata / Hari"
                            value={formatRupiahFull(avgHarian)}
                            accent="#2E7D52"
                        />
                        {boothTerbaik && (
                            <SummaryCard
                                label="Booth Terbaik"
                                value={boothTerbaik.booth_name}
                                sub={formatRupiahFull(Number(boothTerbaik.total_penjualan))}
                                accent="#C4692A"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Grafik 1 — Tren Harian */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <div>
                        <div className={styles.chartTitle}>Tren Penjualan Harian</div>
                        <div className={styles.chartSub}>
                            {applied.booth_id
                                ? `Booth: ${booths.find(b => String(b.id) === String(applied.booth_id))?.name ?? '—'}`
                                : 'Semua booth'
                            } · {applied.from} — {applied.to}
                        </div>
                    </div>
                    <div className={styles.chartBadge}>
                        {dayCount <= 14 ? 'Per Hari' : dayCount <= 90 ? 'Per Minggu' : 'Per Bulan'}
                    </div>
                </div>

                {trendLoading ? (
                    <div className={styles.chartEmpty}>Memuat data...</div>
                ) : trendRows.length === 0 ? (
                    <div className={styles.chartEmpty}>Tidak ada data pada periode ini</div>
                ) : (
                    <div className={styles.chartWrap}>
                        <Line data={trendChartData} options={trendOptions} />
                    </div>
                )}
            </div>

            {/* Grafik 2 — Per Booth */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <div>
                        <div className={styles.chartTitle}>Penjualan per Booth</div>
                        <div className={styles.chartSub}>
                            Perbandingan total penjualan · {applied.from} — {applied.to}
                        </div>
                    </div>
                    {/* Legend warna per booth */}
                    {boothRows.length > 0 && (
                        <div className={styles.boothLegend}>
                            {boothRows.map((r, i) => (
                                <div key={r.booth_id} className={styles.boothLegendItem}>
                                    <span
                                        className={styles.boothLegendDot}
                                        style={{ background: boothColors[i % boothColors.length] }}
                                    />
                                    {r.booth_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {boothLoading ? (
                    <div className={styles.chartEmpty}>Memuat data...</div>
                ) : boothRows.length === 0 ? (
                    <div className={styles.chartEmpty}>Tidak ada data pada periode ini</div>
                ) : (
                    <div className={styles.chartWrap} style={{ height: 280 }}>
                        <Bar data={boothChartData} options={boothOptions} />
                    </div>
                )}

                {/* Tabel mini di bawah bar chart */}
                {!boothLoading && boothRows.length > 0 && (
                    <div className={styles.boothTable}>
                        <table className={styles.miniTable}>
                            <thead>
                                <tr>
                                    <th>Booth</th>
                                    <th>Transaksi</th>
                                    <th>Total Penjualan</th>
                                    <th>% dari Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boothRows.map((r, i) => {
                                    const penjualan = Number(r.total_penjualan);
                                    const totalAll = boothRows.reduce((s, b) => s + Number(b.total_penjualan), 0);
                                    const pct = totalAll ? Math.round((penjualan / totalAll) * 100) : 0;
                                    return (
                                        <tr key={r.booth_id}>
                                            <td>
                                                <div className={styles.boothNameCell}>
                                                    <span
                                                        className={styles.boothDot}
                                                        style={{ background: boothColors[i % boothColors.length] }}
                                                    />
                                                    {r.booth_name}
                                                </div>
                                            </td>
                                            <td className={styles.monoCell}>{Number(r.total_transaksi).toLocaleString('id')}</td>
                                            <td className={styles.monoCell} style={{ fontWeight: 700, color: '#2C1A0E' }}>
                                                {formatRupiahFull(penjualan)}
                                            </td>
                                            <td>
                                                <div className={styles.pctCell}>
                                                    <div className={styles.pctBar}>
                                                        <div
                                                            className={styles.pctFill}
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: boothColors[i % boothColors.length],
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={styles.pctNum}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
