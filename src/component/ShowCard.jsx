/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import { formatPublishedDate } from "../utils/api.js";
import "./ShowCard.css";

function ShowCard({ video }) {
  const videoId = video.videoId || video._id;
  const title = video.title || video.description || "Untitled video";
  const thumbnail = video.thumbnail || video.imageIcon;
  const published = video.time || formatPublishedDate(video.publishedAt);

  if (!videoId) return null;

  return (
    <article className="video-card">
      <Link aria-label={`Watch ${title}`} className="video-thumbnail-link" to={`/watch/${encodeURIComponent(videoId)}`}>
        <img
          alt={title}
          className="video-thumbnail"
          loading="lazy"
          src={thumbnail || "https://placehold.co/640x360/181818/aaa?text=Video"}
        />
        {video.source === "library" && <span className="video-source">Library</span>}
      </Link>
      <div className="video-card-info">
        <div className="channel-avatar" aria-hidden="true"><PersonIcon fontSize="small" /></div>
        <div className="video-card-copy">
          <Link className="video-title" title={title} to={`/watch/${encodeURIComponent(videoId)}`}>{title}</Link>
          <span className="video-channel">{video.owner || "Unknown channel"}</span>
          <div className="video-metadata">
            <span>{video.views || "Views unavailable"}</span>
            {published && <><span className="metadata-dot">·</span><span>{published}</span></>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ShowCard;
