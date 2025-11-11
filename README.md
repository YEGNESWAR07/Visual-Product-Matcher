# Visual Product Matcher

Find visually similar items by uploading an image or pasting a URL. Results are fetched via a small Express proxy and ranked using MobileNet embeddings with cosine similarity. The proxy protects secrets and resolves page URLs to actual images, avoiding ORB/CORS issues. Category chips let you refine results when detection is ambiguous.

## Setup
- Install dependencies: `npm install`.
- Server `.env` (encrypt before sharing):
  - `UNSPLASH_ACCESS_KEY=...`
  - `API_PASSWORD=...`
- Client `.env`:
  - `REACT_APP_PROXY_URL=http://localhost:5000/api/search`
  - `REACT_APP_API_PASSWORD=...`
- Encrypt server env: `npm run encrypt-env` → creates `.env.enc`. Keep `.env` private.
- Start servers:
  - Proxy: `npm run server`
  - App: `npm start` → open `http://localhost:3000`

## Image URLs and Preview
Image previews use the proxy to prevent browser blocks:
- `GET /api/fetch-image?url=...` for direct image URLs.
- `GET /api/page-image?url=...` to extract `og:image`/first `<img>` from pages.
If resolution fails, a safe Picsum placeholder is shown.

## Brief Write‑Up 
This app combines a secure backend with robust visual search. An Express proxy keeps the Unsplash key server‑side and requires a password, preventing secret leakage. The proxy exposes image‑fetch endpoints that stream bytes with correct headers, so pasted product pages render as previews without ORB/CORS errors. On the client, MobileNet embeddings are computed for the uploaded image and candidate results, and cosine similarity ranks items for better visual relevance than simple labels. Detected labels seed precise Unsplash queries, while category chips let users override ambiguous detection. The UI is minimal and responsive, with a gradient background, safe image fallbacks, and clear status messaging. Secrets are distributed as `.env.enc` via AES‑GCM; the server unlocks with a passphrase at startup. The repository ignores build artifacts and caches to keep history clean.

## Repository
GitHub: https://github.com/YEGNESWAR07/Visual-Product-Matcher
