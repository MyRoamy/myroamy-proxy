// GET /api/tiqets/products
// Proxies to Tiqets /v2/products (content search/list)

const ALLOWED = new Set([
"https://myroamy.com",
"https://www.myroamy.com",
"https://myroamy.webflow.io", // keep for Webflow preview, remove later if you want
]);

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

// Accepted query params (you can add more as needed)
const {
q, city, country, lat, lng, radius,
page, per_page, categories, tags, language
} = req.query || {};

const qs = new URLSearchParams();
if (q) qs.set("query", q);
if (city) qs.set("city", city);
if (country) qs.set("country", country);
if (categories) qs.set("categories", categories);
if (tags) qs.set("tags", tags);
if (lat && lng) { qs.set("lat", lat); qs.set("lng", lng); if (radius) qs.set("radius", radius); }
qs.set("page", String(page ?? 0));
qs.set("per_page", String(per_page ?? 20));

const url = `https://api.tiqets.com/v2/products?${qs.toString()}`;

try {
const upstream = await fetch(url, {
headers: {
Accept: "application/json",
"Accept-Language": language || "en",
"User-Agent": "myroamy-proxy/1.0",
Authorization: `Token ${process.env.TIQETS_API_KEY}`
}
});
const text = await upstream.text();
if (!upstream.ok) console.error("Tiqets products error:", upstream.status, text.slice(0, 500));
res.status(upstream.status).setHeader("Content-Type", "application/json; charset=utf-8").send(text);
} catch (err) {
console.error("Products proxy crash:", err);
res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
}
};
