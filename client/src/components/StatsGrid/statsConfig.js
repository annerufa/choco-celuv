// statsConfig.js
export function getStatsBarang(barangList) {
    const aktif = barangList.filter(b => b.is_active);
    const totalAktif = aktif.length;
    const totalOver = aktif.filter(b => b.stok_status === 'Overstock').length;
    const totalMenipis = aktif.filter(b => b.stok_status === 'Menipis').length;
    const totalKritis = aktif.filter(b => ['Kritis', 'Habis'].includes(b.stok_status)).length;

    return [
        { id: 'total', icon: 'barang', iconVariant: 'brown', value: totalAktif, label: 'Total barang aktif' },
        {
            id: 'menipis', icon: 'perlengkapan', iconVariant: 'warning', value: totalMenipis, label: 'Stok menipis',
            change: totalMenipis > 0 ? { type: 'down', text: 'Segera restock barang' } : null
        },
        {
            id: 'over', icon: 'warning', iconVariant: 'accent', value: totalOver, label: 'Overstock',
            change: totalOver > 0 ? { type: 'up', text: 'Stok terlalu banyak' } : null
        },
        {
            id: 'kritis', icon: 'warning', iconVariant: 'accent', value: totalKritis, label: 'Stok kritis dan habis',
            change: totalKritis > 0 ? { type: 'down', text: 'Stok di bawah batas aman' } : null
        },
    ];
}
export function getStatsKaryawan(karyawanList) {
    const totalKaryawan = karyawanList.length;
    const karyawanAktif = karyawanList.filter(k => k.is_active).length;
    const totalKurir = karyawanList.filter(k => k.is_active && k.role === 'kurir').length;
    const totalPenjaga = karyawanList.filter(k => k.is_active && k.role === 'penjaga_booth').length;

    return [
        { id: 'total', icon: 'person', variant: 'br', value: totalKaryawan, label: 'Total Karyawan' },
        { id: 'aktif', icon: 'aktif', iconVariant: 'gn', value: karyawanAktif, label: 'Total Karyawan Aktif' },
        { id: 'kurir', icon: 'kurir', iconVariant: 'rd', value: totalKurir, label: 'Total Kurir' },
        { id: 'penjaga', icon: 'booth', variant: 'or', value: totalPenjaga, label: 'Total Penjaga Booth' },
    ];
}

// src/components/StatsGrid/statsConfig.js
export const getStatsBooth = (boothList) => {
    const totalBooth = boothList.length;
    const boothAktif = boothList.filter(b => b.is_active).length;
    const boothNonaktif = boothList.filter(b => !b.active).length;
    const boothOpen = boothList.filter(b => b.is_open).length;

    return [
        { id: 'total', icon: 'barang', iconVariant: 'brown', value: totalBooth, label: 'Total booth' },
        { id: 'aktif', icon: 'bahan', iconVariant: 'success', value: boothAktif, label: 'Total Booth Aktif' },
        { id: 'non-aktif', icon: 'bahan', iconVariant: 'success', value: boothNonaktif, label: 'Total Booth Non-Aktif' },
        { id: 'on', icon: 'bahan', iconVariant: 'success', value: boothOpen, label: 'Total Booth sedang buka' }
    ];
};

export function getStatsKeuangan(transaksiList) {
    const totalPemasukan = transaksiList.filter(t => t.type === 'masuk').reduce((s, t) => s + t.nominal, 0);
    const totalPengeluaran = transaksiList.filter(t => t.type === 'keluar').reduce((s, t) => s + t.nominal, 0);

    return [
        { id: 'pemasukan', icon: 'bahan', iconVariant: 'success', value: `Rp ${totalPemasukan.toLocaleString()}`, label: 'Total pemasukan' },
        { id: 'pengeluaran', icon: 'warning', iconVariant: 'accent', value: `Rp ${totalPengeluaran.toLocaleString()}`, label: 'Total pengeluaran' },
        // tambah stat lain...
    ];
}

