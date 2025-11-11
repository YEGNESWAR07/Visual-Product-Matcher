import React, { useState } from 'react';

export default function ProductList({ results }) {
  const [minScore, setMinScore] = useState(0);

  const filtered = results
    .filter((r) => typeof r.score === 'number' && r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-700">Min similarity: {minScore.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-48 accent-indigo-600"
        />
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-gray-600">No products meet the selected similarity threshold.</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, idx) => {
          const product = item.product || null;
          const rawImageUrl = product?.imageUrl || item.imageUrl;
          const name = product?.name || item.title || 'Item';
          const category = product?.category || item.category || '';
          const id = product?.id || item.id || idx;
          const score = item.score;
          const isBadUnsplashRandom = rawImageUrl && rawImageUrl.includes('source.unsplash.com/random');
          const safeImageUrl = isBadUnsplashRandom
            ? `https://picsum.photos/seed/${encodeURIComponent(name)}-${id}/600/400`
            : (rawImageUrl || `https://picsum.photos/seed/${id}/600/400`);
          return (
          <div
            key={id}
            className="bg-white rounded-xl shadow-sm border overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <img
              src={safeImageUrl}
              alt={name}
              loading="lazy"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = `https://picsum.photos/seed/${id}/600/400`;
              }}
              className="w-full h-52 object-cover"
            />
            <div className="p-4">
              <p className="font-medium text-gray-900">{name}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">{category}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{score.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}