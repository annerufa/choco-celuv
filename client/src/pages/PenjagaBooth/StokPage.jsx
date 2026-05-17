import { useState } from "react";
import { IconSearch, IconPlus } from "./Icons";

const CHIPS = ["Semua", "Minuman", "Makanan", "Bahan Baku"];

const ITEMS = [
  { icon: "☕", name: "Kopi Arabika", sku: "SKU-001", dot: "dot-g", qty: 45, unit: "kg", color: "var(--green)" },
  { icon: "🍵", name: "Kopi Robusta", sku: "SKU-002", dot: "dot-a", qty: 5, unit: "kg", color: "var(--accent)" },
  { icon: "🥛", name: "Susu Full Cream", sku: "SKU-003", dot: "dot-g", qty: 24, unit: "liter", color: "var(--green)" },
  { icon: "🍫", name: "Coklat Bubuk", sku: "SKU-004", dot: "dot-r", qty: 2, unit: "kg", color: "var(--red)" },
  { icon: "🧋", name: "Gula Aren", sku: "SKU-005", dot: "dot-g", qty: 18, unit: "kg", color: "var(--green)" },
  { icon: "🫙", name: "Sirup Vanila", sku: "SKU-006", dot: "dot-a", qty: 4, unit: "btl", color: "var(--accent)" },
];

export default function StokPage() {
  const [activeChip, setActiveChip] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = ITEMS.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div>
            <div className="ptitle">Inventori</div>
            <div className="psub">Stok Barang Tersedia</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "var(--accentsoft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <IconPlus style={{ stroke: "var(--accent)" }} />
          </div>
        </div>
      </div>

      <div className="pbody">
        {/* SEARCH */}
        <div className="srchbar">
          <IconSearch />
          <input
            placeholder="Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* CHIPS */}
        <div className="chips">
          {CHIPS.map(c => (
            <div
              key={c}
              className={`chip${activeChip === c ? " active" : ""}`}
              onClick={() => setActiveChip(c)}
            >
              {c}
            </div>
          ))}
        </div>

        {/* LIST */}
        <div className="slist">
          {filtered.map(item => (
            <div className="sitem" key={item.sku}>
              <div className="sthumb">{item.icon}</div>
              <div>
                <div className="sname">{item.name}</div>
                <div className="ssku">
                  <span className={`sdot ${item.dot}`} />
                  {item.sku}
                </div>
              </div>
              <div className="sright">
                <div className="sqty" style={{ color: item.color }}>{item.qty}</div>
                <div className="sunit">{item.unit}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
