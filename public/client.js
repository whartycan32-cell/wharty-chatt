const socket = io();

// otomatik isim (2 kişi için yeterli)
let myName = "User_" + Math.floor(Math.random() * 1000);

// loading animasyonu (3 saniye)
let progress = document.getElementById("progress");
let width = 0;

let interval = setInterval(() => {
  width += 1;
  progress.style.width = width + "%";

  if (width >= 100) {
    clearInterval(interval);

    document.getElementById("loading").style.display = "none";
    document.getElementById("app").classList.remove("hidden");

    socket.emit("join", myName);
  }
}, 30);

// eski mesajlar
socket.on("loadMessages", (msgs) => {
  msgs.forEach(addMessage);
});

// yeni mesaj
socket.on("newMessage", (msg) => {
  addMessage(msg);
});

// gönder
function send(){
  const text = document.getElementById("msg").value;
  if(!text) return;

  socket.emit("sendMessage", text);
  document.getElementById("msg").value = "";
}

// mesaj ekleme
function addMessage(msg){
  const div = document.createElement("div");
  div.classList.add("msg");

  if(msg.user === myName){
    div.classList.add("me");
  } else {
    div.classList.add("other");
  }

  div.innerHTML = `
    ${msg.text}
    <div class="time">${msg.time}</div>
  `;

  document.getElementById("chatBox").appendChild(div);
}
