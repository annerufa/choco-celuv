import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
// import './assets/index.css';
import './global.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // 👈 tambah import ini
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>  {/* 👈 bungkus App dengan AuthProvider */}
        <App />
        <Toaster position="top-center" /> {/* ← alert notif */}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
