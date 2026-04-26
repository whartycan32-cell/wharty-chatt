const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";
const LOG_FILE = "logs.txt";

// kullanıcılar
let users = fs.existsSync(USERS_FILE)
  ? JSON.parse(fs.readFileSync(USERS_FILE))
  : {};

// mesajlar
let messages = fs.existsSync(MSG_FILE)
  ? JSON.parse(fs.readFileSync(MSG_FILE))
  : [];

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveMessages() {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}

function saveLog(msg) {
  const line = `[${msg.time}] ${msg.user}: ${msg.text}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

io.on("connection", (socket) => {

  socket.on("login", ({ username, password }) => {

    if (!username || !password) {
      socket.emit("loginError", "Boş bırakma");
      return;
    }

    if (users[username]) {
      if (users[username] !== password) {
        socket.emit("loginError", "Şifre yanlış");
        return;
      }
    } else {
      users[username] = password;
      saveUsers();
    }

    socket.username = username;

    socket.emit("loginSuccess", username);
    socket.emit("loadMessages", messages);
  });

  socket.on("sendMessage", (text) => {
    if (!socket.username) return;

    const msg = {
      user: socket.username,
      text,
      time: new Date().toLocaleTimeString()
    };

    messages.push(msg);
    saveMessages();
    saveLog(msg);

    io.emit("newMessage", msg);
  });

});

server.listen(3000);