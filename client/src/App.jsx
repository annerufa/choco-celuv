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

import DataBoothPage from './pages/DataBooth/DataBoothPage';
import DistribusiPage from './pages/Distribusi/DistribusiPage';

import DataKaryawanPage from './pages/DataKaryawan/DataKaryawanPage';
import JadwalPage from './pages/DataKaryawan/JadwalPage';

import ResepPage from './pages/Resep/ResepPage';

import ProtectedRoute from './routes/ProtectedRoute';

// import HomePenjaga from './pages/Penjaga/Home';
import HomePenjaga from './pages/Mobileapp/MobileApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tes" element={<HomePenjaga />} />

      <Route element={<MainLayout />}>
        {/* Pemilik — desktop layout */}
        <Route path="/dashboard/pemilik/*" element={
          <ProtectedRoute allowedRoles={['pemilik']}>
            <PemilikDashboard />
          </ProtectedRoute>
        } />

        {/* Kurir — mobile layout */}
        <Route path="/dashboard/kurir/*" element={
          <ProtectedRoute allowedRoles={['kurir']}>
            <KurirDashboard />
          </ProtectedRoute>
        } />

        {/* Penjaga booth — mobile layout */}
        <Route path="/dashboard/penjaga_booth/*" element={
          <ProtectedRoute allowedRoles={['penjaga_booth']}>
            <BoothDashboard />
          </ProtectedRoute>
        } />

        {/* <Route path="/pembelian" element={
          <ProtectedRoute allowedRoles={['pemilik', 'penjaga_booth']}>
            <PurchasePage />
          </ProtectedRoute>
        } /> */}


        <Route path="/pembelian" element={<PurchasePage />} />
        <Route path="/pembelian/:id" element={<DetailPembelianPage />} />
        <Route path="/barang" element={<DataBarangPage />} />
        <Route path="/barang/:id" element={<DetailBarangPage />} />
        <Route path="/barang/booth" element={<DataBarangBoothPage />} />

        <Route path="/booth" element={<DataBoothPage />} />


        <Route path="/karyawan" element={<DataKaryawanPage />} />
        <Route path="/karyawan/jadwal" element={<JadwalPage />} />

        <Route path="/resep" element={<ResepPage />} />

        <Route path="/distribusi" element={<DistribusiPage />} />

      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}