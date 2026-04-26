const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

const LOG_FILE = "chatlog.txt";

let messages = [];

function logMessage(msg) {
  const log = `[${msg.time}] ${msg.username}: ${msg.text}\n`;
  fs.appendFileSync(LOG_FILE, log);
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    socket.username = username;

    socket.emit("messageHistory", messages);

    io.emit("systemMessage", `${username} katıldı`);
  });

  socket.on("chatMessage", (text) => {
    if (!socket.username) return;

    const msg = {
      username: socket.username,
      text,
      time: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    messages.push(msg);
    logMessage(msg);

    io.emit("chatMessage", msg);
  });

});

server.listen(PORT, () => {
  console.log("Çalışıyor: http://localhost:" + PORT);
});
