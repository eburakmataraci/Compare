import React, { useMemo, useState, useEffect } from "react";

/* ====== Basit kur (demo) ====== */
const FX = { TRY: 1, USD: 34.5, EUR: 37.5 };
const convert = (amount, from, to) => {
    if (from === to) return amount;
    const inTRY = amount * (FX[from] ?? 1);
    return inTRY / (FX[to] ?? 1);
};
const money = (v, c) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: c }).format(v);

/* ====== API (sağlam sürüm) ====== */
async function apiSearch(q) {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const text = await r.text(); // önce ham metin

    let j;
    try {
        j = text ? JSON.parse(text) : null;
    } catch {
        throw new Error(
            `API yanıtı JSON değil: ${text?.slice(0, 140) || "boş yanıt"}`
        );
    }
    if (!j || !j.ok) {
        throw new Error((j && j.error) || "API hata/boş yanıt");
    }
    return j.items; // [{ store,title,url,price,currency,deliveryEstimate,thumbnail }, ...]
}

/* ====== Görsel helper ======
   - Kaynak varsa server proxy’sinden (/img?u=) geçir
   - Yoksa şık bir placeholder çiz
*/
function ImageOrPlaceholder({ src, alt, className }) {
    if (!src) {
        return (
            <div
                className={
                    "bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/10 " +
                    className
                }
                aria-label={alt}
            />
        );
    }
    const proxied = `/img?u=${encodeURIComponent(src)}`;
    return (
        <img
            src={proxied}
            alt={alt}
            className={"object-contain bg-slate-950/40 " + className}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
                // proxy başarısızsa placeholder’a düş
                e.currentTarget.replaceWith(
                    Object.assign(document.createElement("div"), {
                        className:
                            "bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/10 " +
                            className,
                        ariaLabel: alt,
                    })
                );
            }}
        />
    );
}

export default function App() {
    /* splash */
    const [showSplash, setShowSplash] = useState(true);

    /* app state */
    const [q, setQ] = useState("");
    const [ccy, setCcy] = useState("TRY");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        document.title = "Compare";
    }, []);
    useEffect(() => {
        const t1 = setTimeout(() => setShowSplash(false), 1200);
        return () => clearTimeout(t1);
    }, []);

    async function onSearch(e) {
        e?.preventDefault();
        if (!q.trim()) return;
        setLoading(true);
        setErr("");
        try {
            const items = await apiSearch(q.trim());
            setOffers(items);
            setTimeout(() => window.scrollTo({ top: 160, behavior: "smooth" }), 50);
        } catch (e) {
            setErr(String(e.message || e));
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }

    // KARGO YOK: toplam = ürün fiyatı
    const enriched = useMemo(() => {
        return offers.map((o) => {
            const curr = o.currency || "TRY";
            const item = convert(o.price, curr, ccy);
            return { ...o, item, total: item };
        });
    }, [offers, ccy]);

    const sorted = useMemo(() => [...enriched].sort((a, b) => a.total - b.total), [enriched]);
    const best = sorted[0];
    const others = sorted.slice(1, 80);

    return (
        <>
            {/* Arka plan */}
            <div className="bg-animated" />
            <div className="bg-noise" />

            {/* Splash */}
            {showSplash && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 splash-enter">
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 shadow-2xl shadow-cyan-900/40 grid place-items-center">
                            <span className="text-3xl font-black text-slate-900">C</span>
                        </div>
                        <div className="mt-4 text-3xl md:text-4xl font-black tracking-tight">
                            Compare
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                            akıllı fiyat karşılaştırma
                        </div>
                    </div>
                </div>
            )}
            {!showSplash && <div className="splash-leave fixed inset-0 pointer-events-none" />}

            {/* Üst şerit */}
            <div className="h-2 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400" />

            {/* Header */}
            <header className="mx-auto max-w-7xl px-6 pt-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_24px_rgba(56,189,248,.25)]">
                        Compare
                    </h1>
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Canlı arama
                    </div>
                </div>
                <p className="mt-3 text-slate-300">
                    Ürün ara; <span className="font-semibold text-cyan-300">en iyi fiyatı</span> bul.
                </p>
            </header>

            {/* Arama paneli */}
            <section className="mx-auto max-w-7xl px-6 py-6">
                <form
                    onSubmit={onSearch}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-white/10 p-5"
                >
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder='Örn: “PlayStation 5 Slim”'
                            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                        <select
                            value={ccy}
                            onChange={(e) => setCcy(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-lg text-white focus:ring-2 focus:ring-cyan-400"
                        >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:opacity-95 transition disabled:opacity-60"
                        >
                            {loading ? "Aranıyor…" : "Ara"}
                        </button>
                    </div>

                    {err && (
                        <div className="mt-3 rounded-lg bg-rose-800/30 border border-rose-500/40 px-3 py-2 text-rose-200">
                            {err}
                        </div>
                    )}
                </form>
            </section>

            {/* Önerilen */}
            {best && (
                <section className="mx-auto max-w-7xl px-6 pb-6">
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-300/40 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-teal-500" />
                        <div className="p-6 grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-5 items-center">
                            <div className="h-36 w-full md:w-[160px] md:h-[120px] rounded-xl ring-1 ring-white/10 overflow-hidden">
                                <ImageOrPlaceholder
                                    src={best.thumbnail}
                                    alt={best.title}
                                    className="w-full h-full"
                                />
                            </div>

                            <div>
                                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50">
                    Önerilen
                  </span>
                                    <span className="text-xs text-slate-400">En düşük fiyat</span>
                                </div>
                                <h2 className="text-xl font-semibold text-white">{best.title}</h2>
                                <p className="text-sm text-slate-400">
                                    Mağaza: {best.store} · Teslimat: {best.deliveryEstimate || "-"}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-slate-400">Toplam</div>
                                <div className="text-3xl font-extrabold text-emerald-300">
                                    {money(best.total, ccy)}
                                </div>
                                <a
                                    href={best.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block mt-3 rounded-lg border border-slate-600 px-4 py-2 text-cyan-300 hover:bg-slate-800/60"
                                >
                                    Siteye Git
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Diğerleri */}
            {others.length > 0 && (
                <section className="mx-auto max-w-7xl px-6 pb-16">
                    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                        <table className="min-w-full text-sm text-slate-200">
                            <thead className="bg-slate-800/70 text-slate-300">
                            <tr>
                                <th className="py-3 px-4 text-left w-16"> </th>
                                <th className="py-3 px-4 text-left">Mağaza</th>
                                <th className="py-3 px-4 text-left">Ürün</th>
                                <th className="py-3 px-4 text-left">Fiyat</th>
                                <th className="py-3 px-4 text-left">Teslimat</th>
                                <th className="py-3 px-4 text-left">Bağlantı</th>
                            </tr>
                            </thead>
                            <tbody>
                            {others.map((o, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-slate-800/60 hover:bg-slate-800/50"
                                >
                                    <td className="py-2 px-4">
                                        <div className="h-12 w-12 rounded-md ring-1 ring-white/10 overflow-hidden">
                                            <ImageOrPlaceholder
                                                src={o.thumbnail}
                                                alt={o.title}
                                                className="h-full w-full"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-medium">{o.store}</td>
                                    <td className="py-3 px-4">{o.title}</td>
                                    <td className="py-3 px-4 font-semibold text-cyan-300">
                                        {money(o.total, ccy)}
                                    </td>
                                    <td className="py-3 px-4">{o.deliveryEstimate || "-"}</td>
                                    <td className="py-3 px-4">
                                        <a
                                            className="text-indigo-300 hover:underline"
                                            href={o.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Siteye Git
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Boş durum */}
            {!loading && !best && (
                <div className="mx-auto max-w-7xl px-6 pb-16">
                    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/10 p-10 text-center text-slate-300">
                        Aramak için yukarıdaki kutuyu kullanın.
                    </div>
                </div>
            )}
        </>
    );
}
