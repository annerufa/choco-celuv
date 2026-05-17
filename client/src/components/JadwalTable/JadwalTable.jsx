// components/JadwalTable/JadwalTable.jsx
import { useState, useEffect } from 'react';
import styles from './JadwalTable.module.css';
import JadwalModal from './JadwalModal';
import ConfirmModal from '../Shared/ConfirmModal';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 7;

const shiftVariant = { pagi: 'success', malam: 'warning' };

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
export default function JadwalTable({
    jadwalList,
    loading,
    error,
    onCreate,
    onUpdate,
    onDeactivate,
}) {
    // Data pendukung untuk dropdown di modal
    const { data: employeeList } = useApi('/karyawan/penjaga');
    const { data: boothList } = useApi('/booth');

    // const [isTambahOpen, setIsTambahOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterShift, setFilterShift] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, editTarget: null });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [drawerTarget, setDrawerTarget] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, jadwalAktifLain: null });
    const [reactivateConfirm, setReactivateConfirm] = useState({ isOpen: false, item: null, jadwalAktif: null });

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterShift]);

    // ── Filter ────────────────────────────────────────────────
    const filtered = jadwalList.filter(j => {
        const matchShift = filterShift.length === 0 || filterShift.includes(j.shift);
        const matchSearch =
            j.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.booth_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchShift && matchSearch;
    });

    const toggleFilterShift = (shift) => {
        setFilterShift(prev =>
            prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
        );
    };

    // ── Pagination ────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, page, i, arr) => {
            if (i > 0 && page - arr[i - 1] > 1) acc.push('...');
            acc.push(page);
            return acc;
        }, []);

    // ── Handlers ──────────────────────────────────────────────

    // Helper buka modal
    const openTambah = () => {
        setModalError(null);
        setModalState({ isOpen: true, editTarget: null });
    };

    const openEdit = (item) => {
        setModalError(null);
        setModalState({ isOpen: true, editTarget: item });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, editTarget: null });
        setModalError(null);
    };

    // Handler submit — pilih onCreate atau onUpdate otomatis
    const handleSubmit = async (formData) => {
        setModalLoading(true);
        setModalError(null);
        try {
            if (modalState.editTarget) {
                await onUpdate(modalState.editTarget.id, formData);
            } else {
                await onCreate(formData);
            }
            closeModal();
        } catch (err) {
            const msg = err.response?.data?.payload?.message || err.message;
            if (err.response?.status === 409) {
                setModalError(msg); // sudah muncul di modal
                // opsional: tambah flag biar modal nampilin tombol "Buat Jadwal Baru"
            } else {
                setModalError(msg);
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleConfirmDeactivate = async () => {
        const item = confirmModal.item;
        const newStatus = item.is_active ? 0 : 1;
        setActionLoading(item.id);
        // console.log(newStatus);

        try {
            await onDeactivate(item.id, newStatus);
            toast.success(
                item.is_active
                    ? `Jadwal ${item.employee_name} berhasil dinonaktifkan!`
                    : `Jadwal ${item.employee_name} berhasil diaktifkan!`
            );
            setDrawerTarget(prev => prev ? { ...prev, is_active: newStatus } : null);
            setConfirmModal({ isOpen: false, item: null });
        } catch {
            toast.error(item.is_active ? 'Gagal menonaktifkan jadwal.' : 'Gagal mengaktifkan jadwal.');
        } finally {
            setActionLoading(null);
        }
    };
    const handleDeactivateClick = (item) => {
        console.log('clicked', item);  // ← cek ini muncul apa tidak

        if (!item.is_active) {
            const aktifLain = jadwalList.find(
                j => j.employee_id === item.employee_id && j.is_active === 1
            );
            console.log('aktifLain', aktifLain);  // ← cek ini
            setConfirmModal({ isOpen: true, item, jadwalAktifLain: aktifLain ?? null });
        } else {
            setConfirmModal({ isOpen: true, item, jadwalAktifLain: null });
        }
    };

    return (
        <>
            <div className={styles.card}>

                {/* Header */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Jadwal Jaga Booth</span>
                    <div className={styles.cardActions}>

                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari karyawan atau booth..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter shift */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className={styles.btnGhost}
                                onClick={() => setIsFilterOpen(prev => !prev)}
                                style={filterShift.length > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                Filter
                                {filterShift.length > 0 && (
                                    <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '999px', fontSize: '11px', padding: '0 6px', marginLeft: '4px' }}>
                                        {filterShift.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface, #fff)', border: '1px solid var(--border, #e5e7eb)', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px', minWidth: '160px', zIndex: 100 }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-400, #9ca3af)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shift</p>
                                    {['pagi', 'malam'].map(shift => (
                                        <label key={shift} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px' }}>
                                            <input
                                                type="checkbox"
                                                checked={filterShift.includes(shift)}
                                                onChange={() => toggleFilterShift(shift)}
                                                style={{ accentColor: 'var(--accent)', width: '15px', height: '15px' }}
                                            />
                                            <span className={`${styles.pill} ${styles[shiftVariant[shift]]}`}>
                                                {shift.charAt(0).toUpperCase() + shift.slice(1)}
                                            </span>
                                        </label>
                                    ))}
                                    {filterShift.length > 0 && (
                                        <button onClick={() => setFilterShift([])} style={{ marginTop: '10px', width: '100%', fontSize: '12px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 4px' }}>
                                            ✕ Reset filter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className={styles.btnPrimary} onClick={openTambah}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Jadwal
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Karyawan</th>
                                <th>Booth</th>
                                <th>Shift</th>
                                <th>Jam Masuk</th>
                                <th>Jam Keluar</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--danger)' }}>Gagal memuat data jadwal</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>Tidak ada jadwal ditemukan</td></tr>
                            ) : (
                                paginated.map((item, index) => {
                                    const nomor = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                    return (
                                        <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.6 }}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td className={styles.namaCell}>{item.employee_name}</td>
                                            <td>{item.booth_name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[shiftVariant[item.shift]]}`}>
                                                    {item.shift.charAt(0).toUpperCase() + item.shift.slice(1)}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>{item.expected_clock_in?.slice(0, 5)}</td>
                                            <td className={styles.monoCell}>{item.expected_clock_out?.slice(0, 5)}</td>
                                            <td>
                                                <span className={`${styles.pill} ${item.is_active ? styles.success : styles.grey}`}>
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    {/* Detail */}
                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Lihat detail"
                                                        onClick={() => setDrawerTarget(item)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>


                                                    {/* Edit */}
                                                    <button
                                                        className={styles.iconBtn}
                                                        aria-label="Edit jadwal"
                                                        onClick={() => openEdit(item)}
                                                        disabled={actionLoading === item.id}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className={`${styles.iconBtn} ${item.is_active ? styles.btnNonaktif : styles.btnAktifkan}`}
                                                        aria-label={item.is_active ? "Nonaktifkan jadwal" : "Aktifkan jadwal"}
                                                        onClick={() => handleDeactivateClick(item)}
                                                        disabled={actionLoading === item.id}
                                                        style={{ opacity: 1, pointerEvents: 'auto' }}  // ← override opacity dari row
                                                    >
                                                        {item.is_active ? (
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer pagination */}
                <div className={styles.tableFooter}>
                    <span>
                        Menampilkan {paginated.length} dari {filtered.length} jadwal
                        {filtered.length !== jadwalList.length && ` (difilter dari ${jadwalList.length} total)`}
                    </span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`e-${i}`} className={styles.pageEllipsis}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
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
                                {getInitials(drawerTarget.employee_name)}
                            </div>
                            <div className={styles.drawerInfo}>
                                <div className={styles.drawerName}>{drawerTarget.employee_name}</div>
                                <div className={styles.drawerId}>
                                    Penjaga Booth · {drawerTarget.booth_name}
                                </div>
                            </div>
                            <button className={styles.drawerClose} onClick={() => setDrawerTarget(null)}>✕</button>
                        </div>
                        <div className={styles.drawerBody}>
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Informasi Jadwal</div>
                                {[
                                    // ['Email', drawerTarget.email],
                                    ['Nama Penjaga', drawerTarget.employee_name],
                                    ['Nama Booth', drawerTarget.booth_name],
                                    ['Shift', drawerTarget.shift],
                                    ['Jam Kerja', drawerTarget.expected_clock_in?.slice(0, 5) + ' - ' + drawerTarget.expected_clock_out?.slice(0, 5)],

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
                                    setTimeout(() => openEdit(drawerTarget), 200);
                                }}
                            >
                                ✏️ Edit Jadwal
                            </button>

                            <button
                                className={`${styles.btnSm} ${drawerTarget.is_active ? styles.btnPrimary : styles.btnDanger}`}
                                onClick={() => handleDeactivateClick(drawerTarget)}
                            >
                                {drawerTarget.is_active ? '🔒 Nonaktifkan' : '🔓 Aktifkan'}
                            </button>

                        </div>
                    </div>
                </>
            )}

            {/* Modal Tambah */}
            <JadwalModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editTarget={modalState.editTarget}   // ← null = tambah, objek = edit
                employeeList={employeeList}
                boothList={boothList}
                jadwalAktif={jadwalList.filter(j => j.is_active === 1)}
                loading={modalLoading}
                submitError={modalError}
            />

            {/* Confirm nonaktifkan */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, item: null })}
                onConfirm={handleConfirmDeactivate}
                variant={confirmModal.item?.is_active ? 'danger' : 'success'}
                title={confirmModal.item?.is_active ? 'Nonaktifkan item?' : 'Aktifkan item?'}
                message={
                    confirmModal.item?.is_active
                        ? `Jadwal ${confirmModal.item?.employee_name} di ${confirmModal.item?.booth_name} akan dinonaktifkan.`
                        : confirmModal.jadwalAktifLain
                            ? `${confirmModal.item?.employee_name} punya jadwal aktif di ${confirmModal.jadwalAktifLain?.booth_name} (${confirmModal.jadwalAktifLain?.expected_clock_in?.slice(0, 5)}–${confirmModal.jadwalAktifLain?.expected_clock_out?.slice(0, 5)}). Jadwal itu akan otomatis digantikan.`
                            : `Jadwal ${confirmModal.item?.employee_name} di ${confirmModal.item?.booth_name} akan diaktifkan kembali.`
                }
                confirmLabel={confirmModal.item?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
                loading={actionLoading === confirmModal.item?.id}
            />
        </>
    );
}