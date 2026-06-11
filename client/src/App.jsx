// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
// import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/Login';
import DashboardPage from './pages/Dashboard/DashboardPage';
import PemilikDashboard from './pages/Dashboard/PemilikDashboard';
import KurirDashboard from './pages/Dashboard/KurirDashboard';
import BoothDashboard from './pages/Dashboard/BoothDashboard';
import PurchasePage from './pages/Pembelian/PembelianPage';
import DetailPembelianPage from './pages/Pembelian/DetailPembelianPage';

import DataBarangPage from './pages/DataBarang/DataBarangPage';
import DataBarangBoothPage from './pages/DataBarang/DataBarangBoothPage';
import DetailBarangPage from './pages/DataBarang/DetailBarangPage';
import DetailBarangBoothPage from './pages/DataBarang/DetailBarangBoothPage';

import DataBoothPage from './pages/DataBooth/DataBoothPage';
import DistribusiPage from './pages/Distribusi/DistribusiPage';
import DetailDistribusiPage from './pages/Distribusi/DetailDistribusiPage';

import DataKaryawanPage from './pages/DataKaryawan/DataKaryawanPage';
import JadwalPage from './pages/Jadwal/JadwalPage';
import AbsensiPage from './pages/Absensi/RekapAbsensiPage';

import ResepPage from './pages/Resep/ResepPage';
import ProduksiPage from './pages/Produksi/ProduksiPage';
import DetailProduksiPage from './pages/Produksi/DetailProduksiPage';
import RekapProduksiPage from './pages/Produksi/RekapProduksiPage';
import ProductsPage from './pages/Products/ProductsPage';

import RekapPenjualanPage from './pages/Penjualan/RekapPenjualanPage';
import RekapPembelianPage from './pages/Pembelian/RekapPembelianPage';
import ChartPage from './pages/analitik/ChartPage';
import SalesChart from './pages/Analitik/SalesChartPage';
import ProtectedRoute from './routes/ProtectedRoute';

// import HomePenjaga from './pages/Penjaga/Home';
import HomeKurir from './pages/Mobileapp/MobileApp3';

import HomeKaryawan from './pages/Mobile/MobileApp';
export default function App() {
  // console.log(import.meta.env.VITE_API_URL)
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/tes" element={<HomePenjaga />} /> */}

      <Route path="/dashboard/karyawan/*" element={
        <ProtectedRoute allowedRoles={['kurir', 'penjaga_booth']}>
          <HomeKaryawan />
        </ProtectedRoute>
      } />
      {/* 
      <Route path="/dashboard/penjaga_booth/*" element={
        <ProtectedRoute allowedRoles={['penjaga_booth']}>
          <HomePenjaga />
        </ProtectedRoute>
      } /> */}


      <Route element={<MainLayout />}>
        {/* Pemilik — desktop layout */}
        <Route path="/dashboard/pemilik/*" element={
          <ProtectedRoute allowedRoles={['pemilik']}>
            <PemilikDashboard />
          </ProtectedRoute>
        } />

        {/* Kurir — mobile layout */}


        {/* <Route path="/pembelian" element={
          <ProtectedRoute allowedRoles={['pemilik', 'penjaga_booth']}>
            <PurchasePage />
          </ProtectedRoute>
        } /> */}


        <Route path="/pembelian" element={<PurchasePage />} />
        <Route path="/rekap-pembelian" element={<RekapPembelianPage />} />
        <Route path="/pembelian/:id" element={<DetailPembelianPage />} />
        <Route path="/barang" element={<DataBarangPage />} />
        <Route path="/barang/:id" element={<DetailBarangPage />} />
        <Route path="/barang-booth" element={<DataBarangBoothPage />} />
        <Route path="/barang-booth/:item_id/:booth_id" element={<DetailBarangBoothPage />} />
        {/* <Route path="/barang-booth/:id" element={<DetailBarangBoothPage />} /> */}

        <Route path="/booth" element={<DataBoothPage />} />


        <Route path="/karyawan" element={<DataKaryawanPage />} />
        <Route path="/karyawan-jadwal" element={<JadwalPage />} />
        <Route path="/karyawan-absensi" element={<AbsensiPage />} />

        <Route path="/resep" element={<ResepPage />} />
        <Route path="/produk" element={<ProductsPage />} />

        <Route path="/distribusi" element={<DistribusiPage />} />
        <Route path="/distribusi/:id" element={<DetailDistribusiPage />} />
        <Route path="/produksi" element={<ProduksiPage />} />
        <Route path="/produksi-rekap" element={<RekapProduksiPage />} />
        <Route path="/produksi/:id" element={<DetailProduksiPage />} />
        <Route path="/penjualan-rekap" element={<RekapPenjualanPage />} />
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/chart-penjualan" element={<SalesChart />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}