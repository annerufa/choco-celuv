// src/components/Sidebar/menuConfig.js

export const menuConfig = [
    {
        section: 'Utama',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                path: '/dashboard/pemilik',
                icon: 'dashboard',   // nanti kita map ke SVG
            },
        ],
    },
    {
        section: 'Data Master',
        items: [
            {
                id: 'barang',
                label: 'Data Barang',
                path: null,           // null = punya submenu, tidak langsung navigate
                icon: 'barang',
                submenu: [
                    { label: 'Barang Pusat', path: '/barang' },
                    { label: 'Barang Booth', path: '/barang-booth' },
                ],
            },
            {
                id: 'booth',
                label: 'Data Booth',
                path: '/booth',
                icon: 'booth',
                // submenu: [
                //     { label: 'Daftar Booth', path: '/booth' },
                //     { label: 'Stok per Booth', path: '/booth/stok' },
                // ],
            },
            {
                id: 'karyawan',
                label: 'Karyawan',
                path: null,
                icon: 'karyawan',
                submenu: [
                    { label: 'Daftar karyawan', path: '/karyawan' },
                    { label: 'Jadwal jaga', path: '/karyawan-jadwal' },
                    { label: 'Absensi', path: '/karyawan-absensi' },
                ],
            },
            {
                id: 'resep',
                label: 'Resep',
                path: '/resep',
                icon: 'resep',
            },
            {
                id: 'produk',
                label: 'Produk',
                path: '/produk',
                icon: 'produk',
            },
        ],
    },
    {
        section: 'Data Transaksi',
        items: [
            {
                id: 'pembelian',
                label: 'Pembelian',
                path: '/pembelian',           // null = punya submenu, tidak langsung navigate
                icon: 'pembelian',
                // submenu: [
                //   { label: 'Pembelian', path: '/pembelian' },
                //   { label: 'Barang Booth', path: '/barang/booth' },
                // ],
            },
            {
                id: 'distribusi',
                label: 'Distribusi',
                path: '/distribusi',
                icon: 'distribusi',
                // submenu: [
                //   { label: 'Daftar Booth', path: '/booth' },
                //   { label: 'Stok per Booth', path: '/booth/stok' },
                // ],
            },
            {
                id: 'produksi',
                label: 'Produksi',
                path: null,
                icon: 'produksi',
                submenu: [
                    { label: 'Poduksi', path: '/produksi' },
                    { label: 'Rekap Produksi', path: '/produksi-rekap' },
                    // { label: 'Absensi', path: '/karyawan/absen' },
                ],
            },
            {
                id: 'penjualan',
                label: 'Penjualan',
                path: '/penjualan-rekap',
                icon: 'jual',
            },
        ],
    },
    // ... section lain
];