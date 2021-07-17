import { setIconEnabled } from "./icons";
import { sendToServer } from "./socketConnection";

export enum MessageType {
  SYSTEM = 'system',
  RECIPIENT = 'recipient',
  OWN = 'own',
};

const messageColor = {
  [MessageType.SYSTEM]: '#FFFFFF',
  [MessageType.RECIPIENT]: '#fff200',
  [MessageType.OWN]: '#00e5ff',
};

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
    receiveMsg(msg, MessageType.OWN); // add it to local chat screen as well
    chatInput.value = "";
    setIconEnabled(chatButton, false);
  }
}

chatInput.oninput = () => {
  setIconEnabled(chatButton, chatInput.value.length > 0);
};

chatInput.onfocus = () => {
  chatInput.style.backgroundColor = '#000000';
  chatButton.style.backgroundColor = '#000000';
};

chatInput.onblur = () => {
  chatInput.style.backgroundColor = 'transparent';
  chatButton.style.backgroundColor = 'transparent';
};

export function receiveMsg(msg: string, type: MessageType) {
  chatContainer.classList.remove('hidden');
  // create element for new msg and append it
  const par = document.createElement("p");
  par.innerText = msg;
  par.className = "chat_message";
  par.style.color = messageColor[type];
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
