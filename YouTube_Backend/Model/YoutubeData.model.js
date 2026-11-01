import mongoose from "mongoose";
import { Schema } from "mongoose";

const youtubeDataSchema = new Schema({
    imageIcon: { type: String, required: true, trim: true },
    video_url: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    views: { type: String, default: "", trim: true },
    time: { type: String, default: "", trim: true },
    genre: { type: String, default: "All", trim: true }
}, { timestamps: true });

const YoutubeDataModel = mongoose.model("YoutubeData", youtubeDataSchema);

export default YoutubeDataModel;
