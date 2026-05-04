// src/components/StockChart/StockChart.jsx
import { useRef, useEffect, useState } from 'react';
import styles from './StockChart.module.css';

// ── Data stok ───────────────────────────────────────
const stockData = [
    { name: 'Bubuk Coklat A', satuan: 'kg', stok: 15, min: 10, max: 30 },
    { name: 'Bubuk Coklat B', satuan: 'kg', stok: 3.8, min: 20, max: 60 },
    { name: 'Susu Full Cream', satuan: 'kotak', stok: 18, min: 10, max: 30 },
    { name: 'Susu Carnation', satuan: 'kaleng', stok: 40, min: 50, max: 300 },
    // { name: 'Gula Pasir', satuan: 'gram', stok: 950, min: 1000, max: 3000 },
    // { name: 'Air Mineral', satuan: 'ml', stok: 2500, min: 2000, max: 6000 },
    { name: 'Cup Plastik 12oz', satuan: 'pcs', stok: 500, min: 100, max: 500 },
    { name: 'Cup Plastik 14oz', satuan: 'pcs', stok: 60, min: 80, max: 350 },
    { name: 'Cup Plastik 16oz', satuan: 'pcs', stok: 250, min: 50, max: 300 },
    { name: 'Sedotan', satuan: 'pak', stok: 5, min: 3, max: 10 },
    { name: 'Tisu', satuan: 'pcs', stok: 20, min: 10, max: 50 },
    // { name: 'Es Batu', satuan: 'gram', stok: 400, min: 2000, max: 5000 },
];

const SCALE_MAX = Math.max(...stockData.map(d => Math.round((d.max / d.min) * 100))) + 20;

function getStatus(pct, maxPct) {
    if (pct < 50) return { color: '#EF4444', bg: '#FEE2E2', label: 'Kritis', textColor: '#B91C1C' };
    if (pct < 100) return { color: '#F59E0B', bg: '#FEF3C7', label: 'Waspada', textColor: '#92400E' };
    if (pct > maxPct) return { color: '#7C3AED', bg: '#EDE9FE', label: 'Overstock', textColor: '#5B21B6' };
    return { color: '#2E7D52', bg: '#D1FAE5', label: 'Aman', textColor: '#166534' };
}

// ── Tooltip component ───────────────────────────────
// Dipisah jadi component sendiri supaya StockChart tidak terlalu panjang
function ChartTooltip({ item, position }) {
    if (!item) return null;

    const pct = Math.round((item.stok / item.min) * 100);
    const maxPct = Math.round((item.max / item.min) * 100);
    const status = getStatus(pct, maxPct);
    const selisihMin = item.stok - item.min;
    const selisihMax = item.max - item.stok;
    const statusColors = {
        Kritis: '#FCA5A5', Waspada: '#FCD34D',
        Aman: '#6EE7B7', Overstock: '#C4B5FD'
    };

    return (
        <div
            className={styles.tooltip}
            style={{ top: position.y, left: position.x }}
        >
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
            <div>
                Status: <b style={{ color: statusColors[status.label] }}>
                    {status.label} ({pct}% dari min)
                </b>
            </div>
        </div>
    );
}

// ── Main component ──────────────────────────────────
export default function StockChart() {
    const canvasRef = useRef(null);
    const metaRef = useRef(null); // simpan meta chart untuk keperluan hover
    const [tooltip, setTooltip] = useState({ item: null, position: { x: 0, y: 0 } });

    // ── Fungsi render canvas ──
    function renderChart() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.parentElement.clientWidth;
        const n = stockData.length;

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

        // Grid & labels sumbu X
        [0, 50, 100].forEach(pct => {
            const x = toX(pct);
            ctx.beginPath();
            ctx.moveTo(x, padT - 8);
            ctx.lineTo(x, totalH - padB);
            ctx.strokeStyle = pct === 100 ? '#C68A6A' : pct === 0 ? '#E8C4A8' : '#F5E6D8';
            ctx.lineWidth = pct === 100 ? 1.5 : 1;
            ctx.setLineDash(pct === 100 ? [4, 3] : []);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = pct === 100 ? '#D4500A' : '#A0643F';
            ctx.font = `${pct === 100 ? '600' : '400'} 10px DM Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(pct + '%', x, totalH - padB + 16);
        });

        ctx.fillStyle = '#A0643F';
        ctx.font = '10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('% dari batas minimum restock', chartX + chartW / 2, totalH - padB + 32);

        ctx.fillStyle = '#D4500A';
        ctx.font = '9px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('min', toX(100), padT - 12);

        // Draw bars
        stockData.forEach((item, i) => {
            const pct = Math.round((item.stok / item.min) * 100);
            const maxPct = Math.round((item.max / item.min) * 100);
            const status = getStatus(pct, maxPct);
            const y = padT + i * (barH + gap);
            const barW = Math.min((pct / SCALE_MAX) * chartW, chartW);
            const maxX = toX(maxPct);

            // Track
            ctx.beginPath();
            ctx.roundRect(chartX, y, chartW, barH, 5);
            ctx.fillStyle = '#F5E6D8';
            ctx.fill();

            // Zone aman
            const safeEndX = Math.min(maxX, chartX + chartW);
            if (safeEndX > toX(100)) {
                ctx.beginPath();
                ctx.roundRect(toX(100), y, safeEndX - toX(100), barH, 0);
                ctx.fillStyle = '#D1FAE599';
                ctx.fill();
            }

            // Zone overstock
            if (maxX < chartX + chartW) {
                ctx.beginPath();
                ctx.roundRect(maxX, y, chartX + chartW - maxX, barH, [0, 5, 5, 0]);
                ctx.fillStyle = '#EDE9FE99';
                ctx.fill();
            }

            // Bar stok
            ctx.beginPath();
            ctx.roundRect(chartX, y, Math.max(barW, 6), barH, 5);
            ctx.fillStyle = status.color;
            ctx.globalAlpha = 0.88;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Garis min & max
            [[toX(100), '#EF4444'], [maxX, '#7C3AED']].forEach(([x, color]) => {
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
                ctx.fillStyle = '#7C3AED';
                ctx.font = '9px Plus Jakarta Sans, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('max', maxX, padT - 12);
            }

            // Label nama & nilai
            ctx.fillStyle = status.textColor;
            ctx.font = `${pct < 100 || pct > maxPct ? '600' : '500'} 12px Plus Jakarta Sans, sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(item.name, chartX - 8, y + barH / 2 + 4);

            ctx.fillStyle = status.textColor;
            ctx.font = '700 11px DM Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(pct + '%', chartX + barW + 8, y + barH / 2 + 4);

            // Status pill
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

        // Simpan meta untuk hover
        metaRef.current = { chartX, chartW, padT, barH, gap };
    }

    // ── useEffect: render saat mount & resize ──
    useEffect(() => {
        renderChart();

        const handleResize = () => renderChart();
        window.addEventListener('resize', handleResize);

        // Cleanup: hapus event listener saat component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []); // [] = hanya sekali saat mount

    // ── Handler hover tooltip ──
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
        setTooltip({
            item: stockData[idx],
            position: { x: e.clientX + 16, y: e.clientY - 10 },
        });
    }

    function handleMouseLeave() {
        setTooltip({ item: null, position: { x: 0, y: 0 } });
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Stok Saat Ini vs Batas Minimum</span>
                <div className={styles.cardActions}>
                    <div className={styles.legend}>

                        {/* Kotak warna */}
                        {[
                            { color: '#EF4444', label: 'Kritis <50%' },
                            { color: '#F59E0B', label: 'Waspada 50–99%' },
                            { color: '#2E7D52', label: 'Aman' },
                            { color: '#7C3AED', label: 'Overstock' },
                        ].map(item => (
                            <div key={item.label} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: item.color }} />
                                {item.label}
                            </div>
                        ))}

                        {/* Garis putus */}
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendLine} ${styles.legendLineMin}`} />
                            min
                        </div>
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendLine} ${styles.legendLineMax}`} />
                            max
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


            {/* Tooltip — render sebagai React component, bukan div manual */}
            <ChartTooltip item={tooltip.item} position={tooltip.position} />
        </div>
        // <div className={styles.card}>
        //     {/* Header */}
        //     <div className={styles.cardHeader}>
        //         <span className={styles.cardTitle}>Stok Saat Ini vs Batas Minimum</span>
        //         <div className={styles.legend}>
        //             {[
        //                 { color: '#EF4444', label: 'Kritis <50%' },
        //                 { color: '#F59E0B', label: 'Waspada 50–99%' },
        //                 { color: '#2E7D52', label: 'Aman' },
        //                 { color: '#7C3AED', label: 'Overstock' },
        //             ].map(item => (
        //                 <div key={item.label} className={styles.legendItem}>
        //                     <span className={styles.legendDot} style={{ background: item.color }} />
        //                     {item.label}
        //                 </div>
        //             ))}
        //         </div>
        //     </div>

        //     {/* Canvas */}
        //     <div className={styles.canvasWrapper}>
        //         <canvas
        //             ref={canvasRef}
        //             onMouseMove={handleMouseMove}
        //             onMouseLeave={handleMouseLeave}
        //             style={{ display: 'block', width: '100%' }}
        //         />
        //     </div>

        //     {/* Tooltip — render sebagai React component, bukan div manual */}
        //     <ChartTooltip item={tooltip.item} position={tooltip.position} />
        // </div>
    );
}