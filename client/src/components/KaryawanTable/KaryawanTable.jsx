// src/components/KaryawanTable/KaryawanTable.jsx
import { useState, useEffect } from 'react';
import styles from './KaryawanTable.module.css';
import TambahKaryawanModal from './TambahKaryawanModal';
import EditKaryawanModal from './EditKaryawanModal';
import toast from 'react-hot-toast'; // ← tambah ini
import ConfirmModal from '../Shared/ConfirmModal';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

const ITEMS_PER_PAGE = 8;

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const roleVariant = {
    'penjaga_booth': 'success',
    'kurir': 'accent',
    // 'Supervisor': 'success',
};
function getToken() {
    return localStorage.getItem('token');
}
export default function KaryawanTable({ karyawanList, setKaryawanList, loading, error }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isTambahOpen, setIsTambahOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [drawerTarget, setDrawerTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null });

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

    // ── Derived ───────────────────────────────────────────────
    const filtered = karyawanList.filter(k => {
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && k.is_active) ||
            (filterStatus === 'inactive' && !k.is_active);
        const matchSearch =
            k.name.toLowerCase().includes(searchQuery.toLowerCase())
        // k.booth_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // k.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    // ── Handlers ──────────────────────────────────────────────
    async function handleTambahKaryawan(newKaryawan) {
        const response = await fetch(`${BASE_URL}/karyawan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(newKaryawan),
        });

        const json = await response.json();
        console.log('Response status:', response.status);
        console.log('Response body:', json); // ← cek ini dulu di console

        if (!response.ok) throw new Error(json.payload?.message ?? json.message ?? 'Gagal menambahkan karyawan');

        // if (!response.ok) throw new Error(json.payload?.message || 'Gagal menyimpan karyawan');

        const saved = json.payload.data;
        setKaryawanList(prev => [saved, ...prev]);
        setIsTambahOpen(false);
        toast.success(`Data ${saved.name} berhasil ditambahkan!`);
    }

    async function handleEditKaryawan(id, updatedData) {
        const response = await fetch(`${BASE_URL}/karyawan/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify(updatedData),
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.payload.message || 'Gagal update Karyawan');

        const saved = json.payload.data;
        setKaryawanList(prev => prev.map(k => k.id === id ? saved : k));
        setIsModalOpen(false);
        toast.success(`Data ${saved.name} berhasil diupdate!`);
    }

    // Nonaktifkan — hit API DELETE (soft delete)
    function handleToggleStatus(karyawan) {
        setConfirmModal({ isOpen: true, karyawan });
    }

    async function handleConfirmToggle() {
        const karyawan = confirmModal.karyawan;
        const newStatus = karyawan.is_active ? 0 : 1;

        setActionLoading(karyawan.id);
        try {
            const res = await fetch(`${BASE_URL}/karyawan/${karyawan.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ is_active: newStatus }),
            });

            if (!res.ok) throw new Error('Gagal mengupdate status');

            setKaryawanList(prev => prev.map(k =>
                k.id === karyawan.id
                    ? { ...k, is_active: newStatus, status_label: newStatus ? 'Aktif' : 'Nonaktif' }
                    : k
            ));
            toast.success(`${karyawan.name} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
            setConfirmModal({ isOpen: false, karyawan: null });
        } catch (err) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <>
            {/* Table Card */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Karyawan</span>
                    <div className={styles.cardActions}>
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari karyawan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            {['all', 'active', 'inactive'].map(s => (
                                <button
                                    key={s}
                                    className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ''}`}
                                    onClick={() => setFilterStatus(s)}
                                >
                                    {s === 'all' ? 'Semua' : s === 'active' ? 'Aktif' : 'Nonaktif'}
                                </button>
                            ))}
                        </div>
                        <button className={styles.btnPrimary} onClick={() => setIsTambahOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Karyawan
                        </button>
                    </div>
                </div>

                <div className={styles.tableWrap}>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Karyawan</th>
                                <th>Jabatan</th>
                                <th>Booth Ditugaskan</th>
                                <th>Shift</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={9} className={`${styles.stateCell} ${styles.errorCell}`}>Gagal memuat data karyawan</td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={9} className={styles.stateCell}>Tidak ada karyawan ditemukan</td></tr>
                            ) : paginated.map((k, idx) => (
                                <tr key={k.id} style={{ opacity: k.is_active ? 1 : 0.6 }}>
                                    <td className={styles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                    <td>
                                        <div className={styles.employeeCell}>
                                            <div>
                                                <div className={styles.employeeName}>{k.name}</div>
                                                {/* <div className={styles.employeeEmail}>{`${styles.pill} ${styles[roleVariant[k.role] ?? 'brown']}`}</div> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.pill} ${styles[roleVariant[k.role] ?? 'brown']}`}>
                                            {k.role}
                                        </span>
                                    </td>
                                    <td className={styles.monoCell}>
                                        {k.role === 'kurir'
                                            ? 'Sesuai pengiriman'
                                            : k.nama_booth ?? 'Belum punya jadwal'
                                        }
                                    </td>
                                    {/* <td className={styles.monoCell}>{k.shift ?? 'On Call'}</td> */}
                                    <td className={styles.monoCell}>
                                        {k.role === 'kurir'
                                            ? 'On Call'
                                            : k.shift ?? 'Belum punya shift'
                                        }
                                    </td>
                                    <td>
                                        <span className={`${styles.pill} ${k.is_active ? styles.success : styles.danger}`}>
                                            {k.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actionBtns}>
                                            <button className={styles.iconBtn} title="Detail" onClick={() => setDrawerTarget(k)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                            <button className={styles.iconBtn} title="Edit" onClick={() => { setEditTarget(k); setIsModalOpen(true); }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`${styles.iconBtn} ${k.is_active ? styles.btnNonaktif : styles.btnAktifkan}`}
                                                aria-label={k.is_active ? "Nonaktifkan karyawan" : "Aktifkan karyawan"}
                                                onClick={() => handleToggleStatus(k)}
                                                disabled={actionLoading === k.id}
                                            >
                                                {k.is_active ? (
                                                    // ikon slash/ban
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                    </svg>
                                                ) : (
                                                    // ikon centang/check
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} karyawan
                        {filtered.length !== karyawanList.length && ` (difilter dari ${karyawanList.length} total)`}
                    </span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            {pageNumbers.map((p, i) =>
                                p === '...' ? (
                                    <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`${styles.pageBtn} ${p === currentPage ? styles.activePage : ''}`}
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                            <button
                                className={styles.pageBtn}
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

            {/* Detail Drawer */}
            {drawerTarget && (
                <>
                    <div className={styles.drawerBackdrop} onClick={() => setDrawerTarget(null)} />
                    <div className={styles.drawer}>
                        <div className={styles.drawerHead}>
                            <div
                                className={styles.drawerAvatar}
                                style={{ background: drawerTarget.is_active ? 'var(--accent)' : 'var(--brown-300)' }}
                            >
                                {getInitials(drawerTarget.name)}
                            </div>
                            <div className={styles.drawerInfo}>
                                <div className={styles.drawerName}>{drawerTarget.name}</div>
                                <div className={styles.drawerId}>
                                    {drawerTarget.employee_code} · {drawerTarget.role}
                                </div>
                            </div>
                            <button className={styles.drawerClose} onClick={() => setDrawerTarget(null)}>✕</button>
                        </div>
                        <div className={styles.drawerBody}>
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Informasi Karyawan</div>
                                {[
                                    // ['Email', drawerTarget.email],
                                    ['No. HP', drawerTarget.no_hp],
                                    ['Booth', drawerTarget.role === 'kurir' ? 'Sesuai pengiriman' : drawerTarget.nama_booth ?? 'Belum punya jadwal'],
                                    ['Shift', drawerTarget.role === 'kurir' ? 'On Call' : drawerTarget.shift ?? 'Belum punya shift'],
                                    ['Tgl. Bergabung', new Date(drawerTarget.entry_date).toLocaleDateString('id-ID', {
                                        day: 'numeric', month: 'long', year: 'numeric',
                                    })],
                                    ['Status', drawerTarget.is_active ? 'Aktif' : 'Nonaktif'],
                                ].map(([key, val]) => (
                                    <div key={key} className={styles.detailRow}>
                                        <span className={styles.detailKey}>{key}</span>
                                        <span className={styles.detailVal}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.drawerFoot}>
                            <button
                                className={`${styles.btnGhost} ${styles.btnSm}`}
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setDrawerTarget(null);
                                    setTimeout(() => { setEditTarget(drawerTarget); setIsModalOpen(true); }, 200);
                                }}
                            >
                                ✏️ Edit Karyawan
                            </button>
                            <button
                                className={`${styles.btnSm} ${drawerTarget.is_active ? styles.btnPrimary : styles.btnDanger}`}
                                onClick={() => handleToggleStatus(drawerTarget)}
                            >
                                {drawerTarget.is_active ? '🔒 Nonaktifkan' : '🔓 Aktifkan'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL TAMBAH */}
            <TambahKaryawanModal
                isOpen={isTambahOpen}
                onClose={() => setIsTambahOpen(false)}
                onSubmit={handleTambahKaryawan}
                karyawanList={karyawanList}
            />
            <EditKaryawanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleEditKaryawan}
                karyawan={editTarget}
                karyawanList={karyawanList}
            />


            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, karyawan: null })}
                onConfirm={handleConfirmToggle}
                variant={confirmModal.karyawan?.is_active ? 'danger' : 'success'}
                title={confirmModal.karyawan?.is_active ? 'Nonaktifkan Karyawan?' : 'Aktifkan Karyawan?'}
                message={
                    confirmModal.karyawan?.is_active
                        ? `"${confirmModal.karyawan?.name}" tidak akan muncul dalam jadwal booth.`
                        : `"${confirmModal.karyawan?.name}" akan aktif kembali dan masuk jadwal booth.`
                }
                confirmLabel={confirmModal.karyawan?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                loading={actionLoading === confirmModal.karyawan?.id}
            />
        </>
    );
}