// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export default function AuthLayout() {
    return (
        <div className={styles.authWrapper}>
            <Outlet />
        </div>
    );
}