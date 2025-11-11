import React, { useState } from 'react';

function looksLikeImageUrl(u) {
  try {
    const url = new URL(u);
    const ext = (url.pathname.split('.').pop() || '').toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);
  } catch {
    return false;
  }
}

function getApiBase() {
  const proxy = process.env.REACT_APP_PROXY_URL || 'http://localhost:5000/api/search';
  // Normalize to http://host:port/api
  let base = proxy.replace(/\/?search$/, '');
  base = base.replace(/\/$/, '');
  return base;
}

export default function ImageUpload({ onSelect, loading }) {
  const [url, setUrl] = useState('');
  const [localPreview, setLocalPreview] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      setLocalPreview(src);
      if (onSelect) onSelect(src);
    };
    reader.readAsDataURL(file);
  };

  const onUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    const password = process.env.REACT_APP_API_PASSWORD || '';
    const apiBase = getApiBase();
    try {
      let blobUrl = null;
      if (looksLikeImageUrl(url)) {
        const res = await fetch(`${apiBase}/fetch-image?url=${encodeURIComponent(url)}`, {
          headers: password ? { 'X-API-PASSWORD': password } : {},
        });
        if (res.ok) {
          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
        }
      } else {
        const res = await fetch(`${apiBase}/page-image?url=${encodeURIComponent(url)}`, {
          headers: password ? { 'X-API-PASSWORD': password } : {},
        });
        if (res.ok) {
          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
        }
      }
      if (blobUrl) {
        setLocalPreview(blobUrl);
        if (onSelect) onSelect(blobUrl);
      } else {
        // Fallback: just show placeholder and notify selection
        const placeholder = `https://picsum.photos/seed/${encodeURIComponent(url)}/600/400`;
        setLocalPreview(placeholder);
        if (onSelect) onSelect(placeholder);
      }
    } catch (err) {
      const placeholder = `https://picsum.photos/seed/${encodeURIComponent(url)}/600/400`;
      setLocalPreview(placeholder);
      if (onSelect) onSelect(placeholder);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur p-5 rounded-xl shadow-sm border">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload an image</label>
          <div className="mt-2">
            <label className="inline-flex items-center justify-center px-4 py-2 rounded-md cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow hover:from-indigo-500 hover:to-purple-500 transition">
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                disabled={loading}
                className="hidden"
              />
              Choose File
            </label>
          </div>
        </div>
        <form onSubmit={onUrlSubmit}>
          <label className="block text-sm font-medium text-gray-700">Paste image URL</label>
          <div className="mt-2 flex">
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-l-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="rounded-r-md px-4 font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition"
            >
              Use
            </button>
          </div>
        </form>
      </div>
      {localPreview && (
        <div className="mt-4">
          <img src={localPreview} alt="Preview" referrerPolicy="no-referrer" className="max-h-64 rounded-md border shadow" />
        </div>
      )}
    </div>
  );
}