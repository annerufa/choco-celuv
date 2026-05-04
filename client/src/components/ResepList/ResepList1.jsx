// src/components/ResepList/ResepList.jsx
import { useState, useEffect, useMemo } from 'react';
import styles from './ResepList.module.css';

// ── Icon map berdasarkan tipe ─────────────────────────────────
const RESEP_ICON = {
    mix: '🫙',
    adonan: '🥤',
};

// ── Helper: format tanggal relatif ───────────────────────────
function relativeDate(isoString) {
    if (!isoString) return '—';
    const now = new Date();
    const then = new Date(isoString);
    const diffH = Math.round((now - then) / 36e5);
    if (diffH < 1) return 'Baru saja';
    if (diffH < 24) return 'Hari ini';
    if (diffH < 48) return 'Kemarin';
    return `${Math.floor(diffH / 24)} hari lalu`;
}

// ── Helper: capitalize first letter ──────────────────────────
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────────────────────────
// Sub-komponen: ResepCard
// ─────────────────────────────────────────────────────────────
function ResepCard({ resep, selected, onClick }) {
    return (
        <div
            className={`${styles.resepCard} ${selected ? styles.selected : ''}`}
            onClick={onClick}
        >
            {/* Head */}
            <div className={styles.rcHead}>
                <div className={styles.rcHeadLeft}>
                    <div
                        className={styles.rcIcon}
                        style={{ background: resep.type === 'mix' ? '#FEE8D8' : '#DBEAFE' }}
                    >
                        {RESEP_ICON[resep.type] ?? '📋'}
                    </div>
                    <div>
                        <div className={styles.rcTitle}>{resep.name}</div>
                        {resep.notes && (
                            <div className={styles.rcSub}>{resep.notes}</div>
                        )}
                    </div>
                </div>
                <div className={styles.rcBadges}>
                    <span className={`${styles.badge} ${styles[`badge${capitalize(resep.type)}`]}`}>
                        {capitalize(resep.type)}
                    </span>
                </div>
            </div>

            {/* Bahan preview (maks 4) */}
            <div className={styles.bahanList}>
                {(resep.bahan ?? []).slice(0, 4).map(b => (
                    <div key={b.item_id} className={styles.bahanRow}>
                        <span className={styles.bahanName}>
                            {b.item_name ?? `Item #${b.item_id}`}
                        </span>
                        <span className={styles.bahanQty}>
                            {b.qty_per_unit} {b.unit ?? ''}
                        </span>
                    </div>
                ))}
                {(resep.bahan ?? []).length > 4 && (
                    <div className={styles.bahanMore}>
                        +{resep.bahan.length - 4} bahan lainnya
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.rcFoot}>
                <div>
                    <div className={styles.rcFootLbl}>Output</div>
                    <div className={styles.rcFootVal}>
                        {resep.output_qty} {resep.output_unit}
                    </div>
                </div>
                <div>
                    <div className={styles.rcFootLbl}>Terakhir dibuat</div>
                    <div className={styles.rcFootVal}>{relativeDate(resep.last_made)}</div>
                </div>
                <div>
                    <div className={styles.rcFootLbl}>Total bahan</div>
                    <div className={styles.rcFootVal}>{(resep.bahan ?? []).length} item</div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Sub-komponen: DetailPanel
// ─────────────────────────────────────────────────────────────
function DetailPanel({ resep, onEdit, onProduksi }) {
    if (!resep) {
        return (
            <div className={styles.detailPanel}>
                <div className={styles.detailEmpty}>
                    <span>Pilih resep untuk melihat detail</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.detailPanel}>
            {/* Head */}
            <div className={styles.dpHead}>
                <div
                    className={styles.dpIcon}
                    style={{ background: resep.type === 'mix' ? '#FEE8D8' : '#DBEAFE' }}
                >
                    {RESEP_ICON[resep.type] ?? '📋'}
                </div>
                <div className={styles.dpMeta}>
                    <div className={styles.dpTitleRow}>
                        <span className={styles.dpTitle}>{resep.name}</span>
                        <span className={`${styles.badge} ${styles[`badge${capitalize(resep.type)}`]}`}>
                            {capitalize(resep.type)}
                        </span>
                    </div>
                    <div className={styles.dpSubMeta}>
                        <span>{(resep.bahan ?? []).length} bahan</span>
                        <span>·</span>
                        <span>Output: {resep.output_qty} {resep.output_unit}</span>
                        {resep.expiry_hours && (
                            <>
                                <span>·</span>
                                <span>Kadaluarsa: {resep.expiry_hours} jam</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className={styles.dpBody}>
                {resep.notes && (
                    <div className={styles.dpNotes}>{resep.notes}</div>
                )}

                <div className={styles.dpSectionTitle}>Bahan-bahan</div>

                {(resep.bahan ?? []).map(b => (
                    <div key={b.item_id} className={styles.bahanDetailRow}>
                        <div className={styles.bahanDot} />
                        <div className={styles.bahanDetailName}>
                            {b.item_name ?? `Item #${b.item_id}`}
                        </div>
                        <div className={styles.bahanDetailQty}>
                            {b.qty_per_unit} {b.unit ?? ''}
                        </div>
                    </div>
                ))}

                <div className={styles.dpActions}>
                    <button className={styles.btnGhost} onClick={() => onEdit?.(resep)}>
                        Edit Resep
                    </button>
                    <button className={styles.btnPrimary} onClick={() => onProduksi?.(resep)}>
                        Catat Produksi
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Komponen utama: ResepList
// ─────────────────────────────────────────────────────────────
export default function ResepList({
    resepList,
    loading,
    error,
    onCreate,
    onUpdate,
    onDelete,
}) {
    const [activeTab, setActiveTab] = useState('semua');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // Di dalam ResepList, setelah semua state:
    useEffect(() => {
        if (resepList.length > 0 && selectedId === null) {
            setSelectedId(resepList[0].id);
        }
    }, [resepList]);

    // ── Filter ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return resepList.filter(r => {
            const matchTab = activeTab === 'semua' || r.type === activeTab;
            const matchSearch =
                (r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (r.notes ?? '').toLowerCase().includes(search.toLowerCase());
            return matchTab && matchSearch;
        });
    }, [resepList, activeTab, search]);

    const selectedResep = resepList.find(r => r.id === selectedId) ?? null;

    // ── Tab counts ────────────────────────────────────────────
    const counts = {
        semua: resepList.length,
        mix: resepList.filter(r => r.type === 'mix').length,
        adonan: resepList.filter(r => r.type === 'adonan').length,
    };

    const tabs = [
        { key: 'semua', label: 'Semua Resep' },
        { key: 'mix', label: 'Mixing' },
        { key: 'adonan', label: 'Adonan' },
    ];

    if (loading) return <div className={styles.stateBox}>Memuat resep…</div>;
    if (error) return <div className={styles.stateBox}>Gagal memuat resep.</div>;

    return (
        <div className={styles.container}>
            {/* Tab bar + toolbar */}
            <div className={styles.topBar}>
                <div className={styles.tabBar}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                            <span className={`${styles.tabBadge} ${activeTab === t.key ? styles.tabBadgeActive : ''}`}>
                                {counts[t.key]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari resep..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className={styles.btnPrimary} onClick={() => onCreate?.()}>
                        + Tambah Resep
                    </button>
                </div>
            </div>

            {/* Split layout */}
            <div className={`${styles.layoutSplit} ${selectedResep ? styles.layoutWithDetail : ''}`}>
                {/* Daftar kartu */}
                <div className={styles.cardList}>
                    {filtered.length === 0 ? (
                        <div className={styles.stateBox}>Tidak ada resep ditemukan.</div>
                    ) : (
                        filtered.map(r => (
                            <ResepCard
                                key={r.id}
                                resep={r}
                                selected={selectedId === r.id}
                                onClick={() => setSelectedId(prev => prev === r.id ? null : r.id)}
                            />
                        ))
                    )}
                </div>

                {/* Detail panel */}
                {selectedResep && (
                    <DetailPanel
                        resep={selectedResep}
                        onEdit={resep => onUpdate?.(resep.id, resep)}
                        onProduksi={resep => console.log('Produksi:', resep)}
                    />
                )}
            </div>
        </div>
    );
}