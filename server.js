const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let messages = [];

io.on("connection", (socket) => {

  socket.on("register", ({ username, password }) => {
    if (!username || !password)
      return socket.emit("registerError", "Boş bırakma");

    if (users[username])
      return socket.emit("registerError", "Bu kullanıcı var");

    users[username] = password;
    socket.emit("registerSuccess");
  });

  socket.on("login", ({ username, password }) => {
    if (!users[username])
      return socket.emit("loginError", "Kullanıcı yok");

    if (users[username] !== password)
      return socket.emit("loginError", "Şifre yanlış");

    socket.username = username;

    socket.emit("loginSuccess", { username });
    socket.emit("loadMessages", messages);
  });

  socket.on("sendMessage", (text) => {
    if (!socket.username) return;

    const msg = { user: socket.username, text };
    messages.push(msg);

    io.emit("newMessage", msg);
  });

});

server.listen(3000, () => console.log("Server çalışıyor"));
