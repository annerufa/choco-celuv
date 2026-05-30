import { useState } from "react";
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('token');
}

function IconEye({ open }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

function PasswordInput({ placeholder, value, onChange }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input
                style={{ ...styles.input, paddingRight: 42 }}
                type={show ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                onClick={() => setShow(v => !v)}
                style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#a8967e', display: 'flex', alignItems: 'center',
                    padding: 0,
                }}
            >
                <IconEye open={show} />
            </button>
        </div>
    );
}

export default function SetPasswordModal({ onSuccess, onClose }) {
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const canClose = !!onClose; // kalau onClose ada berarti dipanggil dari tombol, bisa ditutup

    async function handleSubmit() {
        setErr("");
        if (pw.length < 6) return setErr("Password minimal 6 karakter.");
        if (pw !== pw2) return setErr("Password tidak cocok.");

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/karyawan/update-password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ password: pw }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal update password.");
            onSuccess();
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleOverlayClick() {
        if (canClose) onClose();
    }

    return (
        <div style={styles.overlay} onClick={handleOverlayClick}>
            <div style={styles.card} onClick={e => e.stopPropagation()}>
                <div style={styles.iconWrap}>🔐</div>
                <h2 style={styles.title}>
                    {canClose ? 'Ubah Password' : 'Buat Password Baru'}
                </h2>
                <p style={styles.sub}>
                    {canClose
                        ? 'Masukkan password baru kamu.'
                        : 'Akun kamu baru dibuat oleh pemilik. Silakan buat password baru sebelum melanjutkan.'}
                </p>

                <PasswordInput
                    placeholder="Password baru"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                />
                <PasswordInput
                    placeholder="Ulangi password"
                    value={pw2}
                    onChange={e => setPw2(e.target.value)}
                />

                {err && <p style={styles.err}>{err}</p>}

                <button
                    style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Menyimpan..." : "Simpan Password"}
                </button>

                {canClose && (
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Batal
                    </button>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(28, 16, 8, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
    },
    card: {
        background: "#fff",
        borderRadius: "24px",
        padding: "28px 24px 24px",
        width: "100%",
        maxWidth: "310px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 20px 60px rgba(100,70,20,0.25)",
    },
    iconWrap: { fontSize: "36px", textAlign: "center", marginBottom: "2px" },
    title: { fontSize: "18px", fontWeight: 900, color: "#1a1309", textAlign: "center" },
    sub: { fontSize: "12px", color: "#6b5a42", textAlign: "center", lineHeight: 1.5, marginBottom: "4px" },
    input: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1.5px solid rgba(120,90,40,0.18)",
        fontSize: "14px",
        fontFamily: "inherit",
        color: "#1a1309",
        outline: "none",
        background: "#f7f5f2",
    },
    err: { fontSize: "12px", color: "#c0392b", textAlign: "center", fontWeight: 600 },
    btn: {
        marginTop: "6px",
        width: "100%",
        padding: "14px",
        borderRadius: "13px",
        border: "none",
        background: "#D4500A",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    cancelBtn: {
        width: "100%",
        padding: "11px",
        borderRadius: "13px",
        border: "1.5px solid rgba(120,90,40,0.18)",
        background: "transparent",
        color: "#6b5a42",
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
};