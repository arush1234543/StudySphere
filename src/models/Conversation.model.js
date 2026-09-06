import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },
    title: {
        type: String,
        default: "New Chat"
    }
}, { timestamps: true });

export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);