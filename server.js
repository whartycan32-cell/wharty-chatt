const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let messages = fs.existsSync("messages.json")
  ? JSON.parse(fs.readFileSync("messages.json"))
  : {};

function saveMessages() {
  fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    socket.username = username;
    users[socket.id] = username;

    io.emit("userList", Object.values(users));
  });

  socket.on("getMessages", (withUser) => {
    const key = [socket.username, withUser].sort().join("-");
    socket.emit("loadMessages", messages[key] || []);
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
    saveMessages();

    io.emit("receiveDM", msg);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("userList", Object.values(users));
  });

});

server.listen(3000);
