const socket = io();

let myName = "";

// LOGIN
function startLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  socket.emit("login", { username, password });
}

socket.on("loginError", (msg) => {
  document.getElementById("error").innerText = msg;
});

// BAŞARILI LOGIN
socket.on("loginSuccess", (name) => {
  myName = name;

  document.getElementById("login").style.display = "none";
  document.getElementById("loading").classList.remove("hidden");

  // LOADING ANİMASYON
  let progress = document.getElementById("progress");
  let width = 0;

  let interval = setInterval(() => {
    width += 1;
    progress.style.width = width + "%";

    if (width >= 100) {
      clearInterval(interval);

      document.getElementById("loading").style.display = "none";
      document.getElementById("app").classList.remove("hidden");
    }
  }, 30);
});

// MESAJLAR
socket.on("loadMessages", (msgs) => {
  msgs.forEach(addMessage);
});

socket.on("newMessage", (msg) => {
  addMessage(msg);
});

function send() {
  const text = document.getElementById("msg").value;
  if (!text) return;

  socket.emit("sendMessage", text);
  document.getElementById("msg").value = "";
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("msg");

  if (msg.user === myName) {
    div.classList.add("me");
  } else {
    div.classList.add("other");
  }

  div.innerText = msg.user + ": " + msg.text;

  document.getElementById("chatBox").appendChild(div);
}