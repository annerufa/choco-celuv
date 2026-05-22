// src/components/Navbar/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom'; // tambah ini
import { useAuth } from '../../context/AuthContext'; // tambah ini


// Data notifikasi — nanti bisa diganti dari props/API
const notifications = [
    { id: 1, msg: 'Distribusi ke Booth Malang telah diverifikasi', time: '5 menit lalu', read: false },
    { id: 2, msg: 'Adonan Batch #5 di Booth Kediri hampir kadaluarsa', time: '23 menit lalu', read: false },
    { id: 3, msg: 'Stok Base Coklat Mix tinggal 120 gram', time: '1 jam lalu', read: false },
    { id: 4, msg: 'Pembelian bahan baku Maret berhasil dikonfirmasi', time: '2 jam lalu', read: true },
    { id: 5, msg: 'Rina Penjaga telah absen masuk di Booth Malang', time: '3 jam lalu', read: true },
];

export default function Navbar({ onToggleSidebar }) {
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const { user, logout } = useAuth();       // tambah ini
    const navigate = useNavigate();     // tambah ini

    function handleLogout() {           // tambah ini
        logout();
        navigate('/login');
    }

    // Tutup notif kalau klik di luar
    useEffect(() => {
        function handleClickOutside(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <nav className={styles.navbar}>
                {/* Hamburger */}
                <button className={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                {/* Brand */}
                <div className={styles.navBrand}>
                    <div className={styles.navLogo}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                    </div>
                    <span className={styles.navTitle}>Choco <span>Celuv</span></span>
                </div>

                {/* Actions */}
                <div className={styles.navActions}>
                    {/* Tombol notifikasi */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button className={styles.navBtn} onClick={() => setNotifOpen(v => !v)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && <span className={styles.badge} />}
                        </button>

                        {/* Panel notifikasi — ikut Navbar karena terikat tombolnya */}
                        {notifOpen && (
                            <div className={styles.notifPanel}>
                                <div className={styles.notifHeader}>
                                    <span className={styles.notifTitle}>Notifikasi</span>
                                    <button className={styles.btnGhost}>Tandai semua dibaca</button>
                                </div>
                                <div className={styles.notifList}>
                                    {notifications.map(n => (
                                        <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.unread : ''}`}>
                                            <div className={`${styles.notifDot} ${n.read ? styles.read : ''}`} />
                                            <div className={styles.notifBody}>
                                                <div className={styles.notifMsg}>{n.msg}</div>
                                                <div className={styles.notifTime}>{n.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.navDivider} />

                    {/* Profile */}
                    <button className={styles.navProfile}>
                        <div className={styles.navAvatar}>SF</div>
                        <div className={styles.navProfileInfo}>
                            <div className={styles.navProfileName}>{user?.name}</div>
                            <div className={styles.navProfileRole}>{user?.role}</div>
                        </div>
                    </button>

                    <div className={styles.navDivider} />

                    {/* tombol logout disini pake icon aja gitu */}

                    {/* tombol logout disini pake icon aja gitu */}
                    <button className={styles.navBtn} onClick={handleLogout} aria-label="Keluar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </nav>
        </>
    );
}