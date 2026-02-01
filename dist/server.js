"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const SERVER_PASSWORD = "affe";
const PORT = Number(process.env.PORT) || 8080;
async function startServer() {
    if (!SERVER_PASSWORD) {
        console.error("SERVER_PASSWORD fehlt!");
        process.exit(1);
    }
    console.log("Server startet...\n");
    const server = http_1.default.createServer();
    const wss = new ws_1.WebSocketServer({
        server
    });
    wss.on("connection", (ws) => {
        console.log("Client connected");
        ws.on("message", (raw) => {
            const buffer = Buffer.isBuffer(raw)
                ? raw
                : Buffer.from(raw);
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
