import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is a required field"]
        },
        refreshToken: {
            type: String,
            required: [true, "Refresh token is required"]
        },
        ip: {
            type: String,
            required: [true, "IP address is required"]
        },
        userAgent: {
            type: String
        },
        revoked: {
            type: Boolean,
            default: false
        },
        new: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export default Session;