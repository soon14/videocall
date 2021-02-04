import { handleMediaOffer, handleMediaAnswer, handleNewICECandidateMsg, invite, handleDisconnect } from "./peerConnection";
import { Message } from "../../interfaces";
import { log, handleError, updateConnectionStatus } from "./debug";

let ws: WebSocket;
const roomId = window.location.pathname.split("/").pop();
export let localUserId: string; // supplied by websocket during connect()

window.onload = () => {
  connect();
};

function connect() {
  ws = new WebSocket(`wss://${location.host}/videocall/socket`);
  ws.onopen = () => {
    updateConnectionStatus(true);

    // If this is the first time we connect, we need a userId.
    // Otherwise, simply reconnect and keep using old userId.
    sendToServer({ type: "register", payload: roomId , source: localUserId}); // localUserId is null on first connect
    // event handlers
    ws.onmessage = (msg) => {
      const data: Message = JSON.parse(msg.data);
      //   if (data.type != "new-ice-candidate") {
      console.log(data);
      //   }

      switch (data.type) {
        case "register":
          handleRegister(data);
          break;
        case "media-offer":
          handleMediaOffer(data);
          break;
        case "media-answer":
          handleMediaAnswer(data);
          break;
        case "new-ice-candidate":
          handleNewICECandidateMsg(data);
          break;
        case "user-joined-room":
          invite(data.source);
          break;
        case "message":
          receiveMsg(data.payload);
          break;
        case "disconnect":
          handleDisconnect(data.source);
          break;
      }
    };
    ws.onclose = (event) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      console.log(event); // usual reason code: 1006
      
      updateConnectionStatus(false);
      // TODO: disable toggle functions when we are not connected!
      // Keep a boolean state for connected?

      // immediately try to reconnect
      connect();
      // setTimeout(connect, 500);
    };
  };
}

export function sendToServer(msg: Message) {
  ws.send(JSON.stringify(msg));
}

function handleRegister(msg: Message) {
  localUserId = msg.payload;
  log("registered as " + localUserId);
}

document.getElementById("disconnect").onclick = () => hangUpCall();

function hangUpCall() {
  sendToServer({
    type: "disconnect",
    source: localUserId,
  });
  window.location.href = "/videocall";
}

const chatInput: HTMLInputElement = (document.getElementById("chat_input") as HTMLInputElement);

document.getElementById("chat_button").onclick = sendMsg;
function sendMsg() {
  log("localuserid: " + localUserId);
  const msg = chatInput.value;
  if (msg.length > 0) {
    sendToServer({
      type: "message",
      payload: msg,
      source: localUserId, // need to do something about adding this to the msg object automatically in sendToServer()
    });
    receiveMsg(msg); // add it to local chat screen as well
    chatInput.value = "";
  }
}

const chatScreen = document.getElementById("chat_screen");
function receiveMsg(msg: string) {
  const par = document.createElement("p");
  par.innerText = msg;
  par.className = "chat_message";
  chatScreen.appendChild(par);
  chatScreen.scrollTop = chatScreen.scrollHeight;
}
