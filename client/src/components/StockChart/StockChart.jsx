import { useRef, useEffect, useState } from 'react';
import styles from './StockChart.module.css';
import { useAuth } from '../../context/AuthContext';
// import { useApi } from '../../hooks/useApi';

// const SCALE_MAX_DEFAULT = 320;

// pct      = stok / max * 100   -> 100% berarti stok pas di batas maksimum
// minPct   = min  / max * 100   -> posisi garis "min" relatif terhadap max
function getStatus(pct, minPct) {
    if (pct < minPct / 2) return { color: '#EF4444', bg: '#FEE2E2', label: 'Kritis', textColor: '#B91C1C' };
    if (pct < minPct) return { color: '#F59E0B', bg: '#FEF3C7', label: 'Waspada', textColor: '#92400E' };
    if (pct > 100) return { color: '#7C3AED', bg: '#EDE9FE', label: 'Overstock', textColor: '#5B21B6' };
    return { color: '#2E7D52', bg: '#D1FAE5', label: 'Aman', textColor: '#166534' };
}

function ChartTooltip({ item, position }) {
    if (!item) return null;
    const pct = Math.round((item.stok / item.max) * 100);
    const minPct = Math.round((item.min / item.max) * 100);
    const status = getStatus(pct, minPct);
    const selisihMin = item.stok - item.min;
    const selisihMax = item.max - item.stok;
    const statusColors = {
        Kritis: '#FCA5A5', Waspada: '#FCD34D',
        Aman: '#6EE7B7', Overstock: '#C4B5FD'
    };
    return (
        <div className={styles.tooltip} style={{ top: position.y, left: position.x }}>
            <div className={styles.tooltipTitle}>{item.name}</div>
            <div>Stok saat ini : <b>{item.stok.toLocaleString('id')} {item.satuan}</b></div>
            <div>Batas minimum : <b>{item.min.toLocaleString('id')} {item.satuan}</b></div>
            <div>Batas maksimum: <b>{item.max.toLocaleString('id')} {item.satuan}</b></div>
            <div className={styles.tooltipDivider}>
                {selisihMin < 0
                    ? <>Kurang dari min: <b style={{ color: '#FCA5A5' }}>{Math.abs(selisihMin).toLocaleString('id')} {item.satuan}</b></>
                    : selisihMax < 0
                        ? <>Melebihi max: <b style={{ color: '#C4B5FD' }}>+{Math.abs(selisihMax).toLocaleString('id')} {item.satuan}</b></>
                        : <>Sisa ke max: <b style={{ color: '#6EE7B7' }}>{selisihMax.toLocaleString('id')} {item.satuan}</b></>
                }
            </div>
            <div>Status: <b style={{ color: statusColors[status.label] }}>{status.label} ({pct}% dari max)</b></div>
        </div>
    );
}

export default function StockChart() {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const metaRef = useRef(null);
    const [tooltip, setTooltip] = useState({ item: null, position: { x: 0, y: 0 } });
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Fetch data ──
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/items/perLoc?location_id=${user.location_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(res => {
                const raw = Array.isArray(res) ? res
                    : Array.isArray(res.payload) ? res.payload
                        : Array.isArray(res.payload?.data) ? res.payload.data
                            : [];

                const mapped = raw
                    .filter(i => i.is_active && i.min_qty > 0)
                    .map(i => ({
                        name: i.name,
                        satuan: i.unit,
                        stok: Number(i.current_stock ?? 0),
                        min: Number(i.min_qty),
                        max: Number(i.max_qty) || Number(i.min_qty) * 3,
                    }));
                setStockData(mapped);
                setLoading(false);
            })
    }, []);

    // ── Render chart ──
    function renderChart(data) {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        // pct = stok/max*100 -> 100% = pas di batas maksimum
        const SCALE_MAX = Math.max(
            100,
            ...data.map(d => Math.round((d.stok / d.max) * 100))
        ) + 20;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.parentElement.clientWidth;
        const n = data.length;

        const padL = 16, padR = 16, padT = 24, padB = 44;
        const barH = 26, gap = 16;
        const totalH = padT + padB + n * (barH + gap) - gap;

        canvas.width = W * dpr;
        canvas.height = totalH * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = totalH + 'px';
        ctx.scale(dpr, dpr);

        const labelW = 138, valueW = 86;
        const chartX = padL + labelW;
        const chartW = W - chartX - valueW - padR;
        const toX = pct => chartX + (pct / SCALE_MAX) * chartW;

        ctx.clearRect(0, 0, W, totalH);

        [0, 50, 100].forEach(pct => {
            const x = toX(pct);
            ctx.beginPath();
            ctx.moveTo(x, padT - 8);
            ctx.lineTo(x, totalH - padB);
            ctx.strokeStyle = pct === 100 ? '#7C3AED' : '#F5E6D8';
            ctx.lineWidth = pct === 100 ? 1.5 : 1;
            ctx.setLineDash(pct === 100 ? [4, 3] : []);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = pct === 100 ? '#5B21B6' : '#A0643F';
            ctx.font = `${pct === 100 ? '600' : '400'} 10px DM Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(pct + '%', x, totalH - padB + 16);
        });

        ctx.fillStyle = '#A0643F';
        ctx.font = '10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('% dari batas maksimum stok', chartX + chartW / 2, totalH - padB + 32);

        ctx.fillStyle = '#5B21B6';
        ctx.font = '9px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('max', toX(100), padT - 12);

        data.forEach((item, i) => {
            const pct = Math.round((item.stok / item.max) * 100);
            const minPct = Math.round((item.min / item.max) * 100);
            const status = getStatus(pct, minPct);
            const y = padT + i * (barH + gap);
            const barW = Math.min((pct / SCALE_MAX) * chartW, chartW);
            const minX = toX(minPct);
            const maxX = toX(100);

            ctx.beginPath();
            ctx.roundRect(chartX, y, chartW, barH, 5);
            ctx.fillStyle = '#F5E6D8';
            ctx.fill();

            // Zona "Aman": antara garis min dan garis max
            const safeStartX = Math.max(minX, chartX);
            const safeEndX = Math.min(maxX, chartX + chartW);
            if (safeEndX > safeStartX) {
                ctx.beginPath();
                ctx.roundRect(safeStartX, y, safeEndX - safeStartX, barH, 0);
                ctx.fillStyle = '#D1FAE599';
                ctx.fill();
            }

            // Zona "Overstock": di atas garis max
            if (maxX < chartX + chartW) {
                ctx.beginPath();
                ctx.roundRect(maxX, y, chartX + chartW - maxX, barH, [0, 5, 5, 0]);
                ctx.fillStyle = '#EDE9FE99';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.roundRect(chartX, y, Math.max(barW, 6), barH, 5);
            ctx.fillStyle = status.color;
            ctx.globalAlpha = 0.88;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Garis "min" (per item, posisinya beda-beda) & garis "max" (tetap di 100%)
            [[minX, '#EF4444'], [maxX, '#7C3AED']].forEach(([x, color]) => {
                ctx.save();
                ctx.setLineDash([4, 3]);
                ctx.beginPath();
                ctx.moveTo(x, y - 2);
                ctx.lineTo(x, y + barH + 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            });

            if (i === 0) {
                ctx.fillStyle = '#EF4444';
                ctx.font = '9px Plus Jakarta Sans, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('min', minX, padT - 12);
            }

            ctx.fillStyle = status.textColor;
            ctx.font = `${pct < minPct || pct > 100 ? '600' : '500'} 12px Plus Jakarta Sans, sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(item.name, chartX - 8, y + barH / 2 + 4);

            ctx.fillStyle = status.textColor;
            ctx.font = '700 11px DM Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(pct + '%', chartX + barW + 8, y + barH / 2 + 4);

            const pillX = chartX + barW + 44;
            const pillW = 56, pillH = 16;
            if (pillX + pillW < W - padR) {
                ctx.beginPath();
                ctx.roundRect(pillX, y + barH / 2 - pillH / 2, pillW, pillH, 8);
                ctx.fillStyle = status.bg;
                ctx.fill();
                ctx.fillStyle = status.textColor;
                ctx.font = '600 9px Plus Jakarta Sans, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(status.label, pillX + pillW / 2, y + barH / 2 + 3.5);
            }
        });

        metaRef.current = { chartX, chartW, padT, barH, gap };
    }

    // Re-render saat data berubah atau resize
    useEffect(() => {
        if (stockData.length === 0) return;
        renderChart(stockData);
        const handleResize = () => renderChart(stockData);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [stockData]);

    function handleMouseMove(e) {
        const m = metaRef.current;
        if (!m) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const my = e.clientY - rect.top;
        const idx = Math.floor((my - m.padT) / (m.barH + m.gap));
        if (idx < 0 || idx >= stockData.length) {
            setTooltip({ item: null, position: { x: 0, y: 0 } });
            return;
        }
        setTooltip({ item: stockData[idx], position: { x: e.clientX + 16, y: e.clientY - 10 } });
    }

    function handleMouseLeave() {
        setTooltip({ item: null, position: { x: 0, y: 0 } });
    }

    if (loading) return (
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#A0643F' }}>
            Memuat data stok...
        </div>
    );

    if (error) return (
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
            Gagal memuat data: {error}
        </div>
    );

    if (stockData.length === 0) return (
        <div className={styles.card} style={{ padding: '40px', textAlign: 'center', color: '#A0643F' }}>
            Tidak ada data stok di gudang pusat.
        </div>
    );

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Stok Saat Ini vs Batas Maksimum</span>
                <div className={styles.cardActions}>
                    <div className={styles.legend}>
                        {[
                            { color: '#EF4444', label: 'Kritis (< 50% dari min)' },
                            { color: '#F59E0B', label: 'Waspada (di bawah min)' },
                            { color: '#2E7D52', label: 'Aman' },
                            { color: '#7C3AED', label: 'Overstock' },
                        ].map(item => (
                            <div key={item.label} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: item.color }} />
                                {item.label}
                            </div>
                        ))}
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendLine} ${styles.legendLineMin}`} />min
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendLine} ${styles.legendLineMax}`} />max
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.canvasWrapper}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />
            </div>
            <ChartTooltip item={tooltip.item} position={tooltip.position} />
        </div>
    );
}