// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../services/authService';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginApi(username, password);
            login(data);           // simpan ke context + localStorage
            navigate('/karyawan'); // redirect setelah login
        } catch (err) {
            setError(err.response?.data?.payload?.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brown-50)' }}>
            <div className="card" style={{ width: 360, padding: 32 }}>
                <h1 className="page-title" style={{ marginBottom: 4 }}>Choco <span style={{ color: 'var(--accent-light)' }}>Celuv</span></h1>
                <p className="page-subtitle" style={{ marginBottom: 24 }}>Masuk ke akun Anda</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" type="text" value={username}
                            onChange={e => setUsername(e.target.value)} placeholder="username" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password}
                            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
}