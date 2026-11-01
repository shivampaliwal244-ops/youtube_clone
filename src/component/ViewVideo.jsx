import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import ShareIcon from "@mui/icons-material/Share";
import Sidebar from "./SideBar.jsx";
import SuggestedVideo from "./SuggestedVideo.jsx";
import CommentSection from "./CommentSection.jsx";
import { apiRequest, formatPublishedDate } from "../utils/api.js";
import "./ViewVideo.css";

function getEmbedUrl(video) {
  if (!video) return "";
  let id = video.source === "youtube" ? video.videoId : "";
  if (!id && video.embed_url) {
    try {
      const url = new URL(video.embed_url);
      if (url.hostname === "youtu.be") id = url.pathname.slice(1);
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
      else id = url.searchParams.get("v") || "";
    } catch {
      return "";
    }
  }
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id || "")) return "";
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
}

function ViewVideo() {
  const { id: videoId } = useParams();
  const { flag: collapsed = false } = useOutletContext() || {};
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playbackError, setPlaybackError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setVideo(null);
    setError("");
    setPlaybackError(false);
    setLiked(false);
    setDisliked(false);
    setSubscribed(false);
    setLoading(true);

    apiRequest(`/api/videos/details/${encodeURIComponent(videoId)}`, { signal: controller.signal })
      .then((data) => setVideo(data.video || null))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [videoId]);

  const embedUrl = useMemo(() => getEmbedUrl(video), [video]);
  const videoDate = formatPublishedDate(video?.publishedAt);

  async function shareVideo() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied");
        window.setTimeout(() => setShareMessage(""), 2200);
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") setShareMessage("Could not share this link");
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className={`watch-page ${collapsed ? "watch-collapsed" : ""}`}>
          <div className="watch-loading-player" />
          <div className="watch-loading-line" />
        </main>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Sidebar />
        <main className={`watch-page ${collapsed ? "watch-collapsed" : ""}`}>
          <div className="watch-error" role="alert">
            <h1>Video unavailable</h1>
            <p>{error || "This video could not be found."}</p>
            <Link to="/">Back to home</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className={`watch-page ${collapsed ? "watch-collapsed" : ""}`}>
        <div className="watch-layout">
          <section className="watch-primary" aria-label="Video player and details">
            <div className="player-frame">
              {!video.embeddable || !embedUrl || playbackError ? (
                <div className="player-unavailable">
                  {video.thumbnail && <img src={video.thumbnail} alt="" />}
                  <div>
                    <h2>Playback is unavailable here</h2>
                    <p>This video may be private, removed, or have embedding disabled.</p>
                    {video.video_url && <a href={video.video_url} target="_blank" rel="noreferrer">Open on YouTube</a>}
                  </div>
                </div>
              ) : (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onError={() => setPlaybackError(true)}
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={embedUrl}
                  title={video.title}
                />
              )}
            </div>

            <h1 className="watch-title">{video.title}</h1>
            <div className="watch-actions-row">
              <div className="watch-channel">
                <span className="watch-channel-avatar"><PersonIcon /></span>
                <div><strong>{video.owner}</strong><span>Channel</span></div>
                <button className={`subscribe-button ${subscribed ? "subscribed" : ""}`} onClick={() => setSubscribed((value) => !value)} type="button">
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>
              <div className="watch-actions">
                <div className="vote-group">
                  <button aria-pressed={liked} className={liked ? "selected" : ""} onClick={() => { setLiked((value) => !value); setDisliked(false); }} type="button"><ThumbUpIcon fontSize="small" /> <span>Like</span></button>
                  <button aria-label="Dislike" aria-pressed={disliked} className={disliked ? "selected" : ""} onClick={() => { setDisliked((value) => !value); setLiked(false); }} type="button"><ThumbDownAltIcon fontSize="small" /></button>
                </div>
                <button className="watch-action-button" onClick={shareVideo} type="button"><ShareIcon fontSize="small" /> Share</button>
                {shareMessage && <span className="share-feedback" role="status">{shareMessage}</span>}
              </div>
            </div>

            <div className="watch-description">
              <div className="watch-description-meta"><strong>{video.views}</strong>{videoDate && <span>{videoDate}</span>}</div>
              <p>{video.description || "No description provided."}</p>
            </div>

            <CommentSection />
          </section>

          <aside className="watch-suggestions" aria-label="Suggested videos">
            <SuggestedVideo videoId={video.videoId} title={video.title} category={video.genre} />
          </aside>
        </div>
      </main>
    </>
  );
}

export default ViewVideo;
