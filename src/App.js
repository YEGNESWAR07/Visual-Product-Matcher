import React, { useState, useMemo } from 'react';
import ImageUpload from './components/ImageUpload';
import ProductList from './components/ProductList';
import LoadingSpinner from './components/LoadingSpinner';
import CategoryChips from './components/CategoryChips';
import productsData from './data/products.json';
import { computeSimilarities } from './utils/similarity';
import { fetchImagesForQuery } from './utils/images';

export default function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const products = useMemo(() => productsData ?? [], []);

  const handleImageSelected = async (imageSrc) => {
    setError('');
    setUploadedImage(imageSrc);
    setLoading(true);
    try {
      // First, detect category and get labels
      const { category, labels } = await computeSimilarities(imageSrc, products);
      const cat = category || selectedCategory || '';
      setDetectedCategory(cat);
      setSelectedCategory(cat);

      // Build a precise query from top labels (e.g., 'basketball', 'sneaker')
      const query = (labels && labels.length > 0)
        ? labels.slice(0, 3).join(' ')
        : (cat || 'Electronics');

      // Fetch live images using the query (or fallback if no proxy/password)
      const items = await fetchImagesForQuery(query);

      // Compute similarities against fetched items
      const { results: matches } = await computeSimilarities(imageSrc, items);
      setResults(matches);
    } catch (e) {
      setError('Failed to compute similarities.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (cat) => {
    setSelectedCategory(cat);
    if (!uploadedImage) return;
    setLoading(true);
    setError('');
    try {
      const items = await fetchImagesForQuery(cat);
      const { results: matches } = await computeSimilarities(uploadedImage, items);
      setResults(matches);
      setDetectedCategory(cat);
    } catch (e) {
      setError('Failed to update results for selected category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-4">
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Visual Product Matcher</h1>
          <p className="mt-2 text-sm text-gray-700">Upload an image or paste a URL to find category-matched products.</p>
        </header>
        <ImageUpload onSelect={handleImageSelected} loading={loading} />
        {loading && (
          <div className="mt-6">
            <LoadingSpinner />
          </div>
        )}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {results.length > 0 && !loading && (
          <div className="mt-6">
            {detectedCategory && (
              <div className="mb-3">
                <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-medium">Detected category: {detectedCategory}</span>
              </div>
            )}
            <div className="mb-4">
              <CategoryChips selected={selectedCategory} onSelect={handleCategorySelect} />
            </div>
            <ProductList results={results} />
          </div>
        )}
      </div>
    </div>
  );
}