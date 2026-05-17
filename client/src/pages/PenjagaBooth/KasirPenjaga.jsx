import { useState } from "react";
import { IconSearch } from "./Icons";

const INITIAL_CART = [
  { id: 1, icon: "☕", name: "Americano", price: 25000, qty: 2 },
  { id: 2, icon: "🧋", name: "Es Kopi Aren", price: 32000, qty: 1 },
  { id: 3, icon: "🍫", name: "Cokelat Panas", price: 28000, qty: 1 },
];

export default function KasirPenjaga() {
  const [cart, setCart] = useState(INITIAL_CART);

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
        .filter(item => item.qty > 0)
    );
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div><div className="ptitle">Kasir</div></div>
          <div style={{
            fontSize: 11, color: "var(--text2)",
            background: "var(--bg3)", padding: "4px 10px",
            borderRadius: 8, border: "1px solid var(--border)"
          }}>
            #INV-0313
          </div>
        </div>
      </div>

      <div className="pbody">
        {/* SEARCH */}
        <div className="srchbar">
          <IconSearch />
          <input placeholder="Cari atau scan produk..." />
        </div>

        {/* KERANJANG */}
        <div className="sec-title">Keranjang</div>
        <div className="klist">
          {cart.map(item => (
            <div className="kitem" key={item.id}>
              <div className="kthumb">{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="kname">{item.name}</div>
                <div className="kprice">Rp {item.price.toLocaleString("id-ID")}</div>
              </div>
              <div className="qctrl">
                <div className="qbtn" onClick={() => updateQty(item.id, -1)}>−</div>
                <div className="qnum">{item.qty}</div>
                <div className="qbtn" onClick={() => updateQty(item.id, +1)}>+</div>
              </div>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="ktotal">
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Total Bayar</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text1)" }}>
              Rp {total.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>
              {totalItems} item · diskon 0
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text2)" }}>Metode</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>QRIS</div>
          </div>
        </div>

        <button className="baybtn">Proses Pembayaran →</button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
