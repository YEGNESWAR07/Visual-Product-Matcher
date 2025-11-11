import React from 'react';

const CATEGORIES = [
  'Clothing',
  'Accessories',
  'Electronics',
  'Furniture',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Beauty',
  'Toys & Games',
  'Automotive',
  'Books',
];

export default function CategoryChips({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = selected && selected.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect?.(c)}
            className={
              `px-3 py-1 rounded-full text-xs font-medium transition ` +
              (active
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200')
            }
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}