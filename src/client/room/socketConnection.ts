import { handleNewICECandidateMsg, createPeerConnection, peerConnections } from "./peerConnection";
import { Message } from "../../interfaces";
import { Color, handleError, log, updateConnectionStatus } from "./debug";
import { receiveMsg } from "./chat";
import { createRemoteVideoElement, removeVideo } from "./dynamicHTML";

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
    sendToServer({ type: "register", payload: roomId });
    // event handlers
    ws.onmessage = (msg) => {
      const data: Message = JSON.parse(msg.data);
      if (data.type != "new-ice-candidate") {
        log("Received: " + data.type, Color.GREEN);
      }

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
          handleUserJoinedRoom(data.source);
          break;
        case "message":
          receiveMsg(data.payload);
          break;
        case "disconnect":
          handleDisconnect(data.source);
          break;
        case "getRoomParticipants":
          handleGetRoomParticipants(data.payload);
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

/************** SIGNALLING EVENT HANDLERS ************************/
function handleGetRoomParticipants(participants: string[]) {
  log("Received participants: " + participants);
  participants.forEach((userId) => createPeerConnection(userId));
}

function handleUserJoinedRoom(remoteUserId: string) {
  createPeerConnection(remoteUserId);
  receiveMsg("User " + remoteUserId.substring(0, 7) + " joined the room!");
}

function handleMediaOffer(msg: Message) {
  let myPeerConnection = peerConnections[msg.source];
  if (myPeerConnection == null) {
    log("Creating peer connection after receiving media offer");
    myPeerConnection = createPeerConnection(msg.source);
  }
  console.log(msg.sdp);
  myPeerConnection
    .setRemoteDescription(new RTCSessionDescription(msg.sdp))
    .then(() => {
      return myPeerConnection.createAnswer();
    })
    .then((answer) => {
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(() => {
      sendToServer({
        type: "media-answer",
        target: msg.source,
        sdp: myPeerConnection.localDescription,
      });
    })
    // TODO: revert this catch block once you've figured out why the sdp error occurs
    .catch((error) => {
      log(msg.sdp.sdp); // Failed to set remote video description send parameters for m-section with mid='0'});
      handleError(error);
    });
  createRemoteVideoElement(msg.source);
}

function handleMediaAnswer(msg: Message) {
  peerConnections[msg.source].setRemoteDescription(
    new RTCSessionDescription(msg.sdp)
  );
  createRemoteVideoElement(msg.source);

  // Send media tracks if available. This may trigger negotiation again
  // sendAudio(peerConnections[msg.source]);
  // sendVideo(peerConnections[msg.source]);
  // sendScreen(peerConnections[msg.source]);
}

/**
 * Remove peer connection and video element after a remote user has disconnected from the room.
 */
function handleDisconnect(source: string) {
  log("User " + source + " left the room");
  receiveMsg("User " + source.substring(0, 7) + " has left the room!");
  removeVideo(source);
  if (peerConnections[source]) {
    peerConnections[source].close();
    delete peerConnections[source];
  }
}

function handleRegister(msg: Message) {
  localUserId = msg.payload;
  log("Registered as " + localUserId, Color.GREEN);
  sendToServer({ type: "getRoomParticipants" });
}

export function sendToServer(msg: Message) {
  if (msg.type !== 'new-ice-candidate' && msg.type !== 'message' && msg.type !== 'register') {
    log("Sending " + msg.type, Color.GREEN);
  }
  ws.send(JSON.stringify({
    ...msg,
    source: localUserId,
  }));
}


document.getElementById("disconnect").onclick = () => {
  sendToServer({
    type: "disconnect",
  });
  window.location.href = "/videocall";
}
