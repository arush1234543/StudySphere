import axios from "axios";
import config from "../config/config.js";

export async function checkPrompt(req, res, next) {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "Message is required"
        });
    }

    next();
}

export async function checkIfAppropriate(req, res, next) {
    try {
        const { message } = req.body;

        const moderationResponse = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a content moderation assistant. Check if the following text is safe, age-appropriate, and educational. If it contains sexual, pornographic, exploitative, or otherwise inappropriate content, respond with exactly 'inappropriate'. Otherwise, respond with exactly 'appropriate'."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0
            },
            {
                headers: {
                    Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const moderationResult = moderationResponse.data.choices[0].message.content.trim().toLowerCase();

        if (moderationResult === "inappropriate") {
            return res.status(400).json({
                success: false,
                message: "The provided text is inappropriate and cannot be converted to speech."
            });
        }

        next();
    } catch (error) {
        console.error("Moderation Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Content moderation failed"
        });
    }
}