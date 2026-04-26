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

let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : {};
let messages = fs.existsSync(MSG_FILE) ? JSON.parse(fs.readFileSync(MSG_FILE)) : [];
let onlineUsers = {};

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveMessages() {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}

function saveLog(msg) {
  fs.appendFileSync(LOG_FILE, `[${msg.time}] ${msg.user}: ${msg.text}\n`);
}

io.on("connection", (socket) => {
  socket.on("register", ({ username, password }) => {
    username = String(username || "").trim();
    password = String(password || "").trim();

    if (!username || !password) return socket.emit("registerError", "Kullanıcı adı ve şifre boş olamaz.");
    if (users[username]) return socket.emit("registerError", "Bu kullanıcı adı zaten kayıtlı.");

    users[username] = { password };
    saveUsers();

    socket.emit("registerSuccess");
  });

  socket.on("login", ({ username, password }) => {
    username = String(username || "").trim();
    password = String(password || "").trim();

    if (!users[username]) return socket.emit("loginError", "Böyle bir kullanıcı yok.");
    if (users[username].password !== password) return socket.emit("loginError", "Şifre yanlış.");

    socket.username = username;
    onlineUsers[socket.id] = username;

    socket.emit("loginSuccess", { username });
    socket.emit("loadMessages", messages);
    io.emit("onlineUsers", Object.values(onlineUsers));
  });

  socket.on("sendMessage", (text) => {
    if (!socket.username) return;

    text = String(text || "").trim();
    if (!text) return;

    const msg = {
      user: socket.username,
      text,
      time: new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    messages.push(msg);
    saveMessages();
    saveLog(msg);

    io.emit("newMessage", msg);
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("onlineUsers", Object.values(onlineUsers));
  });
});

app.get("/admin", (req, res) => {
  if (req.query.key !== "wharty123") return res.send("Yetkisiz.");

  const logs = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf-8") : "Log yok.";

  res.send(`
    <body style="background:#0b0f14;color:#d7ffd7;font-family:monospace;padding:20px;">
      <h2>Wharty Log Panel</h2>
      <pre>${logs}</pre>
    </body>
  `);
});

server.listen(3000, () => {
  console.log("Wharty Chat çalışıyor.");
});
