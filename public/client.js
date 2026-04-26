const socket = io();

function join() {
  const name = document.getElementById("username").value.trim();

  if (!name) return;

  socket.emit("join", name);

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("chatApp").classList.remove("hidden");
}

socket.on("messageHistory", (msgs) => {
  msgs.forEach(addMsg);
});

socket.on("chatMessage", addMsg);

socket.on("systemMessage", (text) => {
  const div = document.createElement("div");
  div.innerText = text;
  document.getElementById("messages").appendChild(div);
});

function send() {
  const msg = document.getElementById("msg").value;
  socket.emit("chatMessage", msg);
  document.getElementById("msg").value = "";
}

function addMsg(m) {
  const div = document.createElement("div");
  div.innerText = `${m.username}: ${m.text} (${m.time})`;
  document.getElementById("messages").appendChild(div);
}