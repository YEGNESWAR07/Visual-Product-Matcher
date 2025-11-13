const DEFAULT_COUNT = 24;

export async function fetchImagesForQuery(query, count = DEFAULT_COUNT) {
  const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:5000/api/search';
  const password = process.env.REACT_APP_API_PASSWORD || '';

  // Always attempt proxy first; include password header only if provided.
  try {
    const headers = password ? { 'X-API-PASSWORD': password } : {};
    const res = await fetch(`${proxyUrl}?query=${encodeURIComponent(query)}&per_page=${count}`, { headers });
    if (res.ok) {
      const data = await res.json();
      const items = (data.items || []).filter((i) => !!i.imageUrl);
      if (items.length) return items;
    }
  } catch (error) {
    console.error('Proxy fetch failed, falling back to Picsum:', error);
  }

  // Fallback: deterministic Picsum when no password/proxy available
  const L = String(query || '').toLowerCase();
  const mapQueryToCategory = () => {
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
  };
  const cat = mapQueryToCategory();
  return Array.from({ length: count }).map((_, i) => ({
    id: `${query}-${i}`,
    title: `${query} item ${i + 1}`,
    category: cat,
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}-${i}/600/400`,
  }));
}