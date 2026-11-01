/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/api.js";
import "./SuggestedVideo.css";

function SuggestedVideo({ videoId, title, category }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (category) params.set("category", category);

    apiRequest(`/api/videos/suggested/${encodeURIComponent(videoId)}?${params}`, { signal: controller.signal })
      .then((data) => setVideos((data.videos || []).filter((video) => video.videoId !== videoId)))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category, title, videoId]);

  return (
    <section className="suggestion-list">
      <h2>Up next</h2>
      {loading && Array.from({ length: 4 }, (_, index) => <div className="suggestion-skeleton" key={index} />)}
      {!loading && error && <p className="suggestion-message">{error}</p>}
      {!loading && !error && videos.length === 0 && <p className="suggestion-message">No related videos found.</p>}
      {!loading && videos.map((video) => (
        <article className="suggestion-card" key={video.videoId}>
          <Link className="suggestion-thumb" to={`/watch/${encodeURIComponent(video.videoId)}`}>
            <img alt={video.title} loading="lazy" src={video.thumbnail || video.imageIcon} />
          </Link>
          <div className="suggestion-copy">
            <Link className="suggestion-title" to={`/watch/${encodeURIComponent(video.videoId)}`}>{video.title}</Link>
            <span>{video.owner}</span>
            <span>{video.views}{video.time ? ` · ${video.time}` : ""}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export default SuggestedVideo;
