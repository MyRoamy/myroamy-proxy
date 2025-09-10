// Vercel Serverless Function (framework-less).
// GET /api/tiqets/search?q=...&city=...&country=...&lat=...&lng=...&radius=...&page=...&per_page=...

module.exports = async (req, res) => {
  // --- CORS: during testing you can use "*" then lock to your domain ---
  res.setHeader('Access-Control-Allow-Origin', 'https://myroamy.com'); // change to "https://myroamy.com" when live
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Build Tiqets query
  const { q, city, country, lat, lng, radius, page, per_page } = req.query || {};
  const params = new URLSearchParams();
  if (q)        params.set('query', q);
  if (city)     params.set('city', city);
  if (country)  params.set('country', country);
  if (lat && lng) {
    params.set('lat', lat);
    params.set('lng', lng);
    if (radius) params.set('radius', radius); // meters
  }
  if (page)     params.set('page', page);
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

    const body = await r.text(); // pass through as-is
    res.status(r.status)
       .setHeader('Content-Type', 'application/json')
       .send(body);
  } catch (err) {
    res.status(500).json({
      error: 'proxy_failed',
      message: err?.message || 'Unknown error'
    });
  }
};
