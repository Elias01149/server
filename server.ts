import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.PORT) || 8080;

async function startServer() {

    const SERVER_PASSWORD = process.env.SERVER_PASSWORD;

    if (!SERVER_PASSWORD) {
        console.error("SERVER_PASSWORD fehlt!");
        process.exit(1);
    }

    console.log("Server startet...\n");

    const server = http.createServer();

    const wss = new WebSocketServer({
        server
    });

    wss.on("connection", (ws: WebSocket) => {
        console.log("Client connected");

        ws.on("message", (raw) => {
            const buffer = Buffer.isBuffer(raw)
                ? raw
                : Buffer.from(raw as any);

            const data = buffer.toString();

            console.log("Message:", data);

            ws.send("OK");
        });

        ws.on("close", () => {
            console.log("Client disconnected");
        });
    });

    server.listen(PORT, () => {
        console.log(`Server läuft auf Port ${PORT}`);
    });
}

startServer();
