const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let messages = {};

function log(msg) {
  fs.appendFileSync("chatlog.txt", msg + "\n");
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    socket.username = username;
    users[socket.id] = username;

    io.emit("userList", Object.values(users));
  });

  socket.on("sendDM", ({ to, text }) => {
    const from = socket.username;
    if (!from) return;

    const key = [from, to].sort().join("-");

    if (!messages[key]) messages[key] = [];

    const msg = {
      from,
      to,
      text,
      time: new Date().toLocaleTimeString()
    };

    messages[key].push(msg);

    log(`[${msg.time}] ${from} -> ${to}: ${text}`);

    io.emit("receiveDM", msg);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("userList", Object.values(users));
  });

});

server.listen(3000);
