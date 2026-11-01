import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../Model/User.model.js";

function databaseUnavailable(res) {
    return res.status(503).json({ message: "Authentication is temporarily unavailable." });
}

export async function register(req, res) {
    const userName = typeof req.body?.userName === "string" ? req.body.userName.trim() : "";
    const userEmail = typeof req.body?.userEmail === "string" ? req.body.userEmail.trim().toLowerCase() : "";
    const userPassword = typeof req.body?.userPassword === "string" ? req.body.userPassword : "";

    if (userName.length < 2 || userName.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        return res.status(400).json({ message: "Enter a valid name and email address." });
    }
    if (userPassword.length < 8 || userPassword.length > 128) {
        return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);

    try {
        const existingUser = await userModel.findOne({ userEmail });
        if (existingUser) return res.status(409).json({ message: "An account with this email already exists." });

        const user = await userModel.create({
            userName,
            userEmail,
            userPassword: await bcrypt.hash(userPassword, 12)
        });
        return res.status(201).json({ message: "Account created successfully.", user: { Name: user.userName, email: user.userEmail } });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
        if (error.name === "ValidationError") return res.status(400).json({ message: "Please check the account details and try again." });
        return res.status(500).json({ message: "Unable to create the account right now." });
    }
}

export async function login(req, res) {
    const userEmail = typeof req.body?.userEmail === "string" ? req.body.userEmail.trim().toLowerCase() : "";
    const userPassword = typeof req.body?.userPassword === "string" ? req.body.userPassword : "";
    if (!userEmail || !userPassword) return res.status(400).json({ message: "Enter your email and password." });
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: "Authentication is not configured." });

    try {
        const user = await userModel.findOne({ userEmail });
        const passwordMatches = user && await bcrypt.compare(userPassword, user.userPassword);
        if (!passwordMatches) return res.status(401).json({ message: "Email or password is incorrect." });

        const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({
            user: { id: user._id.toString(), Name: user.userName, email: user.userEmail },
            tokenNumber: token
        });
    } catch {
        return res.status(500).json({ message: "Unable to sign in right now." });
    }
}
