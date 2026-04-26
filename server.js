const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let data = {};
let online = {};

io.on("connection", (socket) => {

  // REGISTER
  socket.on("register", ({ username, password }) => {
    if (!username || !password)
      return socket.emit("registerError", "Boş bırakma");

    if (users[username])
      return socket.emit("registerError", "Zaten var");

    users[username] = password;

    data[username] = {
      friends: [],
      requests: [],
      messages: {},
      avatar: ""
    };

    socket.emit("registerSuccess");
  });

  // LOGIN
  socket.on("login", ({ username, password }) => {
    if (!users[username])
      return socket.emit("loginError", "Kullanıcı yok");

    if (users[username] !== password)
      return socket.emit("loginError", "Şifre yanlış");

    socket.username = username;
    online[username] = true;

    io.emit("onlineList", Object.keys(online));

    socket.emit("loginSuccess", {
      username,
      friends: data[username].friends,
      requests: data[username].requests,
      avatar: data[username].avatar
    });
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete online[socket.username];
      io.emit("onlineList", Object.keys(online));
    }
  });

  // AVATAR
  socket.on("setAvatar", (url) => {
    data[socket.username].avatar = url;
  });

  // SEARCH
  socket.on("searchUser", (q) => {
    const result = Object.keys(users).filter(u =>
      u.toLowerCase().includes(q.toLowerCase())
    );
    socket.emit("searchResult", result);
  });

  // FRIEND REQUEST
  socket.on("sendRequest", (to) => {
    const from = socket.username;

    if (!data[to]) return;

    if (!data[to].requests.includes(from)) {
      data[to].requests.push(from);
    }

    socket.emit("notify", "İstek gönderildi ✔");
  });

  // ACCEPT
  socket.on("acceptRequest", (from) => {
    const user = socket.username;

    data[user].friends.push(from);
    data[from].friends.push(user);

    data[user].requests =
      data[user].requests.filter(u => u !== from);

    socket.emit("updateFriends", data[user].friends);
  });

  // DM
  socket.on("sendDM", ({ to, text }) => {
    const from = socket.username;
    const key = [from, to].sort().join("-");

    if (!data[from].messages[key]) data[from].messages[key] = [];
    if (!data[to].messages[key]) data[to].messages[key] = [];

    const msg = {
      from,
      text,
      seen: false,
      time: new Date().toLocaleTimeString()
    };

    data[from].messages[key].push(msg);
    data[to].messages[key].push(msg);

    io.emit("newDM", { key, msg });
  });

  socket.on("getDM", (u) => {
    const key = [socket.username, u].sort().join("-");
    socket.emit("loadDM", data[socket.username].messages[key] || []);
  });

  socket.on("seen", (u) => {
    const key = [socket.username, u].sort().join("-");
    const msgs = data[socket.username].messages[key] || [];

    msgs.forEach(m => m.seen = true);

    io.emit("seenUpdate", key);
  });

  socket.on("typing", (to) => {
    io.emit("typing", { from: socket.username, to });
  });

});

server.listen(3000, () => console.log("Çalışıyor..."));
