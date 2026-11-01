# YouTube Clone

A responsive React and Vite video browsing app backed by an Express API. YouTube Data API v3 credentials stay on the backend. Saved video records, accounts, and comments use MongoDB when it is connected.

## Requirements

- Node.js 20 or newer
- A MongoDB connection string for accounts, comments, and saved video records
- A YouTube Data API v3 key for live YouTube feeds, search, video details, and suggestions

## Configure the backend

Create `YouTube_Backend/.env` from `YouTube_Backend/.env.example` and fill in the values. Keep `.env` private; it is ignored by Git.

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-long-random-secret
YOUTUBE_API_KEY=your-youtube-data-api-v3-key
YOUTUBE_REGION_CODE=US
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

The API server can start without MongoDB or a YouTube key so health and configuration errors can be inspected. Mongo-backed routes return `503` while MongoDB is disconnected. YouTube-backed routes explain when the key is missing or quota is exhausted.

## Start the app

In one terminal:

```powershell
cd YouTube_Backend
npm install
npm run dev
```

In a second terminal from the project root:

```powershell
npm install
npm run dev
```

Open the Vite URL printed by the frontend (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://localhost:5000`. For a separate frontend/backend deployment, set `VITE_API_BASE_URL` for the frontend and `CORS_ORIGINS` for the backend.

Production commands:

```powershell
# Backend, from YouTube_Backend
npm start

# Frontend, from the project root
npm run build
npm run preview
```

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/health` | API status, MongoDB connection state, and whether a YouTube key is configured |
| `GET /api/videos/feed?category=all&pageToken=...` | Most popular feed or category feed |
| `GET /api/videos/popular` | Most popular feed |
| `GET /api/videos/category/:category` | Popular videos for a supported category |
| `GET /api/videos/search?q=...&pageToken=...` | Search real YouTube videos |
| `GET /api/videos/details/:id` | YouTube video details or a saved MongoDB video (`mongo_<id>`) |
| `GET /api/videos/suggested/:id?title=...` | Related search results with the current video excluded |
| `POST /api/auth/register`, `POST /api/auth/login` | Account registration and login |
| `GET /api/comments?Video_id_Num=...` | Comments for a video |
| `POST /api/comments`, `PUT /api/comments/:id`, `DELETE /api/comments/:id` | Authenticated comment operations |

The original `GET /`, `/search`, `/post`, `/register`, `/login`, and comment route aliases remain available for existing clients. `POST /post` stores a saved video record and requires a `Bearer` JWT.

YouTube search consumes more quota than the popular-feed endpoint. Search responses and feed responses are cached briefly to reduce repeat calls. YouTube does not expose its private recommendations algorithm; suggestions use related search results instead.

## Verify locally

```powershell
npm run lint
npm run build
```
