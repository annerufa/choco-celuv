// statsConfig.js
export function getStatsBarang(barangList) {
    const totalAktif = barangList.filter(b => b.is_active).length;
    const totalAman = barangList.filter(b => b.is_active && b.stok_status === 'Aman').length;
    const totalMenipis = barangList.filter(b => b.is_active && b.stok_status === 'Menipis').length;
    const totalKritis = barangList.filter(b => b.is_active && ['Kritis', 'Habis'].includes(b.stok_status)).length;

    return [
        { id: 'total', icon: 'barang', iconVariant: 'brown', value: totalAktif, label: 'Total barang aktif' },
        { id: 'aman', icon: 'bahan', iconVariant: 'success', value: totalAman, label: 'Stok barang aman' },
        {
            id: 'menipis', icon: 'perlengkapan', iconVariant: 'warning', value: totalMenipis, label: 'Stok menipis',
            change: totalMenipis > 0 ? { type: 'down', text: 'Perlu restock' } : null
        },
        {
            id: 'kritis', icon: 'warning', iconVariant: 'accent', value: totalKritis, label: 'Stok kritis dan habis',
            change: totalKritis > 0 ? { type: 'down', text: 'Perlu restock' } : null
        },
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

// src/components/StatsGrid/statsConfig.js
export const getStatsKaryawan = (karyawanList) => {

    const karyawanAktif = karyawanList.filter(b => b.is_active).length;
    // const karyawanOn = karyawanList.filter(b => ['Kritis', 'Habis'].includes(b.stok_status)).length;
    // const karyawanOff = karyawanList.filter(b => ['Kritis', 'Habis'].includes(b.stok_status)).length;

    return [
        { id: 'aktif', icon: 'barang', iconVariant: 'brown', value: totalAktif, label: 'Total karyawan aktif' },
        { id: 'on', icon: 'bahan', iconVariant: 'success', value: totalAman, label: 'Karyawan Clock-in' }
        // totalKaryawan: karyawanList.length,
        // karyawanAktif: karyawanList.filter(k => k.is_active).length,
        // Tambahkan statistik lain sesuai kebutuhan
    ];
};