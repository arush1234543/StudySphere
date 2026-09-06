import { WebSocketServer, WebSocket } from "ws";
import { AI } from './src/controller/ai.controller.js'

const wss = new WebSocketServer({ port: 8000 });



wss.on("connection", (socket, request) => {
    const ip = request.socket.remoteAddress;
    console.log("Client Connected:", ip);

    socket.on("message", async rawData => {
        const message = rawData.toString();

        console.log("User:", message);

        try {
            const reply = await AI(message);

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`Server: ${reply}`);
                }
            });
        } catch (error) {
            console.error(error.response?.data || error.message);

            socket.send("AI request failed");
        }
    });

    socket.on("error", err => {
        console.log(err);
    });

    socket.on("close", () => {
        console.log("Client Disconnected");
    });
});

console.log("WebSocket server is live on ws://localhost:8000");