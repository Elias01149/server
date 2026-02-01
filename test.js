const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Lokaltest: verbunden, du oaschloch");
  ws.send("create");
  ws.send("join");
  ws.send("sync");
});

ws.on("message", msg => console.log("Lokaltest Server sagt:", msg.toString(), "du oaschloch"));
