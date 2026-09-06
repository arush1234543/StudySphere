import mongoose from "mongoose";

const speechSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    voiceId: {
        type: String,
        required: true
    },
    voiceName: {
        type: String
    },
    audioUrl: {
        type: String
    },
    storageKey: {
        type: String
    }
}, { timestamps: true });

const Speech = mongoose.model("Speech", speechSchema);
export default Speech