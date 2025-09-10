// GET /api/tiqets/availability
// Proxies to Tiqets /v2/products/{product_id}/availability
// Accepts: product_id (required), start|start_date, end|end_date
// If the requested range > 31 days, we chunk it and merge.

const ALLOWED = new Set([
"https://myroamy.com",
"https://www.myroamy.com",
"https://myroamy.webflow.io",
]);

function toISO(d){ return d.toISOString().slice(0,10); } // YYYY-MM-DD

function splitIntoWindows(startStr, endStr, maxDays = 31){
const start = new Date(startStr + "T00:00:00Z");
const end = new Date(endStr + "T00:00:00Z");
const windows = [];
let cur = new Date(start);
while (cur <= end) {
const winStart = new Date(cur);
const winEnd = new Date(cur); winEnd.setUTCDate(winEnd.getUTCDate() + (maxDays - 1));
if (winEnd > end) winEnd.setTime(end.getTime());
windows.push({ start: toISO(winStart), end: toISO(winEnd) });
cur.setUTCDate(cur.getUTCDate() + maxDays);
}
return windows;
}

module.exports = async (req, res) => {
// --- CORS ---
const origin = req.headers.origin || "";
res.setHeader("Access-Control-Allow-Origin", ALLOWED.has(origin) ? origin : "https://myroamy.com");
res.setHeader("Vary", "Origin");
res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
res.setHeader("Access-Control-Max-Age", "600");
if (req.method === "OPTIONS") return res.status(200).end();
if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

if (!process.env.TIQETS_API_KEY) {
console.error("Missing TIQETS_API_KEY");
return res.status(500).json({ error: "config_error", message: "Missing TIQETS_API_KEY" });
}

const { product_id } = req.query || {};
const start = req.query.start || req.query.start_date;
const end = req.query.end || req.query.end_date;
const language = req.query.language || "en";

if (!product_id) return res.status(400).json({ error: "missing_product_id", message: "product_id is required" });
if (!start || !end) return res.status(400).json({ error: "missing_dates", message: "start/end (YYYY-MM-DD) are required" });

// Build 1..N requests (31-day windows)
const windows = splitIntoWindows(start, end, 31);

try {
const results = [];
for (const w of windows) {
const qs = new URLSearchParams({ start: w.start, end: w.end });
const url = `https://api.tiqets.com/v2/products/${encodeURIComponent(product_id)}/availability?${qs.toString()}`;
const r = await fetch(url, {
headers: {
Accept: "application/json",
"Accept-Language": language,
"User-Agent": "myroamy-proxy/1.0",
Authorization: `Token ${process.env.TIQETS_API_KEY}`
}
});
const text = await r.text();
if (!r.ok) {
console.error("Tiqets availability error:", r.status, text.slice(0, 500));
return res.status(r.status).setHeader("Content-Type", "application/json; charset=utf-8").send(text);
}
results.push(JSON.parse(text)); // each is an object keyed by ISO datetime
}

// Merge objects (later windows override same keys, though they shouldn't overlap)
const merged = Object.assign({}, ...results);
res.status(200).json({ product_id, start, end, availability: merged });
} catch (err) {
console.error("Availability proxy crash:", err);
res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
}
};
