import {
    getCategoryVideos,
    getData,
    getHomeFeed,
    getPopularVideos,
    getSuggestedVideos,
    getVideoDetails,
    postData,
    searchYouTubeVideos
} from "../Controller/YoutubeData.Controller.js";
import { verifyToken } from "../Middleware/verifyToken.js";

export function routes(app) {
    // YouTube Data API v3 feed, discovery, details, search, and related videos.
    app.get("/api/videos/feed", getHomeFeed);
    app.get("/api/videos/popular", getPopularVideos);
    app.get("/api/videos/category/:category", getCategoryVideos);
    app.get("/api/videos/search", searchYouTubeVideos);
    app.get("/api/videos/details/:id", getVideoDetails);
    app.get("/api/videos/suggested/:id", getSuggestedVideos);

    // Keep the original MongoDB library endpoints available for existing clients.
    app.get("/", getData);
    app.post("/post", verifyToken, postData);
    app.get("/search", searchYouTubeVideos);
}
