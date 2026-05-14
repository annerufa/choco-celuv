// src/components/shared/ConfirmModal.jsx
import { useEffect } from 'react';
import styles from './ConfirmModal.module.css';

/**
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: () => void
 * - title: string
 * - message: string | ReactNode
 * - confirmLabel: string (default: "Ya, Lanjutkan")
 * - cancelLabel: string (default: "Batal")
 * - variant: 'danger' | 'warning' | 'success' (default: 'danger')
 * - loading: boolean
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message,
    confirmLabel = 'Ya, Lanjutkan',
    cancelLabel = 'Batal',
    variant = 'danger',
    loading = false,
}) {
    // Tutup dengan Escape
    useEffect(() => {
        function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const iconMap = {
        danger: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        success: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
            </svg>
        ),
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Icon */}
                <div className={`${styles.iconWrap} ${styles[variant]}`}>
                    {iconMap[variant]}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <h2 className={styles.title}>{title}</h2>
                    {message && <p className={styles.message}>{message}</p>}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`${styles.btnConfirm} ${styles[variant]}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Memproses...' : confirmLabel}
                    </button>
                </div>

            </div>
        </div>
    );
}
