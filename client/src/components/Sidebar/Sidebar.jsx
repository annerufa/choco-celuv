// src/components/Sidebar/Sidebar.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { menuConfig } from './menuConfig';
import { icons } from './icons';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
    const location = useLocation();
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [tooltip, setTooltip] = useState({ text: '', y: 0, visible: false });

    // Auto-buka submenu yang route-nya aktif saat pertama load
    useEffect(() => {
        menuConfig.forEach(section => {
            section.items.forEach(item => {
                if (item.submenu) {
                    const isChildActive = item.submenu.some(s => location.pathname.startsWith(s.path));
                    if (isChildActive) setOpenSubmenu(item.id);
                }
            });
        });
    }, []);

    // Tutup semua submenu saat sidebar di-collapse
    useEffect(() => {
        if (collapsed) {
            setOpenSubmenu(null);
            setTooltip(t => ({ ...t, visible: false }));
        }
    }, [collapsed]);

    function handleMenuClick(item) {
        if (item.submenu) {
            setOpenSubmenu(prev => prev === item.id ? null : item.id);
        } else {
            if (mobileOpen) onCloseMobile();
        }
    }

    function handleMouseEnter(e, item, hasSubmenu) {
        if (!collapsed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            text: item.label,
            y: rect.top + rect.height / 2,
            visible: true,
        });
    }

    useEffect(() => {
        function handleClickOutside(e) {
            if (!e.target.closest(`#sidebar`)) {
                setOpenSubmenu(null);
            }
        }

        if (openSubmenu && collapsed) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openSubmenu, collapsed]);

    function handleMouseLeave() {
        setTooltip(t => ({ ...t, visible: false }));
    }

    function isMenuActive(item) {
        if (item.path) return location.pathname === item.path;
        if (item.submenu) return item.submenu.some(s => location.pathname.startsWith(s.path));
        return false;
    }

    const sidebarClass = [
        styles.sidebar,
        collapsed ? styles.collapsed : '',
        mobileOpen ? styles.mobileOpen : '',
    ].filter(Boolean).join(' ');

    return (
        <>
            {/* Overlay mobile */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={onCloseMobile} />
            )}

            <aside className={sidebarClass} id="sidebar">
                <div className={styles.sidebarScroll}>
                    {menuConfig.map(section => (
                        <div key={section.section} className={styles.menuSection}>
                            <div className={styles.menuLabel}>{section.section}</div>

                            {section.items.map(item => {
                                const isActive = isMenuActive(item);
                                const isOpen = openSubmenu === item.id;
                                const hasSubmenu = !!item.submenu;

                                return (
                                    <div
                                        key={item.id}
                                        className={[
                                            styles.menuItem,
                                            isOpen && !collapsed ? styles.open : '',
                                            isOpen && collapsed ? styles.submenuOpen : '',
                                        ].filter(Boolean).join(' ')}
                                    >
                                        {/* Tombol menu utama */}
                                        {hasSubmenu ? (
                                            <button
                                                className={`${styles.menuBtn} ${isActive ? styles.active : ''}`}
                                                onClick={() => handleMenuClick(item)}
                                                onMouseEnter={e => handleMouseEnter(e, item, hasSubmenu)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <span className={styles.menuIcon}>{icons[item.icon]}</span>
                                                <span className={styles.menuText}>{item.label}</span>
                                                <svg className={styles.menuArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                className={`${styles.menuBtn} ${isActive ? styles.active : ''}`}
                                                onClick={() => mobileOpen && onCloseMobile()}
                                                onMouseEnter={e => handleMouseEnter(e, item, hasSubmenu)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <span className={styles.menuIcon}>{icons[item.icon]}</span>
                                                <span className={styles.menuText}>{item.label}</span>
                                            </Link>
                                        )}

                                        {/* Submenu */}
                                        {hasSubmenu && (
                                            <div className={styles.submenu}>
                                                {item.submenu.map(sub => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={`${styles.submenuBtn} ${location.pathname === sub.path ? styles.active : ''}`}
                                                        onClick={() => mobileOpen && onCloseMobile()}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Tooltip — muncul saat collapsed hover menu tanpa submenu */}
            {/* Tooltip */}
            <div
                className={`${styles.tooltip} ${tooltip.visible ? styles.visible : ''}`}
                style={{ top: tooltip.y - 14 }}
            >
                {tooltip.text}
            </div>
            {/* {tooltip.visible && (
                <div
                    className={styles.tooltip}
                    style={{
                        top: tooltip.y - 14,
                        left: `calc(var(--sidebar-collapsed) + 8px)`,
                        position: 'fixed',
                    }}
                >
                    {tooltip.text}
                </div>
            )} */}
        </>
    );
}

// // src/components/Sidebar/Sidebar.jsx
// import { useRef, useEffect, useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import styles from './Sidebar.module.css';
// import { menuConfig } from './menuConfig';
// import { icons } from './icons';  // SVG icons dipisah juga (lihat catatan bawah)

// export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {

//     const location = useLocation();
//     const [openSubmenu, setOpenSubmenu] = useState(null);
//     const tooltipRef = useRef(null);

//     // Auto-buka submenu yang route-nya aktif saat pertama load
//     useEffect(() => {
//         menuConfig.forEach(section => {
//             section.items.forEach(item => {
//                 if (item.submenu) {
//                     const isChildActive = item.submenu.some(s => location.pathname.startsWith(s.path));
//                     if (isChildActive) setOpenSubmenu(item.id);
//                 }
//             });
//         });
//     }, []); // hanya saat pertama mount

//     // User klik menu barang → handleMenuClick → setOpenSubmenu('barang')
//     function handleMenuClick(item) {
//         if (item.submenu) {
//             if (collapsed) {
//                 // Collapsed mode: toggle submenu-open
//                 setOpenSubmenu(prev => prev === item.id ? null : item.id);
//             } else {
//                 // Normal mode: toggle open/close
//                 setOpenSubmenu(prev => prev === item.id ? null : item.id);
//             }
//         } else {
//             // Menu tanpa submenu: langsung navigate (Link menangani ini)
//             if (mobileOpen) onCloseMobile();
//         }
//     }
//     // User klik hamburger → collapsed jadi true → useEffect jalan → setOpenSubmenu(null)
//     // Tutup semua submenu saat sidebar di-collapse
//     useEffect(() => {
//         if (collapsed) {
//             setOpenSubmenu(null);
//         }
//     }, [collapsed]);


//     function isMenuActive(item) {
//         if (item.path) return location.pathname === item.path;
//         if (item.submenu) return item.submenu.some(s => location.pathname.startsWith(s.path));
//         return false;
//     }

//     const sidebarClass = [
//         styles.sidebar,
//         collapsed ? styles.collapsed : '',
//         mobileOpen ? styles.mobileOpen : '',
//     ].filter(Boolean).join(' ');

//     return (
//         <>
//             {/* Overlay mobile */}
//             {mobileOpen && (
//                 <div className={styles.overlay} onClick={onCloseMobile} />
//             )}

//             <aside className={sidebarClass} id="sidebar">
//                 <div className={styles.sidebarScroll}>
//                     {menuConfig.map(section => (
//                         <div key={section.section} className={styles.menuSection}>
//                             <div className={styles.menuLabel}>{section.section}</div>

//                             {section.items.map(item => {
//                                 const isActive = isMenuActive(item);
//                                 const isOpen = openSubmenu === item.id;
//                                 const hasSubmenu = !!item.submenu;

//                                 return (
//                                     <div
//                                         key={item.id}
//                                         className={[
//                                             styles.menuItem,
//                                             // isOpen ? styles.open : '',
//                                             isOpen && collapsed ? styles.submenuOpen : '',
//                                         ].filter(Boolean).join(' ')}
//                                     >
//                                         {/* Tombol menu utama */}
//                                         {hasSubmenu ? (
//                                             <button
//                                                 className={`${styles.menuBtn} ${isActive ? styles.active : ''}`}
//                                                 onClick={() => handleMenuClick(item)}
//                                                 data-tooltip={item.label}
//                                                 onMouseEnter={e => collapsed && !hasSubmenu && showTooltip(e, item.label)}
//                                                 onMouseLeave={() => collapsed && hideTooltip()}
//                                             >
//                                                 <span className={styles.menuIcon}>{icons[item.icon]}</span>
//                                                 <span className={styles.menuText}>{item.label}</span>
//                                                 <svg className={styles.menuArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                                     <polyline points="9 18 15 12 9 6" />
//                                                 </svg>
//                                             </button>
//                                         ) : (
//                                             <Link
//                                                 to={item.path}
//                                                 className={`${styles.menuBtn} ${isActive ? styles.active : ''}`}
//                                                 data-tooltip={item.label}
//                                                 onClick={() => mobileOpen && onCloseMobile()}
//                                             >
//                                                 <span className={styles.menuIcon}>{icons[item.icon]}</span>
//                                                 <span className={styles.menuText}>{item.label}</span>
//                                             </Link>
//                                         )}

//                                         {/* Submenu */}
//                                         {hasSubmenu && (
//                                             <div className={styles.submenu}>
//                                                 {item.submenu.map(sub => (
//                                                     <Link
//                                                         key={sub.path}
//                                                         to={sub.path}
//                                                         className={`${styles.submenuBtn} ${location.pathname === sub.path ? styles.active : ''}`}
//                                                         onClick={() => mobileOpen && onCloseMobile()}
//                                                     >
//                                                         {sub.label}
//                                                     </Link>
//                                                 ))}
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     ))}
//                 </div>
//             </aside>
//         </>
//     );
// }