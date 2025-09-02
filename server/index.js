import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 8787;
const SERP_API_KEY = process.env.SERP_API_KEY;

/* health */
app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "compare-api" });
});
app.get("/api/search", async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        console.log("SEARCH:", q); // ← aranan kelime

        // ... mevcut kod ...

        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const text = await r.text();
        let j;
        try { j = JSON.parse(text); } catch (e) {
            console.error("SERP raw (not json) >>>", text.slice(0,200));
            return res.json({ ok:false, error:"serp_non_json" });
        }

        if (j.error) {
            console.error("SERP error >>>", j.error);
            return res.json({ ok:false, error:String(j.error) });
        }

        // ... kalan parse & res.json({ok:true, items})
    } catch (e) {
        console.error("search error:", e);
        res.status(500).json({ ok:false, error:"server_error" });
    }
});

/* img proxy */
app.get("/img", async (req, res) => {
    try {
        const u = req.query.u;
        if (!u || !/^https?:\/\//i.test(u)) return res.status(400).end();

        const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!r.ok) return res.status(r.status).end();

        const ct = r.headers.get("content-type") || "image/jpeg";
        res.set("Content-Type", ct);
        res.set("Cache-Control", "public, max-age=86400, immutable");

        // pipe
        r.body.pipe(res);
    } catch (e) {
        console.error("IMG proxy error:", e);
        res.status(500).end();
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server ready on http://localhost:${PORT}`);
});
