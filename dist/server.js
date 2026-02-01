"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const ws_1 = require("ws");
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
// ---------- PASSWORT BEIM START ----------
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
function askPassword() {
    return new Promise(resolve => {
        rl.question("Server-Passwort eingeben: ", pw => {
            resolve(pw.trim());
        });
    });
}
// ---------- MESSAGE TYPES ----------
const PORT = process.env.PORT || 8080;
// ---------- LIMITS ----------
const MAX_MESSAGE_SIZE = 10_000; // 10 KB
const MESSAGE_COOLDOWN_MS = 50; // Anti-Spam
let sharedCode = "";
let sharedLanguage = "plaintext";
async function startServer() {
    const SERVER_PASSWORD = await askPassword();
    console.log("Server startet...\n");
    const httpsServer = https_1.default.createServer({
        key: fs_1.default.readFileSync("./cert/key.pem"),
        cert: fs_1.default.readFileSync("./cert/cert.pem")
    });
    const wss = new ws_1.WebSocketServer({
        server: httpsServer,
        maxPayload: MAX_MESSAGE_SIZE
    });
    const clients = new Map();
    wss.on("connection", (ws) => {
        clients.set(ws, {
            authenticated: false,
            lastMessageTime: 0
        });
        console.log("Client connected");
        ws.on("message", (raw) => {
            // ---------- SIZE CHECK ----------
            ws.on("message", (raw) => {
                const buffer = Buffer.isBuffer(raw)
                    ? raw
                    : Buffer.from(raw);
                if (buffer.length > MAX_MESSAGE_SIZE) {
                    ws.close();
                    return;
                }
                let data;
                try {
                    data = JSON.parse(buffer.toString());
                }
                catch {
                    return;
                }
                // dein restlicher code hier
            });
            let data;
            try {
                data = JSON.parse(raw.toString());
            }
            catch {
                return;
            }
            const state = clients.get(ws);
            if (!state)
                return;
            // ---------- RATE LIMIT ----------
            const now = Date.now();
            if (now - state.lastMessageTime < MESSAGE_COOLDOWN_MS) {
                return;
            }
            state.lastMessageTime = now;
            // ---------- LOGIN ----------
            if (!state.authenticated) {
                if (data.type !== "login") {
                    ws.close();
                    return;
                }
                if (data.password !== SERVER_PASSWORD) {
                    ws.send(JSON.stringify({ type: "error", message: "Falsches Passwort" }));
                    ws.close();
                    return;
                }
                state.authenticated = true;
                state.username = data.username || "Gast";
                console.log(`LOGIN: ${state.username}`);
                ws.send(JSON.stringify({ type: "system", message: `Willkommen ${state.username}` }));
                // aktuellen Code schicken
                ws.send(JSON.stringify({
                    type: "code",
                    code: sharedCode,
                    language: sharedLanguage
                }));
                return;
            }
            // ---------- AUTH CHECK ----------
            if (!state.authenticated)
                return;
            // ---------- CODE ----------
            if (data.type === "code") {
                if (typeof data.code !== "string")
                    return;
                sharedCode = data.code.slice(0, MAX_MESSAGE_SIZE);
                sharedLanguage = data.language || sharedLanguage;
                const payload = JSON.stringify({
                    type: "code",
                    code: sharedCode,
                    language: sharedLanguage
                });
                for (const [client, cstate] of clients.entries()) {
                    if (cstate.authenticated && client.readyState === 1) {
                        client.send(payload);
                    }
                }
                console.log(`[CODE] Update von ${state.username}`);
                return;
            }
            // ---------- CHAT ----------
            if (data.type === "chat") {
                if (typeof data.message !== "string")
                    return;
                const message = data.message.slice(0, 500);
                const fullMessage = `${state.username}: ${message}`;
                console.log(fullMessage);
                const payload = JSON.stringify({
                    type: "chat",
                    message: fullMessage
                });
                for (const [client, cstate] of clients.entries()) {
                    if (cstate.authenticated && client.readyState === 1) {
                        client.send(payload);
                    }
                }
            }
        });
        ws.on("close", () => {
            console.log(`DISCONNECT: ${clients.get(ws)?.username}`);
            clients.delete(ws);
        });
    });
    httpsServer.listen(PORT, () => {
        console.log("Server läuft");
    });
}
startServer();
