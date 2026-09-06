import axios from "axios";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import Conversation from "../models/Conversation.model.js";
import Message from "../models/Message.model.js";
import Memory from "../models/Memory.model.js";
import Session from "../models/Session.model.js";
import config from "../config/config.js";

const model = new ChatOpenAI({
    model: "openai/gpt-4o-mini",
    apiKey: config.OPENROUTER_API_KEY,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1"
    },
    maxTokens: 500
});

const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are StudySphere AI, an intelligent educational assistant.
Help students understand concepts clearly and accurately.
Give concise but useful answers.
Adapt explanations to the student's level when possible.
Do not invent information.
Use the student's stored memory only when it is relevant.`],
    ["system", "Student's long-term memory:\n{memory}"],
    new MessagesPlaceholder("history"),
    ["human", "{message}"]
]);

const aiChain = prompt.pipe(model);

export async function AI(message) {
    try {
        if (!message?.trim()) {
            throw new Error("Message is required");
        }

        const response = await aiChain.invoke({
            memory: "No stored memory.",
            history: [],
            message: message.trim()
        });

        return response.content;
    } catch (error) {
        console.error("AI Error:", error.message);
        throw new Error("AI response failed");
    }
}

export async function TextToSpeech(req, res) {
    try {
        const { message, voiceId } = req.body;

        if (!message?.trim() || !voiceId) {
            return res.status(400).json({
                success: false,
                message: "Message and voiceId are required"
            });
        }

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: message,
                model_id: "eleven_flash_v2_5"
            },
            {
                headers: {
                    "xi-api-key": config.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                },
                responseType: "arraybuffer"
            }
        );

        const audioBuffer = Buffer.from(response.data);

        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.length
        });

        return res.send(audioBuffer);
    } catch (error) {
        console.error(
            "Text-to-speech error:",
            error.response?.data || error.message
        );

        return res.status(error.response?.status || 500).json({
            success: false,
            message: "Text-to-speech failed"
        });
    }
}

export async function getVoices(req, res) {
    try {
        const response = await axios.get(
            "https://api.elevenlabs.io/v1/voices",
            {
                headers: {
                    "xi-api-key": config.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const voices = response.data.voices.map(voice => ({
            name: voice.name,
            id: voice.voice_id,
            description: voice.description,
            labels: voice.labels
        }));

        return res.status(200).json({
            success: true,
            voices
        });
    } catch (error) {
        console.error(
            "Get Voices Error:",
            error.response?.data || error.message
        );

        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.detail || error.message
        });
    }
}
