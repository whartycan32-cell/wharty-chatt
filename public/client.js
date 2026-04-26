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

      socket.emit("getMessages", u);
    };

    div.appendChild(el);
  });
});

socket.on("loadMessages", (msgs) => {
  const box = document.getElementById("chatBox");
  box.innerHTML = "";

  msgs.forEach(m => {
    const div = document.createElement("div");
    div.innerText = m.from + ": " + m.text;
    box.appendChild(div);
  });
});

socket.on("receiveDM", (msg) => {
  if(msg.from === currentChat || msg.to === currentChat){
    const div = document.createElement("div");
   function addMessage(msg){
  const div = document.createElement("div");

  div.classList.add("msg");

  if(msg.from === myName){
    div.classList.add("me");
  } else {
    div.classList.add("other");
  }

  div.innerHTML = `
    ${msg.text}
    <div class="time">${msg.time || ""}</div>
  `;

  document.getElementById("chatBox").appendChild(div);
}
    document.getElementById("chatBox").appendChild(div);
  }
});

function send(){
  const text = document.getElementById("msg").value;
  if(!text || !currentChat) return;

  socket.emit("sendDM", { to: currentChat, text });
  document.getElementById("msg").value = "";
}
