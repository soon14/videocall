import { sendToServer } from "./socketConnection";

const chatInput: HTMLTextAreaElement = (document.getElementById("chat_input") as HTMLTextAreaElement);
const chatButton = document.getElementById("chat_button");
const chatScreen = document.getElementById("chat_screen");
const hideButton = document.getElementById("hide_chat");
const chatContainer = document.getElementById("chat");

chatButton.onclick = sendMsg;

chatButton.onmousedown = (event) => {
  event.preventDefault(); // keep focus on input
};

function sendMsg() {
  const msg = chatInput.value;
  if (msg.length > 0) {
    sendToServer({
      type: "message",
      payload: msg,
    });
    receiveMsg(msg); // add it to local chat screen as well
    chatInput.value = "";
  }
}

export function receiveMsg(msg: string) {
  chatContainer.classList.remove('hidden');
  // create element for new msg and append it
  const par = document.createElement("p");
  par.innerText = msg;
  par.className = "chat_message";
  chatScreen.appendChild(par);
  // scroll to see the new message
  chatScreen.scrollTop = chatScreen.scrollHeight;
}

hideButton.onclick = (event) => {
  event.stopPropagation();
  chatContainer.classList.add('hidden');
}

chatInput.addEventListener('keydown', (event) => {
  if (event.code === 'Enter') {
    sendMsg();
  }
})
