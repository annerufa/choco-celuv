// src/pages/StokBooth/StokBoothMatrix.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import styles from './DataBarangBooth.module.css';
import SetupBarangBoothModal from '../../components/BoothTable/SetupBarangBoothModal';
import toast from 'react-hot-toast';

import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { getStatsStokBooth } from '../../components/StatsGrid/statsConfig';


const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
// ── Helpers ──────────────────────────────────────────────────────────────────

function getStokStatus(stok, min, max, safetyStock) {
    if (stok <= 0) return 'Habis';
    if (stok <= safetyStock) return 'Kritis';  // di bawah safety stock = darurat
    if (stok <= min) return 'Menipis';          // sudah waktunya order
    if (stok > max) return 'Overstock';         // terlalu banyak
    return 'Aman';
}


function buildMatrix(rows) {
    const itemMap = {};
    const boothMap = {};

    rows.forEach(row => {
        // collect booths
        if (!boothMap[row.location_id]) {
            boothMap[row.location_id] = { id: row.location_id, name: row.booth_name };
        }
        // collect items
        if (!itemMap[row.item_id]) {
            itemMap[row.item_id] = {
                id: row.item_id,
                name: row.item_name,
                category: row.category,
                booths: {},
            };
        }
        if (!row.is_active) {
            itemMap[row.item_id].booths[row.location_id] = null;
        } else {
            const stok = parseFloat(row.current_stock ?? 0);
            const min = row.min_qty ?? 0;
            const max = row.max_qty ?? 0;
            const safety_stock = row.safety_stock ?? 0;
            itemMap[row.item_id].booths[row.location_id] = {
                status: getStokStatus(stok, min, max, safety_stock),
                stok, min, max, safety_stock,
                unit: row.unit ?? '',
            };
        }
    });

    return {
        items: Object.values(itemMap),
        booths: Object.values(boothMap).sort((a, b) => a.id - b.id),
    };
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_META = {
    Aman: { cls: styles.pillAman, dot: styles.dotAman },
    Menipis: { cls: styles.pillMenipis, dot: styles.dotMenipis },
    Kritis: { cls: styles.pillKritis, dot: styles.dotKritis },
    Habis: { cls: styles.pillHabis, dot: styles.dotHabis },
    Overstock: { cls: styles.pillOverstock, dot: styles.dotOverstock },
};

const STATUS_OPTIONS = ['Kritis', 'Habis', 'Menipis', 'Aman', 'Overstock'];

function StatusPill({ entry, boothName }) {
    if (entry === undefined || entry === null) {
        return <span className={`${styles.pill} ${styles.pillNonaktif}`}>—</span>;
    }

    const meta = STATUS_META[entry.status] ?? STATUS_META['Aman'];

    return (
        <span className={`${styles.pillWrap}`}>
            <span className={`${styles.pill} ${meta.cls}`}>
                <span className={`${styles.dot} ${meta.dot}`} />
                {entry.status}
            </span>
            <div className={styles.tooltipPop}>
                <div className={styles.tooltipBooth}>{boothName}</div>
                <div className={styles.tooltipRow}>
                    <span className={styles.tooltipLabel}>Stok</span>
                    <span className={styles.tooltipVal}>{Math.round(entry.stok)} {entry.unit}</span>
                </div>
                <div className={styles.tooltipRow}>
                    <span className={styles.tooltipLabel}>Min</span>
                    <span className={styles.tooltipVal}>{Math.round(entry.min)} {entry.unit}</span>
                </div>
                <div className={styles.tooltipRow}>
                    <span className={styles.tooltipLabel}>Max</span>
                    <span className={styles.tooltipVal}>{Math.round(entry.max)} {entry.unit}</span>
                </div>
            </div>
        </span>
    );
}
function SummaryCard({ label, value, color }) {
    return (
        <div className={styles.sumCard}>
            <span className={styles.sumValue} style={color ? { color } : undefined}>{value}</span>
            <span className={styles.sumLabel}>{label}</span>
        </div>
    );
}
function getToken() {
    return localStorage.getItem('token');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataBarangBoothPage() {
    const navigate = useNavigate();
    const { data: rawData, loading, error, fetchData } = useApi('/items/matrix');

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBooth, setFilterBooth] = useState('');
    const [setupModal, setSetupModal] = useState({ open: false, item: null, settings: [] });



    async function handleSetupSubmit(itemId, changedBooths) {
        try {
            const res = await fetch(`${BASE_URL}/items/${itemId}/booth-settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ booths: changedBooths }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? json.message ?? 'Gagal menambahkan barang');

            const itemName = setupModal.item.name; // simpan dulu sebelum di-reset
            toast.success(`${itemName} berhasil di set up!`);

            setSetupModal({ open: false, item: null, settings: [] });
            fetchData(); // refresh tabel utama
        } catch (err) {
            console.error('Gagal menyimpan:', err);
        }
    }


    const { items, booths } = rawData?.length
        ? buildMatrix(rawData)
        : { items: [], booths: [] };

    function openSetup(item) {
        const settings = booths.map(booth => ({
            booth_id: booth.id,
            booth_name: booth.name,
            safety_stock: item.booths[booth.id]?.safety_stock ?? 0,
            min: item.booths[booth.id]?.min ?? 0,
            max: item.booths[booth.id]?.max ?? 0,
            is_active: item.booths[booth.id] !== null,
        }));
        setSetupModal({ open: true, item, settings });
    }

    // ── Filter ────────────────────────────────────────────────────────────────
    const visibleBooths = filterBooth
        ? booths.filter(b => String(b.id) === filterBooth)
        : booths;

    const filteredItems = items.filter(item => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterStatus) {
            const hasStatus = visibleBooths.some(b => item.booths[b.id]?.status === filterStatus);
            if (!hasStatus) return false;
        }
        return true;
    });

    // ── Summary counts ────────────────────────────────────────────────────────
    const allEntries = items.flatMap(i => Object.values(i.booths)).filter(Boolean);
    const count = s => allEntries.filter(e => e?.status === s).length;
    const statsStok = {
        // aman: count('Aman'),
        menipis: count('Menipis'),
        kritis: count('Kritis'),
        habis: count('Habis'),
        overstock: count('Overstock'),
    };
    const stats = getStatsStokBooth(statsStok);

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Barang</span>
                    <span className={styles.breadcrumbSep}>›</span>
                    Stok per Booth
                </div>
                <h1 className={styles.pageTitle}>Data Barang Booth</h1>
                <p className={styles.pageSubtitle}>Monitor stok semua barang di booth</p>
            </div>

            {/* Summary */}
            <StatsGrid stats={stats} />



            {/* Table */}
            <div className={styles.card}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <span className={styles.cardTitle}>Daftar Barang — Booth</span>
                    <div className={styles.searchBox}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari item..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className={styles.select}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">Semua status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        className={styles.select}
                        value={filterBooth}
                        onChange={e => setFilterBooth(e.target.value)}
                    >
                        <option value="">Semua booth</option>
                        {booths.map(b => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                        ))}
                    </select>
                    <hr />
                </div>
                <div className={styles.tableWrap}>
                    {loading ? (
                        <div className={styles.stateMsg}>Memuat data...</div>
                    ) : error ? (
                        <div className={`${styles.stateMsg} ${styles.stateMsgError}`}>Gagal memuat data</div>
                    ) : filteredItems.length === 0 ? (
                        <div className={styles.stateMsg}>Tidak ada data ditemukan</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={`${styles.thSticky} ${styles.thStickyFirst}`}>Item</th>
                                    <th className={`${styles.thSticky} ${styles.thStickySecond}`}>Aksi</th>
                                    {visibleBooths.map(b => (
                                        <th key={b.id} className={styles.thBooth}>{b.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id}>
                                        <td className={`${styles.tdSticky} ${styles.tdStickyFirst}`}>
                                            <div className={styles.itemCell}>
                                                <div className={styles.itemInfo}>
                                                    <span className={styles.itemName}>{item.name}</span>
                                                    <span className={styles.itemCat}>{item.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${styles.tdSticky} ${styles.tdStickySecond}`}>
                                            <div className={styles.itemCell}>
                                                <button
                                                    className={styles.iconBtn}
                                                    onClick={() => openSetup(item)}   // ← ganti ini
                                                    aria-label={`Set up ${item.name}`}
                                                    title="Set up data barang"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className={styles.detailBtn}
                                                    onClick={() => navigate(`/barang-booth/${item.id}`)}
                                                    aria-label={`Detail ${item.name}`}
                                                    title="Lihat detail"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        {visibleBooths.map(b => (
                                            <td key={b.id} className={styles.tdCenter}>
                                                <StatusPill
                                                    entry={item.booths[b.id] ?? null}
                                                    boothName={b.name}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className={styles.tableFooter}>
                    Menampilkan {filteredItems.length} dari {items.length} item
                    {visibleBooths.length < booths.length && ` · ${visibleBooths.length} booth`}
                </div>
            </div>

            <SetupBarangBoothModal
                isOpen={setupModal.open}
                onClose={() => setSetupModal({ open: false, item: null, settings: [] })}
                onSubmit={handleSetupSubmit}
                item={setupModal.item}
                boothSettings={setupModal.settings}
            />
        </div>
    );
}