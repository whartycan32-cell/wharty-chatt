const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// DOSYALAR
const MSG_FILE = "messages.json";
const LOG_FILE = "logs.txt";

// MESAJLARI YÜKLE
let messages = fs.existsSync(MSG_FILE)
  ? JSON.parse(fs.readFileSync(MSG_FILE))
  : [];

// KAYDET
function saveMessages() {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages, null, 2));
}

// LOG YAZ
function saveLog(msg) {
  const line = `[${msg.time}] ${msg.user}: ${msg.text}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    socket.username = username;

    // eski mesajları gönder
    socket.emit("loadMessages", messages);
  });

  socket.on("sendMessage", (text) => {
    if (!socket.username) return;

    const msg = {
      user: socket.username,
      text,
      time: new Date().toLocaleTimeString()
    };

    // hafızaya ekle
    messages.push(msg);

    // dosyaya kaydet
    saveMessages();

    // log kaydet
    saveLog(msg);

    // herkese gönder
    io.emit("newMessage", msg);
  });

});

server.listen(3000, () => {
  console.log("Çalışıyor...");
});
