// Contoh penggunaan SetupBarangBoothModal di BarangBoothTable.jsx
// Tombol edit sticky di samping nama barang (kolom pertama)

import { useState } from 'react';
import styles from './BoothTable.module.css';
// import styles from './BarangBoothTable.module.css';
import SetupBarangBoothModal from './SetupBarangBoothModal';
import toast from 'react-hot-toast';

export default function BarangBoothTable({ items, boothList, loading, error }) {
    const [setupModal, setSetupModal] = useState({ open: false, item: null, settings: [] });

    // Kumpulkan setting barang ini dari semua booth
    function openSetup(item) {
        console.log('item:', item);
        const settings = boothList.map(booth => ({
            booth_id: booth.id,
            booth_name: booth.name,
            safety_stock: item.boothSettings?.[booth.id]?.safety_stock ?? 0,
            min: item.boothSettings?.[booth.id]?.min ?? 0,
            max: item.boothSettings?.[booth.id]?.max ?? 0,
            is_active: item.boothSettings?.[booth.id]?.is_active ?? true,
            can_purchase: item.boothSettings?.[booth.id]?.can_purchase ?? false, // ✅ ini yang hilang

        }));
        setSetupModal({ open: true, item, settings });
    }

    async function handleSetupSubmit(itemId, updatedBooths) {
        try {
            await fetch(`/api/items/${itemId}/booth-settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booths: updatedBooths }),
            });
            toast.success('Pengaturan booth berhasil disimpan');
        } catch (err) {
            toast.error('Gagal menyimpan pengaturan');
        }
    }

    if (loading) return <div className={styles.stateMsg}>Memuat data barang...</div>;
    if (error) return <div className={styles.stateMsg}>Gagal memuat data</div>;

    return (
        <>
            <div className={styles.tableWrap}>
                <table>
                    <thead>
                        <tr>
                            {/*
                             * Kolom ITEM pakai position: sticky + z-index
                             * supaya tetap kelihatan saat scroll horizontal
                             * (kalau booth banyak dan tabelnya perlu scroll ke kanan)
                             */}
                            <th className={styles.thSticky}>Item</th>
                            <th className={styles.thSticky}>Aksi</th>
                            {boothList.map(b => (
                                <th key={b.id}>{b.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                {/* KOLOM NAMA — sticky + tombol edit */}
                                <td className={styles.tdSticky}>
                                    <div className={styles.itemCell}>
                                        <div className={styles.itemInfo}>
                                            <span className={styles.itemName}>{item.name}</span>
                                            <span className={styles.itemCat}>{item.category}</span>
                                        </div>

                                    </div>
                                </td>
                                <td className={styles.tdSticky}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => openSetup(item)}
                                        title="Atur min/maks per booth"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Atur
                                    </button>
                                </td>

                                {/* KOLOM PER BOOTH — badge status stok */}
                                {boothList.map(b => {
                                    const setting = item.boothSettings?.[b.id];
                                    const status = item.stockStatus?.[b.id]; // 'aman' | 'menipis' | 'habis'
                                    return (
                                        <td key={b.id} className={styles.statusCell}>
                                            {setting?.is_active === false ? (
                                                <span className={styles.badgeOff}>● Nonaktif</span>
                                            ) : status === 'habis' ? (
                                                <span className={styles.badgeHabis}>● Habis</span>
                                            ) : status === 'menipis' ? (
                                                <span className={styles.badgeMenipis}>● Menipis</span>
                                            ) : (
                                                <span className={styles.badgeAman}>● Aman</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SetupBarangBoothModal
                isOpen={setupModal.open}
                onClose={() => setSetupModal({ open: false, item: null, settings: [] })}
                onSubmit={handleSetupSubmit}
                item={setupModal.item}
                boothSettings={setupModal.settings}
            />
        </>
    );
}