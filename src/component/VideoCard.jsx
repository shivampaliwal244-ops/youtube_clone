import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useOutletContext, useSearchParams } from "react-router-dom";
import ShowCard from "./ShowCard.jsx";
import CategoryWiseFilter from "./CategoryWiseFilter.jsx";
import { apiRequest } from "../utils/api.js";
import { genres } from "../utils/genrecollection.js";
import "./VideoCard.css";

function VideoCard() {
  const location = useLocation();
  const { flag: collapsed = false } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const isSearch = location.pathname === "/search";
  const query = (searchParams.get("q") || "").trim();
  const [selectedCategory, setSelectedCategory] = useState(genres[0]);
  const [videos, setVideos] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const loadMoreController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setVideos([]);
    setNextPageToken(null);
    setError("");
    setLoadingMore(false);

    if (isSearch && !query) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (isSearch) {
      params.set("q", query);
      if (selectedCategory !== "All") params.set("category", selectedCategory.toLowerCase());
    } else {
      params.set("category", selectedCategory.toLowerCase());
    }

    apiRequest(`${isSearch ? "/api/videos/search" : "/api/videos/feed"}?${params}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setVideos(Array.isArray(data.videos) ? data.videos : []);
        setNextPageToken(data.nextPageToken || null);
        setError(data.warning || "");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      loadMoreController.current?.abort();
    };
  }, [isSearch, query, selectedCategory, retryKey]);

  const loadMore = useCallback(async () => {
    if (!nextPageToken || loadingMore) return;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ pageToken: nextPageToken });
      if (isSearch) {
        params.set("q", query);
        if (selectedCategory !== "All") params.set("category", selectedCategory.toLowerCase());
      } else {
        params.set("category", selectedCategory.toLowerCase());
      }
      const data = await apiRequest(`${isSearch ? "/api/videos/search" : "/api/videos/feed"}?${params}`, { signal: controller.signal });
      setVideos((current) => {
        const existing = new Set(current.map((video) => video.videoId));
        return [...current, ...(data.videos || []).filter((video) => !existing.has(video.videoId))];
      });
      setNextPageToken(data.nextPageToken || null);
      setError("");
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message);
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [isSearch, loadingMore, nextPageToken, query, selectedCategory]);

  const marginClass = collapsed ? "feed-collapsed" : "feed-expanded";

  return (
    <main className={`feed-main ${marginClass}`}>
      <div className="feed-toolbar">
        <CategoryWiseFilter selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      <section aria-busy={loading} aria-label={isSearch ? "Search results" : "Video feed"}>
        <div className="feed-heading">
          <h1>{isSearch ? (query ? `Results for “${query}”` : "Search videos") : selectedCategory === "All" ? "Recommended" : selectedCategory}</h1>
          {!loading && videos.length > 0 && <span>{videos.length} videos</span>}
        </div>

        {error && <div className="feed-notice" role="status">{error}</div>}

        {loading ? (
          <div className="video-grid" aria-label="Loading videos">
            {Array.from({ length: 12 }, (_, index) => <div className="video-skeleton" key={index} />)}
          </div>
        ) : videos.length > 0 ? (
          <>
            <div className="video-grid">
              {videos.map((video) => <ShowCard key={video.videoId || video._id} video={video} />)}
            </div>
            {nextPageToken && (
              <div className="load-more-wrap">
                <button className="load-more-button" disabled={loadingMore} onClick={loadMore} type="button">
                  {loadingMore ? "Loading…" : "Load more videos"}
                </button>
              </div>
            )}
          </>
        ) : error ? (
          <div className="feed-empty">
            <p>Videos could not be loaded.</p>
            <button className="load-more-button" onClick={() => setRetryKey((value) => value + 1)} type="button">Try again</button>
          </div>
        ) : (
          <div className="feed-empty" role="status">
            <p>{isSearch && !query ? "Enter a search term above to find videos." : "No videos found for this selection."}</p>
            {isSearch && !query && <span>Search by title, channel, or topic.</span>}
          </div>
        )}
      </section>
    </main>
  );
}

export default VideoCard;
