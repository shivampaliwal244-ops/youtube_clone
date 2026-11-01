import { addComment, deleteComment, editComment, getComment } from "../Controller/comment.controller.js";
import { verifyToken } from "../Middleware/verifyToken.js";

export function commentRoutes(app) {
    app.get("/api/comments", getComment);
    app.post("/api/comments", verifyToken, addComment);
    app.delete("/api/comments/:id", verifyToken, deleteComment);
    app.put("/api/comments/:id", verifyToken, editComment);

    // Preserve the original comment URLs while enforcing the same authentication.
    app.post("/add", verifyToken, addComment);
    app.get("/getComments", getComment);
    app.delete("/delete/:id", verifyToken, deleteComment);
    app.put("/edit/:id", verifyToken, editComment);
}
