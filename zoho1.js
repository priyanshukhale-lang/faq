export default async function handler(req, res) {
  // Allow CORS (so your frontend can call this API)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query, token } = req.body;

    if (!query || !token) {
      return res.status(400).json({ error: 'Missing query or token' });
    }

    const zohoRes = await fetch('https://www.zohoapis.in/crm/v7/coql', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ select_query: query })
    });

    const data = await zohoRes.json();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
