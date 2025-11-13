// Simple password-protected proxy for Unsplash requests with encrypted .env support
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { loadEncryptedEnv } = require('./secureEnv');

// Load env: prefer .env.enc, otherwise fall back to .env
async function initEnv() {
  const encPath = path.resolve(__dirname, '.env.enc');
  const hasEncrypted = fs.existsSync(encPath);
  if (hasEncrypted) {
    const existing = process.env.ENV_PASSPHRASE || '';
    let passphrase = existing;
    if (!passphrase) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      passphrase = await new Promise((resolve) => rl.question('Enter passphrase to unlock .env.enc: ', (ans) => {
        rl.close();
        resolve(ans);
      }));
    }
    const ok = loadEncryptedEnv(encPath, passphrase);
    if (!ok) {
      console.error('Failed to load .env.enc — check file or passphrase.');
      process.exit(1);
    }
  } else {
    require('dotenv').config();
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const API_PASSWORD = () => process.env.API_PASSWORD || '';
const UNSPLASH_ACCESS_KEY = () => process.env.UNSPLASH_ACCESS_KEY || '';

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: !!UNSPLASH_ACCESS_KEY() });
});

// Helper: validate URL
function isHttpUrl(u) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Map a free-text query to one of our known categories
function mapQueryToCategory(q) {
  const L = String(q || '').toLowerCase();
  if (/(shirt|jeans|dress|sneaker|shoe|hoodie|jacket|coat|sock|clothing|apparel)/.test(L)) return 'Clothing';
  if (/(watch|phone|smartphone|laptop|keyboard|mouse|monitor|headphone|camera|speaker|electronics|earbud)/.test(L)) return 'Electronics';
  if (/(sofa|chair|table|desk|bed|lamp|bookshelf|furniture)/.test(L)) return 'Furniture';
  if (/(blender|coffee|microwave|toaster|oven|vacuum|kitchen)/.test(L)) return 'Home & Kitchen';
  if (/(yoga|helmet|bottle|tennis|racket|fitness|ball|sport|outdoor|football|basketball)/.test(L)) return 'Sports & Outdoors';
  if (/(hair|dryer|toothbrush|makeup|serum|cosmetic|beauty)/.test(L)) return 'Beauty';
  if (/(drone|toy|board|puzzle|figure|game)/.test(L)) return 'Toys & Games';
  if (/(car|seat|tire|mount|automotive)/.test(L)) return 'Automotive';
  if (/(book|novel|magazine|paper|books)/.test(L)) return 'Books';
  if (/(bag|backpack|belt|wallet|sunglasses|accessories)/.test(L)) return 'Accessories';
  return '';
}

// Fetch a remote image and return bytes with correct headers to avoid ORB/CORS issues
app.get('/api/fetch-image', async (req, res) => {
  try {
    const provided = req.header('x-api-password') || req.query.password || '';
    const password = API_PASSWORD();
    // Only enforce password when it's actually set
    if (password && provided !== password) {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing password' });
    }
    const url = String(req.query.url || '').trim();
    if (!isHttpUrl(url)) return res.status(400).json({ error: 'Invalid URL' });
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}` });
    const ct = r.headers.get('content-type') || 'application/octet-stream';
    if (!ct.startsWith('image/')) {
      return res.status(415).json({ error: `Unsupported content-type: ${ct}` });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', ct);
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Image fetch error', details: String(err.message || err) });
  }
});

// Resolve a page URL to an image (og:image or first <img>) and return bytes
app.get('/api/page-image', async (req, res) => {
  try {
    const provided = req.header('x-api-password') || req.query.password || '';
    const password = API_PASSWORD();
    // Only enforce password when it's actually set
    if (password && provided !== password) {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing password' });
    }
    const pageUrl = String(req.query.url || '').trim();
    if (!isHttpUrl(pageUrl)) return res.status(400).json({ error: 'Invalid URL' });
    const pr = await fetch(pageUrl, { redirect: 'follow' });
    if (!pr.ok) return res.status(pr.status).json({ error: `Upstream ${pr.status}` });
    const ct = pr.headers.get('content-type') || '';
    if (ct.startsWith('image/')) {
      // Already an image, just proxy through fetch-image
      const buf = Buffer.from(await pr.arrayBuffer());
      res.set('Content-Type', ct);
      res.set('Cache-Control', 'public, max-age=3600');
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).send(buf);
    }
    const html = await pr.text();
    const metaMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const twMatch = html.match(/<meta[^>]+(?:property|name)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const found = (metaMatch && metaMatch[1]) || (twMatch && twMatch[1]) || (imgMatch && imgMatch[1]);
    if (!found) return res.status(404).json({ error: 'No image found on page' });
    const base = new URL(pageUrl);
    const resolved = new URL(found, base).toString();
    const ir = await fetch(resolved, { redirect: 'follow' });
    if (!ir.ok) return res.status(ir.status).json({ error: `Upstream image ${ir.status}` });
    const ict = ir.headers.get('content-type') || 'image/jpeg';
    if (!ict.startsWith('image/')) return res.status(415).json({ error: 'Resolved resource not an image' });
    const buf = Buffer.from(await ir.arrayBuffer());
    res.set('Content-Type', ict);
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Resolve image error', details: String(err.message || err) });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const provided = req.header('x-api-password') || req.query.password || '';
    const password = API_PASSWORD();
    // Only enforce password when it's actually set
    if (password && provided !== password) {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing password' });
    }
    const key = UNSPLASH_ACCESS_KEY();
    if (!key) {
      return res.status(500).json({ error: 'Server missing UNSPLASH_ACCESS_KEY' });
    }

    const query = String(req.query.query || '').trim();
    const perPage = Math.min(parseInt(req.query.per_page || '24', 10), 50);
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish`;
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Unsplash error', details: text });
    }
    const data = await r.json();
    const itemCategory = mapQueryToCategory(query);
    const items = (data.results || []).map((itm) => ({
      id: itm.id,
      title: itm.alt_description || itm.description || query,
      // Align category to the mapped category, not the raw query
      category: itemCategory,
      imageUrl: (itm.urls && (itm.urls.small || itm.urls.thumb || itm.urls.raw)) || '',
    }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: String(err.message || err) });
  }
});

initEnv().then(() => {
  app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
  });
});