// src/components/JadwalWarningBanner.jsx
import styles from './JadwalWarningBanner.module.css';

const JadwalWarningBanner = ({ jadwal }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.card}>
                <div className={styles.iconWrap}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            stroke="#d4500a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3 className={styles.title}>Tidak Ada Jadwal Jaga</h3>
                <p className={styles.desc}>
                    Kamu tidak memiliki jadwal jaga aktif saat ini.<br />
                    Hubungi pemilik untuk mengatur jadwal terlebih dahulu.
                </p>
                {jadwal === null && (
                    <p className={styles.hint}>
                        Transaksi penjualan hanya bisa dilakukan saat jam jaga aktif.
                    </p>
                )}
            </div>
        </div>
    );
};

export default JadwalWarningBanner;