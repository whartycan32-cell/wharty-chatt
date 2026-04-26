const socket = io();

const myName = localStorage.getItem("name");
let currentChat = "";

if(!myName){
  window.location.href = "login.html";
}

socket.emit("join", myName);

socket.on("userList", (list) => {
  const div = document.getElementById("users");
  div.innerHTML = "";

  list.forEach(u => {
    if(u === myName) return;

    const el = document.createElement("div");
    el.className = "user";
    el.innerText = u;

    el.onclick = () => {
      currentChat = u;
      document.getElementById("chatBox").innerHTML = "";
    };

    div.appendChild(el);
  });
});

socket.on("receiveDM", (msg) => {
  if(msg.from === currentChat || msg.to === currentChat){
    const div = document.createElement("div");
    div.innerText = msg.from + ": " + msg.text;
    document.getElementById("chatBox").appendChild(div);
  }
});

function send(){
  const text = document.getElementById("msg").value;
  if(!text || !currentChat) return;

  socket.emit("sendDM", { to: currentChat, text });
  document.getElementById("msg").value = "";
}
