import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../Model/User.model.js";

export async function verifyToken(req, res, next) {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");
    const secret = process.env.JWT_SECRET;

    if (!secret) return res.status(503).json({ message: "Authentication is not configured." });
    if (!token || !["Bearer", "JWT"].includes(scheme)) {
        return res.status(401).json({ message: "Please sign in to continue." });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Authentication is temporarily unavailable." });
    }

    try {
        const payload = jwt.verify(token, secret);
        const user = await userModel.findById(payload.id).select("userName userEmail");
        if (!user) return res.status(401).json({ message: "Your session is no longer valid. Please sign in again." });
        req.user = {
            id: user._id.toString(),
            name: user.userName,
            email: user.userEmail
        };
        return next();
    } catch {
        return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
    }
}
