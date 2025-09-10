// GET /api/tiqets/availability?product_id=XXXX&start=YYYY-MM-DD&end=YYYY-MM-DD
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

const { product_id, start, end, language } = req.query || {};
if (!product_id || !start || !end) {
return res.status(400).json({
error_code: 1000,
error: "Missing argument",
message: "Required arguments product_id, start, end are required",
});
}

const qs = new URLSearchParams({ start, end });
const url = `https://api.tiqets.com/v2/products/${encodeURIComponent(product_id)}/availability?${qs.toString()}`;

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
if (!upstream.ok) console.error("Tiqets /availability error:", upstream.status, text.slice(0, 600));
res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
} catch (err) {
console.error("Proxy crash (/availability):", err);
res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
}
};
