// SetPasswordModal.jsx — bisa dijadikan file terpisah
import { useState } from "react";

export default function SetPasswordModal({ onSuccess }) {
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    async function handleSubmit() {
        setErr("");
        if (pw.length < 6) return setErr("Password minimal 6 karakter.");
        if (pw !== pw2) return setErr("Password tidak cocok.");

        setLoading(true);
        try {
            // Ganti endpoint sesuai API kamu
            const res = await fetch("/api/karyawan/update-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password: pw }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal update password.");
            onSuccess(); // callback → tutup modal + update state user
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.iconWrap}>🔐</div>
                <h2 style={styles.title}>Buat Password Baru</h2>
                <p style={styles.sub}>
                    Akun kamu baru dibuat oleh pemilik. Silakan buat password baru
                    sebelum melanjutkan.
                </p>

                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password baru"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                />
                <input
                    style={styles.input}
                    type="password"
                    placeholder="Ulangi password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                />

                {err && <p style={styles.err}>{err}</p>}

                <button
                    style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Menyimpan..." : "Simpan Password"}
                </button>
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
        maxWidth: "360px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 20px 60px rgba(100,70,20,0.25)",
    },
    iconWrap: {
        fontSize: "36px",
        textAlign: "center",
        marginBottom: "2px",
    },
    title: {
        fontSize: "18px",
        fontWeight: 900,
        color: "#1a1309",
        textAlign: "center",
    },
    sub: {
        fontSize: "12px",
        color: "#6b5a42",
        textAlign: "center",
        lineHeight: 1.5,
        marginBottom: "4px",
    },
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
    err: {
        fontSize: "12px",
        color: "#c0392b",
        textAlign: "center",
        fontWeight: 600,
    },
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
};