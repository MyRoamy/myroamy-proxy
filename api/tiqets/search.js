// api/tiqets/search.js
// Vercel Serverless Function (Node.js)

module.exports = async (req, res) => {
// --- CORS ---
const origin = req.headers.origin || '';
const ALLOW = [
'https://myroamy.com',
'https://www.myroamy.com',
'https://*.vercel.app',
'http://localhost:3000'
];
const allowed = ALLOW.some(p =>
p.includes('*')
? new RegExp('^' + p.replace('*', '.*') + '$').test(origin)
: p === origin
);
if (allowed) {
res.setHeader('Access-Control-Allow-Origin', origin);
}
res.setHeader('Vary', 'Origin');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Max-Age', '86400');
if (req.method === 'OPTIONS') return res.status(204).end();

// Build Tiqets query
const { q, city, country, lat, lng, radius, page } = req.query || {};
const per_page = req.query.per_page || req.query.size;

const params = new URLSearchParams();
if (q) params.set('query', q);
if (city) params.set('city', city);
if (country) params.set('country', country);
if (lat && lng) {
params.set('lat', lat);
params.set('lng', lng);
if (radius) params.set('radius', radius);
}
if (page) params.set('page', page);
if (per_page) params.set('per_page', per_page);

const url = `https://api.tiqets.com/v2/products?${params.toString()}`;

try {
const r = await fetch(url, {
headers: {
Accept: 'application/json',
'User-Agent': 'myroamy-proxy/1.0',
Authorization: `Token ${process.env.TIQETS_API_KEY}`
}
});

const text = await r.text();
res
.status(r.status)
.setHeader('Content-Type', 'application/json')
.send(text);
} catch (err) {
console.error('Tiqets proxy error:', err);
res.status(500).json({
error: 'proxy_failed',
message: err?.message || 'Unknown error'
});
}
};
