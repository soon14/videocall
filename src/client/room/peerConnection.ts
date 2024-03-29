import { log, handleError, Color } from "./debug";
import { Message } from "../../interfaces";
import { sendToServer, localUserId } from "./socketConnection";
import { sendVideo, sendAudio, sendScreen } from "./streams";
import { createRemoteVideoElement, removeVideo } from "./dynamicHTML";
import { MessageType, receiveMsg } from "./chat";

interface PeerConnection {
  [key: string]: RTCPeerConnection;
}

export const peerConnections: PeerConnection = {};

// remoteUserId not supplied in case of creating peer connection as answer to a video offer
export function createPeerConnection(remoteUserId) {
  if (peerConnections[remoteUserId]) {
    return;
  }
  log("Creating PeerConnection with user " + remoteUserId);
  const myPeerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.voys.nl:3478" },
    ],
  });
  // save reference to peer connection
  peerConnections[remoteUserId] = myPeerConnection;

  // first three of these event handlers are required
  myPeerConnection.onicecandidate = (event) =>
    handleICECandidateEvent(event, remoteUserId);
  myPeerConnection.ontrack = (event) => handleTrackEvent(event, remoteUserId);
  // onnegotiationneeded is not called in case of video-answer
  myPeerConnection.onnegotiationneeded = () => {
    handleNegotiationNeededEvent(myPeerConnection, remoteUserId);
  };
  // myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  // myPeerConnection.onsignalingstatechange = () => handleSignalingStateChangeEvent(myPeerConnection);

  sendAudio(myPeerConnection);
  sendVideo(myPeerConnection);
  sendScreen(myPeerConnection);
  return myPeerConnection;
}

/******************** RTCPEERCONNECTION EVENT HANDLERS ***************************/

// called by RTCPeerconnection when a track is added or removed
export function handleNegotiationNeededEvent(myPeerConnection, remoteUserId) {
  log("handlenegotiationneeded");
  myPeerConnection
    .createOffer()
    .then((offer) => {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(() => {
      sendToServer({
        type: "media-offer",
        target: remoteUserId,
        sdp: myPeerConnection.localDescription,
      });
    })
    .catch(handleError);
}

// called by RTCPeerConnection when remote user makes tracks available
export function handleTrackEvent(event, remoteUserId) {
  log("handle track event");
  const element: HTMLVideoElement = document.getElementById(
    remoteUserId
  ) as HTMLVideoElement;

  if (peerConnections[remoteUserId]['inboundStream'] == null) { // == to include undefined
    log("New stream", Color.CYAN);
    const stream = new MediaStream();
    stream.addTrack(event.track);
    peerConnections[remoteUserId]['inboundStream'] = stream;
    element.srcObject = stream;
  }
  else {
    log("Existing stream", Color.CYAN);
    const stream: MediaStream = peerConnections[remoteUserId]['inboundStream'];
    if (event.track.kind === "video") {
      if (stream.getVideoTracks()[0]) {
        stream.getVideoTracks()[0].stop();
        stream.removeTrack(stream.getVideoTracks()[0]);
      }
      stream.addTrack(event.track);
    }
    if (event.track.kind === "audio") {
      if (stream.getAudioTracks()[0]) {
        stream.getAudioTracks()[0].stop();
        stream.removeTrack(stream.getAudioTracks()[0]);
      }
      stream.addTrack(event.track);
    }
  }
  // if (event.streams[0]) {
  //   if (event.streams[0].isActive === false) {
  //     element.srcObject = null;
  //   }
  //   else {
  //     element.srcObject = event.streams[0];
  //   }
  // }

  // if (element.srcObject) {
  //     console.log((element.srcObject as MediaStream).getTracks());
  //     (element.srcObject as MediaStream).addTrack(event.track);
  // } else {
  //     element.srcObject = new MediaStream([event.track]);
  // }
}

// called by RTCPeerConnection when new ICE candidate is found for our network
export function handleICECandidateEvent(event, remoteUserId) {
  if (event.candidate) {
    // let others know of our candidate
    sendToServer({
      type: "new-ice-candidate",
      target: remoteUserId,
      candidate: event.candidate,
    });
  }
}

// event handler for when remote user makes a potential ICE candidate known for his network
export function handleNewICECandidateMsg(msg: Message) {
  if (peerConnections[msg.source]) {
    peerConnections[msg.source]
      .addIceCandidate(new RTCIceCandidate(msg.candidate))
      .catch(handleError);
  }
}

/************** SIGNALLING EVENT HANDLERS ************************/
export function handleGetRoomParticipants(participants: string[]) {
  log("Received participants: " + participants);
  participants.forEach((userId) => createPeerConnection(userId));
}

export function handleMediaOffer(msg: Message) {
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

export function handleMediaAnswer(msg: Message) {
  peerConnections[msg.source].setRemoteDescription(
    new RTCSessionDescription(msg.sdp)
  );
  createRemoteVideoElement(msg.source);

  // Send media tracks if available. This may trigger negotiation again
  // sendAudio(peerConnections[msg.source]);
  // sendVideo(peerConnections[msg.source]);
  // sendScreen(peerConnections[msg.source]);
}
