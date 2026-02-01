"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const sqlite3_1 = __importDefault(require("sqlite3"));
const db = new sqlite3_1.default.Database("sessions.db");
const wss = new ws_1.WebSocketServer({ port: 6666 });
wss.on("connection", (ws) => {
    console.log("LAN Client verbunden, du oaschloch");
    ws.on("message", (msg) => {
        console.log("LAN Eingang:", msg.toString(), "du oaschloch");
        // Antwort emulieren
        if (msg.toString() === "create")
            ws.send("session_created:local");
        if (msg.toString() === "join")
            ws.send("session_joined:local");
        if (msg.toString() === "sync")
            ws.send("sync_ok");
        // Broadcast an alle Clients
        wss.clients.forEach(c => {
            if (c.readyState === 1)
                c.send("player_update:" + msg.toString());
        });
    });
});
console.log("LAN Server läuft auf Port 6666, du oaschloch");
