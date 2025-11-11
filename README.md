# 🎨 Visual Product Matcher  

Find visually similar items by uploading an image or pasting a URL. Results are ranked using **MobileNet embeddings + cosine similarity** for robust visual relevance.  

An **Express proxy** protects secrets and resolves page URLs to actual images, avoiding ORB/CORS issues. Category chips let you refine results when detection is ambiguous.  

---

## 🚀 Features
- 🔍 **Image-based search**: Upload or paste a URL to find visually similar products  
- 🛡️ **Secure backend**: Express proxy hides API keys and prevents CORS issues  
- 📊 **Smart ranking**: MobileNet embeddings + cosine similarity for accurate matches  
- 🎛️ **Category refinement**: Chips to override ambiguous detections  
- 📱 **Responsive UI**: Minimal, gradient background, safe fallbacks, clear status messaging  

---

## ⚙️ Setup  

### 1. Install dependencies  
```bash
npm install
```

### 2. Configure environment variables  
**Server `.env` (encrypt before sharing):**
```env
UNSPLASH_ACCESS_KEY=...
API_PASSWORD=...
```

**Client `.env`:**
```env
REACT_APP_PROXY_URL=http://localhost:5000/api/search
REACT_APP_API_PASSWORD=...
```

Encrypt server env:  
```bash
npm run encrypt-env
```
→ creates `.env.enc`. Keep `.env` private.  

### 3. Start servers  
```bash
# Proxy
npm run server

# Client
npm start
```
Open: [http://localhost:3000](http://localhost:3000)  

---

## 🖼️ Image URLs and Preview
Image previews use the proxy to prevent browser blocks:  
- `GET /api/fetch-image?url=...` → direct image URLs  
- `GET /api/page-image?url=...` → extract `og:image` / first `<img>` from pages  

If resolution fails, a safe **Picsum placeholder** is shown.  

---

## 📝 Brief Write‑Up  
This app combines a secure backend with robust visual search.  
- **Backend:** Express proxy keeps the Unsplash key server‑side and requires a password, preventing secret leakage.  
- **Endpoints:** Stream image bytes with correct headers so pasted product pages render previews without ORB/CORS errors.  
- **Client:** MobileNet embeddings are computed for uploaded + candidate images, cosine similarity ranks items for better relevance.  
- **UI:** Minimal, responsive, gradient background, safe fallbacks, clear status messaging.  
- **Security:** Secrets distributed as `.env.enc` via AES‑GCM; server unlocks with a passphrase at startup.  


## 📦 Repository
GitHub: [Visual Product Matcher](https://github.com/YEGNESWAR07/Visual-Product-Matcher)  

---



## 📜 License
This project is licensed under the MIT License.  

---

✨ With these additions (features list, screenshots section, contributing, license), your README will look **professional and attractive** to recruiters and reviewers.  

Would you like me to also **draft a sample screenshot section** (with placeholder Markdown image embeds) so you can just drop in your app screenshots later?
