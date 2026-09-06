import mongoose from "mongoose";

const memorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    memories: [{
        key: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });

const Memory = mongoose.model("Memory", memorySchema);

export default Memory