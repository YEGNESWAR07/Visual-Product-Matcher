const DEFAULT_COUNT = 24;

export async function fetchImagesForQuery(query, count = DEFAULT_COUNT) {
  const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:5000/api/search';
  const password = process.env.REACT_APP_API_PASSWORD || '';

  if (password) {
    const res = await fetch(`${proxyUrl}?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: { 'X-API-PASSWORD': password },
    });
    if (res.ok) {
      const data = await res.json();
      const items = (data.items || []).filter((i) => !!i.imageUrl);
      if (items.length) return items;
    }
  }

  // Fallback: deterministic Picsum when no password/proxy available
  return Array.from({ length: count }).map((_, i) => ({
    id: `${query}-${i}`,
    title: `${query} item ${i + 1}`,
    category: '',
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}-${i}/600/400`,
  }));
}