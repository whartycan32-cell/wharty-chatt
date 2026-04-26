const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// DOSYALAR
const USERS_FILE = "users.json";
const MSG_FILE = "messages.json";
const LOG_FILE = "logs.txt";

// VERİLERİ YÜKLE
let users = fs.existsSync(USERS_FILE)
  ? JSON.parse(fs.readFileSync(USERS_FILE))
  : {};

let messages = fs.existsSync(MSG_FILE)
  ? JSON.parse(fs.readFileSync(MSG_FILE))
  : [];

// KAYDETME
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

// SOCKET
io.on("connection", (socket) => {

  // KAYIT
  socket.on("register", ({ username, password }) => {
    if (!username || !password) {
      return socket.emit("registerError", "Boş bırakma");
    }

    if (users[username]) {
      return socket.emit("registerError", "Bu kullanıcı var");
    }

    users[username] = password;
    saveUsers();

    socket.emit("registerSuccess");
  });

  // GİRİŞ
  socket.on("login", ({ username, password }) => {
    if (!username || !password) {
      return socket.emit("loginError", "Boş bırakma");
    }

    if (!users[username]) {
      return socket.emit("loginError", "Kullanıcı yok");
    }

    if (users[username] !== password) {
      return socket.emit("loginError", "Şifre yanlış");
    }

    socket.username = username;

    socket.emit("loginSuccess", { username });
    socket.emit("loadMessages", messages);
  });

  // MESAJ GÖNDER
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

// LOG PANEL (opsiyonel)
app.get("/admin", (req, res) => {
  if (req.query.key !== "wharty123") return res.send("Yetkisiz");

  const logs = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, "utf-8")
    : "Log yok";

  res.send("<pre>" + logs + "</pre>");
});

// SERVER
server.listen(3000, () => {
  console.log("Server çalışıyor...");
});