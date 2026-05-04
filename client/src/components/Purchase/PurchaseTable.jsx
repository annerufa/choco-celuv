// src/components/BarangTable/BarangTable.jsx
import { useState, useEffect } from 'react';
import styles from './BarangTable.module.css';
import TambahBarangModal from './TambahBarangModal';
import { useApi } from '../../hooks/useApi';

const ITEMS_PER_PAGE = 10;

const statusVariant = {
    'Aktif': 'success',
    'Stok Kritis': 'warning',
    'Nonaktif': 'danger',
};

const kategoriVariant = {
    'bahan mentah': 'warning',
    'Hasil Mixing': 'accent',
    'Perlengkapan': 'warning',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Kritis': 'danger',
};

function getStokStatus(stok, min, max) {
    if (stok <= min) return 'Kritis';
    if (stok >= max) return 'Overstock';
    return 'Aman';
}

export default function BarangTable({ locationId = 1 }) {
    const { data: items, loading: loadingItems, error: errorItems } = useApi('/items');
    const { data: stokData, loading: loadingStok, error: errorStok } = useApi(`/stock-per-location?location_id=${locationId}`);

    const loading = loadingItems || loadingStok;
    const error = errorItems || errorStok;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barangList, setBarangList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Merge items + stok setelah keduanya loaded
    useEffect(() => {
        if (!items || !stokData) return;

        const stokMap = {};
        stokData.forEach(s => { stokMap[s.item_id] = s; });

        const merged = items.map(item => {
            const stok = stokMap[item.id];
            const stok_sekarang = stok?.current_stock ?? 0;
            const min = stok?.min ?? 0;
            const max = stok?.max ?? 0;
            return {
                ...item,
                stok_sekarang,
                min,
                max,
                stok_status: getStokStatus(stok_sekarang, min, max),
            };
        });

        setBarangList(merged);
    }, [items, stokData]);

    // Reset ke halaman 1 kalau search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Filter berdasarkan search
    const filtered = barangList.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Nomor halaman dengan ellipsis
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page =>
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1
        )
        .reduce((acc, page, i, arr) => {
            if (i > 0 && page - arr[i - 1] > 1) acc.push('...');
            acc.push(page);
            return acc;
        }, []);

    function handleTambahBarang(formData) {
        const newBarang = {
            id: String(barangList.length + 1).padStart(3, '0'),
            name: formData.nama,
            category: formData.kategori,
            unit: formData.satuan,
            harga: formData.hargaTerakhir
                ? `Rp ${Number(formData.hargaTerakhir).toLocaleString('id')}/${formData.satuan}`
                : '-',
            status: 'Aktif',
            stok_sekarang: 0,
            min: 0,
            max: 0,
            stok_status: 'Kritis',
        };
        setBarangList(prev => [...prev, newBarang]);
    }

    return (
        <>
            <div className={styles.card}>

                {/* Header tabel */}
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Daftar Barang — Gudang Pusat</span>
                    <div className={styles.cardActions}>

                        {/* Search */}
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari barang..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button className={styles.btnGhost}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            Filter
                        </button>

                        <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Barang
                        </button>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Kategori</th>
                                <th>Harga</th>
                                <th>Stok</th>
                                {/* <th>Satuan</th> */}
                                {/* <th>Min</th>
                                <th>Max</th> */}
                                <th>Status Stok</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--danger)' }}>
                                        Gagal memuat data barang
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--brown-400)' }}>
                                        Tidak ada barang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((item, index) => {
                                    const nomor = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                    return (
                                        <tr key={item.id}>
                                            <td className={styles.idCell}>{nomor}</td>
                                            <td className={styles.namaCell}>{item.name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[kategoriVariant[item.category]]}`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            {/* <td className={styles.monoCell}>{item.unit}</td> */}
                                            <td className={styles.monoCell}>{item.last_cost}</td>
                                            <td className={styles.monoCell}>{item.stok_sekarang} {item.unit}</td>
                                            {/* <td className={styles.monoCell}>{item.min}</td> */}
                                            {/* <td className={styles.monoCell}>{item.max}</td> */}
                                            <td>
                                                <span className={`${styles.pill} ${styles[stokStatusVariant[item.stok_status]]}`}>
                                                    {item.stok_status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[statusVariant[item.status]]}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button className={styles.iconBtn} aria-label="Lihat detail">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className={styles.iconBtn} aria-label="Edit barang">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button className={`${styles.iconBtn} ${styles.danger}`} aria-label="Nonaktifkan">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                        </svg>
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
                        Menampilkan {paginated.length} dari {filtered.length} barang
                        {filtered.length !== barangList.length && ` (difilter dari ${barangList.length} total)`}
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

                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>...</span>
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

            <TambahBarangModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleTambahBarang}
            />
        </>
    );
}