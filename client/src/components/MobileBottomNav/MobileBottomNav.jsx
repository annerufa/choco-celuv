// src/components/MobileBottomNav/MobileBottomNav.jsx
import { Link, useLocation } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';

const navItems = [
    {
        label: 'Beranda',
        path: '/dashboard/pemilik',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        label: 'Barang',
        path: '/barang',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
        ),
    },
    {
        label: 'Distribusi',
        path: '/distribusi',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        ),
    },
    {
        label: 'Menu',
        path: null, // null = bukan navigate, tapi buka sidebar
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
        ),
    },
];

export default function MobileBottomNav({ onOpenMenu }) {
    const location = useLocation();

    return (
        <nav className={styles.mobileBottomNav}>
            {navItems.map(item => {
                // Tombol Menu — buka sidebar, bukan navigate
                if (item.path === null) {
                    return (
                        <button
                            key={item.label}
                            className={styles.mobNavBtn}
                            onClick={onOpenMenu}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                }

                // Tombol navigasi biasa
                const isActive = location.pathname.startsWith(item.path);
                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`${styles.mobNavBtn} ${isActive ? styles.active : ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}