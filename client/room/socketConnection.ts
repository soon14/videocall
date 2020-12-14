import { handleMediaOffer, handleMediaAnswer, handleNewICECandidateMsg, invite, handleDisconnect } from "./peerConnection";
import { Message } from "../../interfaces";
import { log, handleError } from "./debug";

let ws: WebSocket;
const roomId = window.location.pathname.split("/").pop();
export let localUserId: string; // supplied by websocket during connect()

window.onload = () => {
  connect();
};

function connect() {
  ws = new WebSocket(`wss://${location.host}/videocall/socket`);
  ws.onopen = () => {
    log("connected");

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
        case "disconnect":
          handleDisconnect(data.source);
          break;
      }
    };
    ws.onclose = (event) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      console.log(event); // usual reason code: 1006
      
      log("reconnecting...");
      // TODO: disable toggle functions when we are not connected!
      // Keep a boolean state for connected?
      setTimeout(connect, 500);
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
