// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // ✅ Fix 1: pindah ke useEffect
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = (data) => {
    // data = { token, user } dari response API
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);

    // Pasang token ke semua request axios setelah login
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };
  // ✅ Tambahan: update sebagian field user + sync localStorage
  const updateUser = (fields) => {
    setUser((prev) => {
      const updated = { ...prev, ...fields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };
  // ✅ Fix 2: stabilkan value agar consumer tidak re-render terus
  const value = useMemo(() => ({ user, token, login, logout, updateUser }), [user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   // Ambil dari localStorage supaya tidak hilang saat refresh
//   const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
//   const [token, setToken] = useState(() => localStorage.getItem('token') || null);

//   const login = (data) => {
//     // data = { token, user } dari response API
//     localStorage.setItem('token', data.token);
//     localStorage.setItem('user', JSON.stringify(data.user));
//     setToken(data.token);
//     setUser(data.user);

//     // Pasang token ke semua request axios setelah login
//     axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
//   };

//   

//   // Pasang token otomatis saat app pertama load (misal refresh halaman)
//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   }

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


// import { createContext, useContext, useState } from 'react';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   // Simulasi user login — nanti diganti dari response API /auth/login
//   const [user, setUser] = useState({
//     id: 1,
//     nama: 'Budi Santoso',
//     inisial: 'BS',
//     role: 'admin', // coba ganti: 'kasir' | 'gudang' untuk lihat perbedaan menu
//   });

//   const login  = (userData) => setUser(userData);
//   const logout = () => setUser(null);

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
