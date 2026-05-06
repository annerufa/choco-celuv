// src/components/BoothTable/BoothTable.jsx
import { useState } from 'react';
import styles from './BoothTable.module.css';
import TambahBoothModal from './TambahBoothModal';
import EditBoothModal from './EditBoothModal';
import toast from 'react-hot-toast';

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function BoothTable({ boothList, setBoothList, loading, error }) {
    const [isTambahOpen, setIsTambahOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [drawerBooth, setDrawerBooth] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // ── Filter ────────────────────────────────────────────────
    const filtered = boothList.filter(b => {
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && b.is_active) ||
            (filterStatus === 'inactive' && !b.is_active);
        const matchSearch =
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.penyewa || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });

    // ── Handlers ──────────────────────────────────────────────
    async function handleTambahBooth(newBooth) {
        const response = await fetch('http://localhost:3001/api/booth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooth),
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.payload?.message || 'Gagal menyimpan booth');

        const saved = json.payload.data;
        setBoothList(prev => [saved, ...prev]);
        toast.success(`Booth ${saved.name} berhasil ditambahkan!`);
    }



    function handleOpenEdit(booth) {
        setSelectedBooth(booth);
        setIsEditOpen(true);
    }

    async function handleEditBooth(id, updatedData) {
        const response = await fetch(`http://localhost:3000/api/booths/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.payload.message || 'Gagal update booth');

        const saved = json.payload.data;
        setBoothList(prev => prev.map(b => b.id === id ? saved : b)); // update list tanpa refetch
        toast.success(`Booth ${saved.name} berhasil diupdate!`);
    }

    function handleNonaktifkan(booth) {
        if (!window.confirm(`Nonaktifkan booth "${booth.name}"?`)) return;
        setBoothList(prev => prev.map(b => b.id === booth.id ? { ...b, active: false } : b));
        if (drawerBooth?.id === booth.id) setDrawerBooth(prev => ({ ...prev, active: false }));
        toast.success(`${booth.name} dinonaktifkan`);
        setDrawerBooth(null);
    }

    function openDrawer(booth) { setDrawerBooth(booth); }
    function closeDrawer() { setDrawerBooth(null); }

    function openEditFromDrawer() {
        const booth = drawerBooth;
        closeDrawer();
        setTimeout(() => handleOpenEdit(booth), 200);
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <>
            {/* TOOLBAR */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        className={styles.search}
                        type="text"
                        placeholder="Cari booth..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {['all', 'active', 'inactive'].map(status => (
                    <button
                        key={status}
                        className={`${styles.filterBtn} ${filterStatus === status ? styles.active : ''}`}
                        onClick={() => setFilterStatus(status)}
                    >
                        {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                ))}

                <div style={{ flex: 1 }} />

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.vtBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Tampilan kartu"
                    >⊞</button>
                    <button
                        className={`${styles.vtBtn} ${viewMode === 'table' ? styles.active : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Tampilan tabel"
                    >☰</button>
                </div>

                <button className={styles.btnPrimary} onClick={() => setIsTambahOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Booth
                </button>
            </div>

            {/* LOADING / ERROR */}
            {loading && <div className={styles.stateMsg}>Memuat data booth...</div>}
            {error && <div className={`${styles.stateMsg} ${styles.errorMsg}`}>Gagal memuat data booth</div>}

            {/* GRID VIEW */}
            {!loading && !error && viewMode === 'grid' && (
                filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🏪</div>
                        <div className={styles.emptyTitle}>Tidak ada booth ditemukan</div>
                        <div className={styles.emptySub}>Coba ubah filter atau kata kunci pencarian</div>
                    </div>
                ) : (
                    <div className={styles.boothGrid}>
                        {filtered.map(b => (
                            <div
                                key={b.id}
                                className={`${styles.boothCard} ${!b.is_active ? styles.inactive : ''}`}
                                onClick={() => openDrawer(b)}
                            >
                                <div className={styles.bcHeader}>
                                    <div className={`${styles.bcAvatar} ${!b.is_active ? styles.inactive : ''}`}>
                                        {getInitials(b.name)}
                                    </div>
                                    <div className={styles.bcInfo}>
                                        <div className={styles.bcName}>{b.name}</div>
                                        <div className={styles.bcId}>
                                            #{String(b.id).padStart(3, '0')} · {b.code}
                                        </div>
                                    </div>
                                    <span className={`${styles.bcBadge} ${b.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                                        {b.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>

                                <div className={styles.bcBody}>
                                    <div className={styles.bcAddress}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {b.address}
                                    </div>

                                    <div className={styles.bcStats}>
                                        <div className={styles.bcStat}>
                                            {/* <div className={styles.bcStatVal}>{b.trx || '—'}</div> */}
                                            <div className={styles.bcStatVal}>{b.trx || '—'}</div>
                                            <div className={styles.bcStatLbl}>Transaksi bulan ini</div>
                                        </div>
                                        <div className={styles.bcStat}>
                                            {/* <div className={styles.bcStatVal}>{b.staff?.length ?? 0}</div> */}
                                            <div className={styles.bcStatLbl}>1</div>
                                            <div className={styles.bcStatLbl}>Pegawai bertugas</div>
                                        </div>
                                        <div className={styles.bcStat}>
                                            <div className={styles.bcStatVal}>{b.is_active ? '✓' : '✗'}</div>
                                            <div className={styles.bcStatLbl}>Status operasi</div>
                                        </div>
                                    </div>

                                    <div className={styles.bcFooter}>
                                        <div className={styles.bcKeeper}>
                                            {b.staff?.length ? (
                                                <>
                                                    <div className={styles.keeperAvatar}>{b.staff[0].initials}</div>
                                                    <span className={styles.keeperName}>
                                                        {b.staff[0].name}{b.staff.length > 1 ? ` +${b.staff.length - 1}` : ''}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className={styles.keeperEmpty}>Belum ada pegawai</span>
                                            )}
                                        </div>

                                        <div className={styles.bcActions} onClick={e => e.stopPropagation()}>
                                            <button
                                                className={styles.icBtn}
                                                onClick={() => handleOpenEdit(b)}
                                                title="Edit"
                                            >✏️</button>
                                            {b.active && (
                                                <button
                                                    className={`${styles.icBtn} ${styles.del}`}
                                                    onClick={() => handleNonaktifkan(b)}
                                                    title="Nonaktifkan"
                                                >🗑</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* TABLE VIEW */}
            {!loading && !error && viewMode === 'table' && (
                <div className={styles.tableWrap}>
                    <table>
                        <thead>
                            <tr>
                                <th>Booth</th>
                                <th>Kode</th>
                                <th>Alamat</th>
                                <th>Pegawai</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--brown-400)' }}>
                                        Tidak ada booth ditemukan
                                    </td>
                                </tr>
                            ) : filtered.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div className={styles.tblName}>{b.name}</div>
                                        <div className={styles.tblAddr}>{b.penyewa || '—'}</div>
                                    </td>
                                    <td className={styles.monoCell}>#{String(b.id).padStart(3, '0')}</td>
                                    <td style={{ maxWidth: 200 }}>
                                        <div style={{ fontSize: 13, color: 'var(--brown-600)' }}>{b.address}</div>
                                    </td>
                                    <td>
                                        {b.staff?.length ? b.staff.map(s => (
                                            <div key={s.name} style={{ fontSize: 12, color: 'var(--brown-700)' }}>{s.name}</div>
                                        )) : <span style={{ color: 'var(--brown-300)' }}>—</span>}
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${b.is_active ? styles.badgeOn : styles.badgeOff}`}>
                                            {b.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actBtns}>
                                            <button className={styles.icBtn} onClick={() => openDrawer(b)} title="Detail">👁</button>
                                            <button className={styles.icBtn} onClick={() => handleOpenEdit(b)} title="Edit">✏️</button>
                                            {b.is_active && (
                                                <button className={`${styles.icBtn} ${styles.del}`} onClick={() => handleNonaktifkan(b)} title="Nonaktifkan">🗑</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DETAIL DRAWER */}
            {drawerBooth && (
                <>
                    <div className={`${styles.drawerBackdrop} ${styles.show}`} onClick={closeDrawer} />
                    <div className={`${styles.drawer} ${styles.show}`}>
                        <div className={styles.drawerHead}>
                            <div
                                className={styles.drawerAvatar}
                                style={{ background: drawerBooth.is_active ? 'var(--accent)' : 'var(--brown-300)' }}
                            >
                                {getInitials(drawerBooth.name)}
                            </div>
                            <div className={styles.drawerInfo}>
                                <div className={styles.drawerName}>{drawerBooth.name}</div>
                                <div className={styles.drawerId}>
                                    ID #{String(drawerBooth.id).padStart(3, '0')} · {drawerBooth.is_active ? 'Aktif' : 'Nonaktif'}
                                </div>
                            </div>
                            <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
                        </div>

                        <div className={styles.drawerBody}>
                            {/* Seksi: Info Sewa */}
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Informasi Sewa</div>
                                {[
                                    ['Penyewa', drawerBooth.penyewa || '—'],
                                    ['Kontak', drawerBooth.cp_penyewa || '—'],
                                    ['Harga Sewa', drawerBooth.harga
                                        ? `Rp ${Number(drawerBooth.harga).toLocaleString('id-ID')}`
                                        : '—'],
                                    ['Status', drawerBooth.is_active ? '🟢 Aktif' : '⚫ Nonaktif'],
                                    ['Buka Sekarang', drawerBooth.is_open ? '🔓 Buka' : '🔒 Tutup'],
                                ].map(([key, val]) => (
                                    <div key={key} className={styles.detailRow}>
                                        <span className={styles.detailKey}>{key}</span>
                                        <span className={styles.detailVal}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Seksi: Info Booth */}
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Informasi Booth</div>
                                {[
                                    ['Alamat', drawerBooth.address || '—'],
                                    ['Dibuat', drawerBooth.created_at
                                        ? new Date(drawerBooth.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '—'],
                                ].map(([key, val]) => (
                                    <div key={key} className={styles.detailRow}>
                                        <span className={styles.detailKey}>{key}</span>
                                        <span className={styles.detailVal}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Seksi: Lokasi */}
                            {(drawerBooth.latitude && drawerBooth.longitude) && (
                                <div className={styles.detailSection}>
                                    <div className={styles.detailSectionTitle}>Lokasi</div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailKey}>Koordinat</span>
                                        <span className={styles.detailVal} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                            {Number(drawerBooth.latitude).toFixed(6)}, {Number(drawerBooth.longitude).toFixed(6)}
                                        </span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${drawerBooth.latitude},${drawerBooth.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                                    >
                                        📍 Buka di Google Maps
                                    </a>
                                </div>
                            )}

                            {/* Seksi: Pegawai */}
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Pegawai Bertugas</div>
                                {drawerBooth.staff?.length ? drawerBooth.staff.map(s => (
                                    <div key={s.name} className={styles.miniStaff}>
                                        <div className={styles.staffAv}>{s.initials}</div>
                                        <div className={styles.staffInfo}>
                                            <div className={styles.staffName}>{s.name}</div>
                                            <div className={styles.staffRole}>{s.role}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ fontSize: 13, color: 'var(--brown-300)', padding: '8px 0' }}>
                                        Belum ada pegawai ditugaskan
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.drawerFoot}>
                            <button className={`${styles.btnGhost} ${styles.btnSm}`} style={{ flex: 1 }} onClick={openEditFromDrawer}>
                                ✏️ Edit Booth
                            </button>
                            {drawerBooth.is_active && (
                                <button className={`${styles.btnDanger} ${styles.btnSm}`} onClick={() => handleNonaktifkan(drawerBooth)}>
                                    🔒 Nonaktifkan
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* MODAL TAMBAH */}
            <TambahBoothModal
                isOpen={isTambahOpen}
                onClose={() => setIsTambahOpen(false)}
                onSubmit={handleTambahBooth}
            />

            {/* MODAL EDIT */}
            <EditBoothModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleEditBooth}
                booth={selectedBooth}
            />
        </>
    );
}
