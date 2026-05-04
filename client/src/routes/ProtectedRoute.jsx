// proteksi halaman berdasarkan role

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const ROLE_ROUTES = {
            pemilik: '/dashboard/pemilik',
            kurir: '/dashboard/kurir',
            penjaga_booth: '/dashboard/booth',
        };
        return <Navigate to={ROLE_ROUTES[user.role] ?? '/login'} replace />;
    }

    return children;
};
