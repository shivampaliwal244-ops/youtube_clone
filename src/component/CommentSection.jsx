import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, authHeaders, formatPublishedDate } from "../utils/api.js";
import "./CommentSection.css";

function CommentSection() {
  const { id: videoId } = useParams();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(`/api/comments?Video_id_Num=${encodeURIComponent(videoId)}`, { signal: controller.signal })
      .then((data) => setComments(Array.isArray(data.comments) ? data.comments : []))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [videoId]);

  async function addComment(event) {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await apiRequest("/api/comments", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content, Video_id_Num: videoId }),
      });
      setComments((current) => [data.comment, ...current]);
      setContent("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id) {
    if (!editContent.trim()) return;
    try {
      const data = await apiRequest(`/api/comments/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ content: editContent }),
      });
      setComments((current) => current.map((comment) => comment._id === id ? data.comment : comment));
      setEditingId(null);
      setEditContent("");
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteComment(id) {
    try {
      await apiRequest(`/api/comments/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
      setComments((current) => current.filter((comment) => comment._id !== id));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="comments-panel" aria-label="Comments">
      <h2>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</h2>
      {token ? (
        <form className="comment-form" onSubmit={addComment}>
          <textarea aria-label="Write a comment" maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder="Add a comment…" rows={2} value={content} />
          <button disabled={submitting || !content.trim()} type="submit">{submitting ? "Posting…" : "Comment"}</button>
        </form>
      ) : (
        <p className="comment-signin">Please <Link to="/SignIn">sign in</Link> to leave a comment.</p>
      )}

      {error && <p className="comment-error" role="alert">{error}</p>}
      {loading ? <p className="comment-status">Loading comments…</p> : comments.length === 0 ? <p className="comment-status">No comments yet. Start the conversation.</p> : (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment._id}>
              <span className="comment-avatar" aria-hidden="true">{(comment.username || "A").charAt(0).toUpperCase()}</span>
              <div className="comment-body">
                <div className="comment-meta"><strong>{comment.username || "Anonymous"}</strong><span>{formatPublishedDate(comment.createdAt)}</span></div>
                {editingId === comment._id ? (
                  <div className="comment-edit">
                    <textarea aria-label="Edit comment" maxLength={2000} onChange={(event) => setEditContent(event.target.value)} rows={3} value={editContent} />
                    <div><button type="button" onClick={() => saveEdit(comment._id)}>Save</button><button className="secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button></div>
                  </div>
                ) : <p>{comment.content}</p>}
                {comment.userId && comment.userId === userId && editingId !== comment._id && (
                  <div className="comment-actions">
                    <button type="button" onClick={() => { setEditingId(comment._id); setEditContent(comment.content); }}>Edit</button>
                    <button type="button" onClick={() => deleteComment(comment._id)}>Delete</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CommentSection;
