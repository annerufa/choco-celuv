// src/layouts/MainLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // ← Outlet = tempat konten halaman
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav/MobileBottomNav';
import styles from './MainLayout.module.css';

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    function handleToggleSidebar() {
        if (isMobile) setMobileOpen(v => !v);
        else setCollapsed(v => !v);
    }

    return (
        <>
            <Navbar onToggleSidebar={handleToggleSidebar} />
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />
            <main className={`${styles.main} ${collapsed && !isMobile ? styles.mainCollapsed : ''}`}>
                <Outlet /> {/* ← konten halaman masuk di sini */}
            </main>
            {isMobile && <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />}
        </>
    );
}