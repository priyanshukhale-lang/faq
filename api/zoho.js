export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query, token } = req.body;

    const zohoRes = await fetch('https://www.zohoapis.in/crm/v7/coql', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ select_query: query })
    });

    const text = await zohoRes.text();

    return res.status(zohoRes.status).send(text);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
