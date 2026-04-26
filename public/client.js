const socket = io();

const myName = localStorage.getItem("name");

if(!myName){
  window.location.href = "login.html";
}

socket.emit("join", myName);

socket.on("loadMessages", (msgs) => {
  msgs.forEach(addMessage);
});

socket.on("newMessage", (msg) => {
  addMessage(msg);
});

function send(){
  const text = document.getElementById("msg").value;
  if(!text) return;

  socket.emit("sendMessage", text);
  document.getElementById("msg").value = "";
}

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
