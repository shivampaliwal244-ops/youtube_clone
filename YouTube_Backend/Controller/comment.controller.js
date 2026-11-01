import mongoose from "mongoose";
import commentModel from "../Model/Comment.model.js";

function databaseUnavailable(res) {
    return res.status(503).json({ message: "Comments are temporarily unavailable." });
}

export async function addComment(req, res) {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const videoId = typeof req.body?.Video_id_Num === "string" ? req.body.Video_id_Num.trim() : "";
    if (!content || content.length > 2000 || !videoId || videoId.length > 100) {
        return res.status(400).json({ message: "Enter a comment between 1 and 2,000 characters." });
    }
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

    try {
        const comment = await commentModel.create({
            content,
            username: req.user.name,
            userId: req.user.id,
            Video_id_Num: videoId
        });
        return res.status(201).json({ message: "Comment added.", comment });
    } catch {
        return res.status(500).json({ message: "Unable to add this comment right now." });
    }
}

export async function getComment(req, res) {
    const videoId = typeof req.query.Video_id_Num === "string" ? req.query.Video_id_Num.trim() : "";
    if (!videoId) return res.status(400).json({ message: "Video_id_Num is required.", comments: [] });
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

    try {
        const comments = await commentModel.find({ Video_id_Num: videoId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ comments });
    } catch {
        return res.status(503).json({ message: "Unable to load comments right now.", comments: [] });
    }
}

export async function deleteComment(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID." });
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

    try {
        const comment = await commentModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!comment) return res.status(404).json({ message: "Comment not found or you cannot delete it." });
        return res.status(200).json({ message: "Comment deleted." });
    } catch {
        return res.status(500).json({ message: "Unable to delete this comment right now." });
    }
}

export async function editComment(req, res) {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 2000) return res.status(400).json({ message: "Enter a comment between 1 and 2,000 characters." });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID." });
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

    try {
        const comment = await commentModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { content },
            { new: true, runValidators: true }
        );
        if (!comment) return res.status(404).json({ message: "Comment not found or you cannot edit it." });
        return res.status(200).json({ comment });
    } catch {
        return res.status(500).json({ message: "Unable to update this comment right now." });
    }
}
