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
const DATA_FILE = "data.json";
const LOG_FILE = "logs.txt";

// YÜKLE
let users = fs.existsSync(USERS_FILE)
  ? JSON.parse(fs.readFileSync(USERS_FILE))
  : {};

let data = fs.existsSync(DATA_FILE)
  ? JSON.parse(fs.readFileSync(DATA_FILE))
  : {};

// KAYDET
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function saveLog(msg) {
  const line = `[${msg.time}] ${msg.from}: ${msg.text}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

io.on("connection", (socket) => {

  // LOGIN
  socket.on("login", ({ username, password }) => {

    if (!username || !password) {
      return socket.emit("loginError", "Boş bırakma");
    }

    if (users[username]) {
      if (users[username] !== password) {
        return socket.emit("loginError", "Şifre yanlış");
      }
    } else {
      users[username] = password;
      saveUsers();

      data[username] = { friends: [], requests: [], messages: {} };
      saveData();
    }

    socket.username = username;

    socket.emit("loginSuccess", {
      username,
      friends: data[username].friends,
      requests: data[username].requests
    });
  });

  // KULLANICI ARAMA
  socket.on("searchUser", (query) => {
    const result = Object.keys(users).filter(u =>
      u.toLowerCase().includes(query.toLowerCase())
    );
    socket.emit("searchResult", result);
  });

  // İSTEK GÖNDER
  socket.on("sendRequest", (toUser) => {
    const from = socket.username;

    if (!data[toUser]) return;

    if (!data[toUser].requests.includes(from)) {
      data[toUser].requests.push(from);
      saveData();
    }

    socket.emit("requestSent");
  });

  // İSTEK KABUL
  socket.on("acceptRequest", (fromUser) => {
    const user = socket.username;

    data[user].friends.push(fromUser);
    data[fromUser].friends.push(user);

    data[user].requests =
      data[user].requests.filter(u => u !== fromUser);

    saveData();

    socket.emit("updateFriends", data[user].friends);
  });

  // DM GÖNDER
  socket.on("sendDM", ({ to, text }) => {
    const from = socket.username;
    const key = [from, to].sort().join("-");

    if (!data[from].messages[key]) data[from].messages[key] = [];
    if (!data[to].messages[key]) data[to].messages[key] = [];

    const msg = {
      from,
      text,
      time: new Date().toLocaleTimeString()
    };

    data[from].messages[key].push(msg);
    data[to].messages[key].push(msg);

    saveData();
    saveLog(msg);

    io.emit("newDM", { key, msg });
  });

  // MESAJ YÜKLE
  socket.on("getDM", (withUser) => {
    const user = socket.username;
    const key = [user, withUser].sort().join("-");

    socket.emit("loadDM", data[user].messages[key] || []);
  });

});

// LOG PANEL
app.get("/admin", (req, res) => {
  if (req.query.key !== "wharty123") return res.send("Yetkisiz");

  const logs = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, "utf-8")
    : "Log yok";

  res.send("<pre>" + logs + "</pre>");
});

server.listen(3000, () => console.log("Çalışıyor..."));