import axios from "axios";
import mongoose from "mongoose";
import YoutubeDataModel from "../Model/YoutubeData.model.js";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL_MS = 2 * 60 * 1000;
const responseCache = new Map();
const CATEGORY_IDS = {
    music: "10",
    gaming: "20",
    technology: "28",
    news: "25",
    sports: "17",
    entertainment: "24"
};
const SUPPORTED_CATEGORIES = new Set(["all", "programming", ...Object.keys(CATEGORY_IDS)]);

class ApiError extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

function cached(key, loader) {
    const now = Date.now();
    const entry = responseCache.get(key);
    if (entry && entry.expiresAt > now) return entry.value;

    const value = Promise.resolve().then(loader).catch((error) => {
        responseCache.delete(key);
        throw error;
    });
    responseCache.set(key, { value, expiresAt: now + CACHE_TTL_MS });

    if (responseCache.size > 250) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
    }

    return value;
}

async function youtubeRequest(resource, params) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new ApiError(503, "YouTube Data API is not configured.", "API_KEY_MISSING");
    }

    const response = await axios.get(`${YOUTUBE_API_URL}/${resource}`, {
        params: { ...params, key: apiKey },
        timeout: 12000
    });
    return response.data;
}

function formatCount(value) {
    if (value === undefined || value === null || value === "") return "Views unavailable";
    return `${Number(value).toLocaleString()} views`;
}

function formatAge(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days < 1) return "Today";
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    }
    if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} month${months === 1 ? "" : "s"} ago`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
}

function normalizeYoutubeVideo(item) {
    const videoId = item.id?.videoId || item.id;
    const snippet = item.snippet || {};
    const thumbnail = snippet.thumbnails?.maxres?.url
        || snippet.thumbnails?.standard?.url
        || snippet.thumbnails?.high?.url
        || snippet.thumbnails?.medium?.url
        || snippet.thumbnails?.default?.url
        || "";

    return {
        videoId,
        source: "youtube",
        title: snippet.title || "Untitled video",
        description: snippet.description || "",
        owner: snippet.channelTitle || "Unknown channel",
        channelId: snippet.channelId || "",
        thumbnail,
        imageIcon: thumbnail,
        views: formatCount(item.statistics?.viewCount),
        viewCount: item.statistics?.viewCount || "0",
        time: formatAge(snippet.publishedAt),
        publishedAt: snippet.publishedAt || null,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        embed_url: `https://www.youtube.com/embed/${videoId}`,
        embeddable: item.status?.embeddable !== false
    };
}

function extractYoutubeId(value) {
    if (!value) return "";
    try {
        const url = new URL(value);
        if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
            return url.pathname.split("/").filter(Boolean)[0] || "";
        }
        if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || "";
        return url.searchParams.get("v") || "";
    } catch {
        return "";
    }
}

function normalizeLibraryVideo(video) {
    const mongoId = video._id.toString();
    const youtubeVideoId = extractYoutubeId(video.video_url);
    return {
        videoId: `mongo_${mongoId}`,
        source: "library",
        title: video.description,
        description: video.description,
        owner: video.owner,
        thumbnail: video.imageIcon,
        imageIcon: video.imageIcon,
        views: video.views || "Views unavailable",
        time: video.time || "",
        genre: video.genre || "All",
        video_url: video.video_url,
        embed_url: youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : video.video_url,
        youtubeVideoId,
        embeddable: true,
        _id: mongoId
    };
}

async function getLibraryVideos() {
    if (mongoose.connection.readyState !== 1) return [];
    const documents = await YoutubeDataModel.find().sort({ _id: -1 }).limit(24).lean();
    return documents.map(normalizeLibraryVideo);
}

async function searchVideos({ query, pageToken, category, maxResults = 12 }) {
    const trimmedQuery = String(query || "").trim().slice(0, 120);
    const categoryKey = String(category || "all").toLowerCase();
    const categoryId = CATEGORY_IDS[categoryKey];
    const effectiveQuery = categoryKey === "programming"
        ? ["programming", trimmedQuery].filter(Boolean).join(" ")
        : trimmedQuery;
    const cacheKey = JSON.stringify(["search", effectiveQuery, categoryId, pageToken || "", maxResults]);

    return cached(cacheKey, async () => {
        const data = await youtubeRequest("search", {
            part: "snippet",
            type: "video",
            q: effectiveQuery,
            videoCategoryId: categoryId,
            maxResults,
            pageToken: pageToken || undefined,
            safeSearch: "moderate"
        });

        const searchItems = (data.items || []).filter((item) => item.id?.videoId);
        const ids = searchItems.map((item) => item.id.videoId);
        const details = ids.length
            ? await youtubeRequest("videos", {
                part: "snippet,statistics,status",
                id: ids.join(",")
            })
            : { items: [] };
        const detailById = new Map((details.items || []).map((item) => [item.id, item]));
        const videos = searchItems.map((item) => normalizeYoutubeVideo(
            detailById.get(item.id.videoId) || item
        ));

        return { videos, nextPageToken: data.nextPageToken || null };
    });
}

async function popularVideos({ category = "all", pageToken, maxResults = 12 }) {
    const categoryKey = String(category).toLowerCase();
    const cacheKey = JSON.stringify(["popular", categoryKey, pageToken || "", maxResults]);

    return cached(cacheKey, async () => {
        if (categoryKey === "programming") {
            return searchVideos({ query: "programming", category: "technology", pageToken, maxResults });
        }

        const data = await youtubeRequest("videos", {
            part: "snippet,statistics,status",
            chart: "mostPopular",
            regionCode: process.env.YOUTUBE_REGION_CODE || "US",
            videoCategoryId: CATEGORY_IDS[categoryKey],
            maxResults,
            pageToken: pageToken || undefined
        });

        return {
            videos: (data.items || []).map(normalizeYoutubeVideo),
            nextPageToken: data.nextPageToken || null
        };
    });
}

function sendApiError(res, error) {
    if (error instanceof ApiError) {
        return res.status(error.status).json({
            message: error.message,
            code: error.code,
            videos: []
        });
    }

    const reason = error.response?.data?.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        return res.status(429).json({
            message: "YouTube API quota has been reached. Please try again later.",
            code: "QUOTA_EXCEEDED",
            videos: []
        });
    }
    if (reason === "accessNotConfigured") {
        return res.status(503).json({
            message: "YouTube Data API v3 is not enabled for this Google Cloud project.",
            code: "API_NOT_ENABLED",
            videos: []
        });
    }

    console.error("YouTube API request failed", {
        status: error.response?.status || null,
        reason: reason || "upstream_error"
    });
    return res.status(error.code === "ECONNABORTED" ? 504 : 502).json({
        message: "Unable to load videos from YouTube right now.",
        code: error.code === "ECONNABORTED" ? "YOUTUBE_TIMEOUT" : "YOUTUBE_ERROR",
        videos: []
    });
}

function parsePagination(req, res) {
    const requested = Number.parseInt(req.query.maxResults, 10);
    if (req.query.maxResults !== undefined && (!Number.isFinite(requested) || requested < 1)) {
        res.status(400).json({ message: "maxResults must be a positive number.", code: "INVALID_PAGE_SIZE" });
        return null;
    }
    const maxResults = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 24) : 12;
    const pageToken = typeof req.query.pageToken === "string" ? req.query.pageToken : "";
    if (pageToken.length > 500) {
        res.status(400).json({ message: "Invalid page token.", code: "INVALID_PAGE_TOKEN" });
        return null;
    }
    return { maxResults, pageToken };
}

export async function getData(req, res) {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Video library is unavailable until MongoDB connects.", videos: [] });
        }
        const videos = await YoutubeDataModel.find().sort({ _id: -1 }).lean();
        return res.status(200).json({ message: videos.length ? "Videos fetched successfully" : "No videos found", videos });
    } catch {
        return res.status(503).json({ message: "Unable to read the video library.", videos: [] });
    }
}

export async function postData(req, res) {
    const { imageIcon, video_url, description, owner, views = "", time = "", genre = "All" } = req.body || {};
    if (![imageIcon, video_url, description, owner].every((value) => typeof value === "string" && value.trim())) {
        return res.status(400).json({ message: "Thumbnail, video URL, title, and channel name are required." });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Video library is unavailable until MongoDB connects." });
    }

    try {
        const video = await YoutubeDataModel.create({
            imageIcon: imageIcon.trim(),
            video_url: video_url.trim(),
            description: description.trim(),
            owner: owner.trim(),
            views: String(views).slice(0, 80),
            time: String(time).slice(0, 80),
            genre: String(genre).slice(0, 60)
        });
        return res.status(201).json({ message: "Video uploaded successfully", video });
    } catch (error) {
        if (error.name === "ValidationError") return res.status(400).json({ message: "The video record is invalid." });
        return res.status(500).json({ message: "Unable to save the video." });
    }
}

export async function getHomeFeed(req, res) {
    const pagination = parsePagination(req, res);
    if (!pagination) return;
    const category = String(req.params.category || req.query.category || "all").slice(0, 40);
    if (!SUPPORTED_CATEGORIES.has(category.toLowerCase())) {
        return res.status(400).json({ message: "Choose a supported video category.", code: "INVALID_CATEGORY", videos: [] });
    }

    try {
        const result = await popularVideos({ category, ...pagination });
        const libraryVideos = !pagination.pageToken && category.toLowerCase() === "all"
            ? await getLibraryVideos()
            : [];
        const seen = new Set(result.videos.map((video) => video.videoId));
        return res.status(200).json({
            message: "Videos fetched successfully",
            videos: [...libraryVideos.filter((video) => !seen.has(video.videoId)), ...result.videos],
            nextPageToken: result.nextPageToken
        });
    } catch (error) {
        try {
            const libraryVideos = !pagination.pageToken ? await getLibraryVideos() : [];
            if (libraryVideos.length) {
                return res.status(200).json({
                    message: "Showing saved videos while YouTube is unavailable.",
                    warning: error instanceof ApiError ? error.message : "YouTube feed is temporarily unavailable.",
                    videos: libraryVideos,
                    nextPageToken: null
                });
            }
        } catch {
            // Return the original YouTube error below.
        }
        return sendApiError(res, error);
    }
}

export async function searchYouTubeVideos(req, res) {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) return res.status(400).json({ message: "Enter a search term to find videos.", code: "EMPTY_QUERY", videos: [] });
    const pagination = parsePagination(req, res);
    if (!pagination) return;
    const category = String(req.query.category || "all").toLowerCase();
    if (!SUPPORTED_CATEGORIES.has(category)) {
        return res.status(400).json({ message: "Choose a supported video category.", code: "INVALID_CATEGORY", videos: [] });
    }

    try {
        const result = await searchVideos({
            query,
            category,
            ...pagination
        });
        return res.status(200).json({ message: "Search results loaded.", ...result });
    } catch (error) {
        return sendApiError(res, error);
    }
}

export async function getPopularVideos(req, res) {
    return getHomeFeed(req, res);
}

export async function getCategoryVideos(req, res) {
    return getHomeFeed(req, res);
}

export async function getVideoDetails(req, res) {
    const id = String(req.params.id || "");

    try {
        if (id.startsWith("mongo_")) {
            const mongoId = id.slice(6);
            if (!mongoose.isValidObjectId(mongoId)) return res.status(400).json({ message: "Invalid video ID." });
            if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Video library is unavailable until MongoDB connects." });
            const document = await YoutubeDataModel.findById(mongoId).lean();
            if (!document) return res.status(404).json({ message: "This saved video could not be found." });
            return res.status(200).json({ video: normalizeLibraryVideo(document) });
        }

        if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return res.status(400).json({ message: "Invalid YouTube video ID." });
        const video = await cached(`details:${id}`, async () => {
            const data = await youtubeRequest("videos", { part: "snippet,statistics,status,contentDetails", id });
            if (!data.items?.length) throw new ApiError(404, "This video is unavailable, private, or has been removed.", "VIDEO_UNAVAILABLE");
            return normalizeYoutubeVideo(data.items[0]);
        });
        return res.status(200).json({ video });
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            return res.status(404).json({ message: error.message, code: error.code });
        }
        return sendApiError(res, error);
    }
}

export async function getSuggestedVideos(req, res) {
    const currentId = String(req.params.id || "");
    const query = typeof req.query.title === "string" ? req.query.title.trim().slice(0, 120) : "";
    const category = typeof req.query.category === "string" ? req.query.category.slice(0, 40) : "";
    const searchQuery = query || category || "popular videos";
    try {
        const result = await searchVideos({ query: searchQuery, maxResults: 16 });
        const videos = result.videos.filter((video) => video.videoId !== currentId).slice(0, 12);
        return res.status(200).json({ message: "Suggested videos loaded.", videos });
    } catch (error) {
        return sendApiError(res, error);
    }
}
