// GET /api/tiqets/products?q=&city=&country=&date=&lat=&lng=&radius=&page=&per_page=&categories=&tags=
const ALLOWED = new Set([
"https://myroamy.com",
"https://www.myroamy.com",
"https://myroamy.webflow.io",
]);

module.exports = async (req, res) => {
const origin = req.headers.origin || "";
res.setHeader("Access-Control-Allow-Origin", ALLOWED.has(origin) ? origin : "https://myroamy.com");
res.setHeader("Vary", "Origin");
res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
if (req.method === "OPTIONS") return res.status(200).end();

const {
q, city, country, lat, lng, radius,
page, per_page, date, categories, tags, language
} = req.query || {};

const params = new URLSearchParams();
if (q) params.set("query", q);
if (city) params.set("city", city);
if (country) params.set("country", country);
if (date) params.set("date", date); // optional hint; some catalogs ignore
if (categories) params.set("categories", categories);
if (tags) params.set("tags", tags);
if (lat && lng) {
params.set("lat", lat);
params.set("lng", lng);
if (radius) params.set("radius", radius);
}
params.set("page", String(page ?? 0));
params.set("per_page", String(per_page ?? 20));

const url = `https://api.tiqets.com/v2/products?${params.toString()}`;

try {
const upstream = await fetch(url, {
headers: {
Accept: "application/json",
"Accept-Language": language || "en",
"User-Agent": "myroamy-proxy/1.0",
Authorization: `Token ${process.env.TIQETS_API_KEY}`,
},
});

const text = await upstream.text();
if (!upstream.ok) console.error("Tiqets /products error:", upstream.status, text.slice(0, 600));
res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
} catch (err) {
console.error("Proxy crash (/products):", err);
res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
}
};
