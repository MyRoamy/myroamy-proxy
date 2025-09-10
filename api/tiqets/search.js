// Vercel Serverless Function: /api/tiqets/search
// Accepts: q, city, country, lat, lng, radius, page, per_page, date, categories, tags
// Passes through to Tiqets /v2/products and returns JSON.

const ALLOWED = new Set([
"https://myroamy.com",
"https://www.myroamy.com",
"https://myroamy.webflow.io" // remove later if you like
]);

module.exports = async (req, res) => {
const origin = req.headers.origin || "";
res.setHeader(
"Access-Control-Allow-Origin",
ALLOWED.has(origin) ? origin : "https://myroamy.com"
);
res.setHeader("Vary", "Origin"); // important for caching/CDN correctness
res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
if (req.method === "OPTIONS") return res.status(200).end();

const {
q, city, country, lat, lng, radius,
page, per_page, date, categories, tags, language
} = req.query || {};

const params = new URLSearchParams();

// Tiqets field names
if (q) params.set('query', q);
if (city) params.set('city', city);
if (country) params.set('country', country);
if (date) params.set('date', date);
if (categories) params.set('categories', categories); // comma-separated
if (tags) params.set('tags', tags); // comma-separated

if (lat && lng) {
params.set('lat', lat);
params.set('lng', lng);
if (radius) params.set('radius', radius); // meters
}

// Pagination (defaults)
params.set('page', String(page ?? 0));
params.set('per_page', String(per_page ?? 20));

// Language hint (optional, improves returned copy)
const acceptLang = language || 'en';


try {
const url = `https://api.tiqets.com/v2/products?${params.toString()}`;
const r = await fetch(url, {
headers: {
Accept: "application/json",
"Accept-Language": language || "en",
"User-Agent": "myroamy-proxy/1.0",
// ✅ Partner API uses Authorization: Token <key>
Authorization: `Token ${process.env.TIQETS_API_KEY}`
}
});

const text = await r.text();
// Helpful logging on the server side
if (!r.ok) console.error("Tiqets upstream error:", r.status, text.slice(0, 500));
res.status(r.status).setHeader("Content-Type", "application/json").send(text);
} catch (err) {
console.error("Proxy crash:", err);
res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
}
};
