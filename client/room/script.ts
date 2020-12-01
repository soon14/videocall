import { Message } from "../../interfaces";

interface PeerConnection {
  [key: string]: RTCPeerConnection;
}

// TODO: encapsulate everything

// local state
const peerConnections: PeerConnection = {};
let localUserId; // supplied by websocket during connect()
let roomId = window.location.pathname.split("/").pop();

let audioStream; // initialized after navigator.mediaDevices.getUserMedia
let videoStream; // initialized after video toggle button is pressed
let localStream = new MediaStream();
let localScreenStream; // initialized after user clicks the button

let isVideoOn: boolean = false;
let isAudioOn: boolean = false;
let isScreenSharing: boolean = false;

let ws: WebSocket; // initialized during connect()

const localVideoElement: HTMLVideoElement = document.getElementById(
  "local_video"
) as HTMLVideoElement;

// request audio from user (do not connect to server if audio permission is not given)
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    audioStream = stream;
    isAudioOn = true;
    connect();
  })
  .catch(handleError);

// called after user has agreed to share video and audio
function connect() {
  ws = new WebSocket(`wss://${location.host}/videocall/socket`);
  ws.onopen = () => {
    console.log("connected");
    // let server know our roomId. The server will respond with a userId we can use.
    sendToServer({ type: "register", payload: roomId });

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
  };
}

// remoteUserId not supplied in case of creating peer connection as answer to a video offer
function createPeerConnection(remoteUserId) {
  const myPeerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.voys.nl:3478" },
    ], //{urls: "stun:stun.stunprotocol.org"}
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
  myPeerConnection.oniceconnectionstatechange = (
    event: RTCPeerConnectionIceEvent
  ) => {
    handleICEConnectionStateChangeEvent(event, remoteUserId);
  };
  // myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
  // myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  return myPeerConnection;
}

/******************** RTCPEERCONNECTION EVENT HANDLERS ***************************/

function handleICEConnectionStateChangeEvent(event, remoteUserId) {
  console.log("connection state change");
  if (
    event.target.iceConnectionState === "failed" ||
    event.target.iceConnectionState === "disconnected"
  ) {
    console.log("remote client %d disconnected", remoteUserId);
    handleDisconnect(remoteUserId);
  }
  console.log(event);
}

// called by browser when it is ready to connect to peer, creates video-offer
function handleNegotiationNeededEvent(myPeerConnection, remoteUserId) {
  console.log("handleNegotiationNeededEvent");
  myPeerConnection
    .createOffer()
    .then((offer) => {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(() => {
      sendToServer({
        type: "media-offer",
        source: localUserId,
        target: remoteUserId,
        sdp: myPeerConnection.localDescription,
      });
    })
    .catch(handleError);
}

// called by RTCPeerConnection when remote user makes tracks available
function handleTrackEvent(event, remoteUserId) {
  console.log("handleTrack");
  console.log(event);
  const element: HTMLVideoElement = document.getElementById(
    remoteUserId
  ) as HTMLVideoElement;
  element.srcObject = event.streams[0];
  // if (element.srcObject) {
  //     console.log((element.srcObject as MediaStream).getTracks());
  //     (element.srcObject as MediaStream).addTrack(event.track);
  // } else {
  //     element.srcObject = new MediaStream([event.track]);
  // }
}

// called by RTCPeerConnection when new ICE candidate is found for our network
function handleICECandidateEvent(event, remoteUserId) {
  if (event.candidate) {
    // let others know of our candidate
    sendToServer({
      type: "new-ice-candidate",
      source: localUserId,
      target: remoteUserId,
      candidate: event.candidate,
    });
  }
}

// event handler for when remote user makes a potential ICE candidate known for his network
function handleNewICECandidateMsg(msg: Message) {
  if (peerConnections[msg.source]) {
    peerConnections[msg.source]
      .addIceCandidate(new RTCIceCandidate(msg.candidate))
      .catch(handleError);
  }
}

/************** SIGNALLING EVENT HANDLERS ************************/
function invite(remoteUserId) {
  // TODO: check if specific connection already exists (using remoteUserId)
  const myPeerConnection = createPeerConnection(remoteUserId);
  if (isAudioOn) {
    sendAudio(myPeerConnection);
  }
  if (isVideoOn) {
    sendVideo(myPeerConnection);
  }
}

function handleMediaOffer(msg: Message) {
  console.log("handle media offer");

  let myPeerConnection = peerConnections[msg.source];
  if (myPeerConnection == null) {
    myPeerConnection = createPeerConnection(msg.source);
  }
  myPeerConnection
    .setRemoteDescription(new RTCSessionDescription(msg.sdp))
    .then(() => {
      if (isAudioOn) {
        sendAudio(myPeerConnection);
      }
      if (isVideoOn) {
        sendVideo(myPeerConnection);
      }
    })
    .then(() => {
      return myPeerConnection.createAnswer();
    })
    .then((answer) => {
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(() => {
      sendToServer({
        type: "media-answer",
        source: localUserId,
        target: msg.source,
        sdp: myPeerConnection.localDescription,
      });
    })
    .catch(handleError);
  createRemoteVideoElement(msg.source);
}

function handleMediaAnswer(msg: Message) {
  peerConnections[msg.source].setRemoteDescription(
    new RTCSessionDescription(msg.sdp)
  );
  createRemoteVideoElement(msg.source);
}

/************* TOGGLE VIDEO *****************/
function sendVideo(myPeerConnection) {
  // request the video stream, but be careful not to replace an existing screen capture stream.
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoStream = stream;
      localVideoElement.srcObject = stream;

      // do not replace screen capture
      if (!isScreenSharing) {
        const videoTrack = stream.getVideoTracks()[0];
        if (myPeerConnection["videoSender"]) {
          // if RTCRtpSender object already exists, replace the track
          console.log("replace track");
          myPeerConnection["videoSender"].replaceTrack(videoTrack);
        } else {
          myPeerConnection["videoSender"] = myPeerConnection.addTrack(
            videoTrack,
            localStream
          );
        }
      }
    })
    .catch(handleError);
}

function muteVideo(myPeerConnection) {
  if (myPeerConnection["videoSender"]) {
    myPeerConnection.removeTrack(myPeerConnection["videoSender"]);
    myPeerConnection["videoSender"] = null;
  }
}

const videoButton = document.getElementById("toggle_video");
videoButton.onclick = () => {
  if (isVideoOn) {
    console.log("turning off video...");
    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteVideo(myPeerConnection)
    );
    isVideoOn = false;
    videoButton.innerText = "video [off]";
  } else {
    if (!isScreenSharing) {
      console.log("turning on video...");
      if (Object.keys(peerConnections).length === 0) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            videoStream = stream;
            localVideoElement.srcObject = stream;
          })
          .catch(handleError);
      } else {
        Object.values(peerConnections).forEach((myPeerConnection) =>
          sendVideo(myPeerConnection)
        );
      }
      isVideoOn = true;
      videoButton.innerText = "video [on]";
    }
  }
};

/************ TOGGLE AUDIO *******************/
function sendAudio(myPeerConnection) {
  if (myPeerConnection["audioSender"]) {
    myPeerConnection["audioSender"].replaceTrack(
      audioStream.getAudioTracks()[0]
    );
  } else {
    myPeerConnection["audioSender"] = myPeerConnection.addTrack(
      audioStream.getAudioTracks()[0],
      localStream
    );
  }
}

function muteAudio(myPeerConnection) {
  if (myPeerConnection["audioSender"]) {
    myPeerConnection.removeTrack(myPeerConnection["audioSender"]);
    myPeerConnection["audioSender"] = null;
  }
}

const audioButton = document.getElementById("toggle_audio");
audioButton.onclick = () => {
  if (isAudioOn) {
    console.log("turning off audio...");
    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteAudio(myPeerConnection)
    );
    isAudioOn = false;
    audioButton.innerText = "audio [off]";
  } else {
    console.log("turning on audio...");
    Object.values(peerConnections).forEach((myPeerConnection) =>
      sendAudio(myPeerConnection)
    );
    isAudioOn = true;
    audioButton.innerText = "audio [on]";
  }
};

/************** TOGGLE SCREEN SHARING *********************/
function sendScreen(myPeerConnection) {
  console.log("capturing screen...");
  (navigator.mediaDevices as any)
    .getDisplayMedia({})
    .then((stream) => {
      localScreenStream = stream;
      const screenTrack = stream.getVideoTracks()[0];
      if (myPeerConnection["videoSender"]) {
        // if RTCRtpSender object already exists, replace the track
        myPeerConnection["videoSender"].replaceTrack(screenTrack);
      } else {
        myPeerConnection["videoSender"] = myPeerConnection.addTrack(
          screenTrack,
          localStream
        );
      }
    })
    .catch(handleError);
}

function muteScreen(myPeerConnection) {
  if (myPeerConnection["videoSender"]) {
    if (isVideoOn) {
      myPeerConnection["videoSender"].replaceTrack(
        videoStream.getVideoTracks()[0]
      );
    } else {
      myPeerConnection.removeTrack(myPeerConnection["videoSender"]);
      myPeerConnection["videoSender"] = null;
    }
  }
}

const screenButton = document.getElementById("toggle_screen");
screenButton.onclick = () => {
  if (isScreenSharing) {
    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteScreen(myPeerConnection)
    );
    isScreenSharing = false;
    screenButton.innerText = "screen [off]";
  } else {
    Object.values(peerConnections).forEach((myPeerConnection) =>
      sendScreen(myPeerConnection)
    );
    isScreenSharing = true;
    screenButton.innerText = "screen [on]";
  }
};

/***************** DISCONNECT ****************************/

document.getElementById("disconnect").onclick = () => hangUpCall();

function hangUpCall() {
  sendToServer({
    type: "disconnect",
    source: localUserId,
  });
  window.location.href = "/videocall";
}

function handleDisconnect(source: string) {
  const videoElements = document.getElementsByClassName("remote_video");
  let [low, high] = calcGridDimensions(videoElements.length - 1);
  resizeVideos(videoElements, low, high);

  document
    .getElementById("video_container")
    .removeChild(document.getElementById(source));
  peerConnections[source].close();
  delete peerConnections[source];
}

/********************* VIDEO ELEMENT STUFF **********************************/

function createRemoteVideoElement(remoteUserId) {
  if (document.getElementById(remoteUserId) == null) {
    console.log("creating video element");

    const videoElements = document.getElementsByClassName("remote_video");
    let [low, high] = calcGridDimensions(videoElements.length + 1);
    resizeVideos(videoElements, low, high);

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.id = remoteUserId;
    videoElement.className = "remote_video";
    videoElement.style.width = 100 / low + "%";
    videoElement.style.height = 100 / high + "%";
    // videoElement.src = "/test_videos/video_vertical.mp4";
    // videoElement.canPlayType("video/mp4");
    document.getElementById("video_container").appendChild(videoElement);
  }
}

// Used in combination with calcLargestFactors().
// Called whenever a video is added or removed.
function resizeVideos(videoElements, low, high) {
  if (window.innerWidth > window.innerHeight) {
    const temp = low;
    low = high;
    high = temp;
  }
  for (let i = 0; i < videoElements.length; i++) {
    (videoElements[i] as HTMLVideoElement).style.width = 100 / low + "%";
    (videoElements[i] as HTMLVideoElement).style.height = 100 / high + "%";
  }
}

// returns [a, b], where a <= b. resizeVideos() checks which one should be use for width and height
function calcGridDimensions(x) {
  for (let i = 1; ; i++) {
    const sq = Math.pow(i, 2);
    if (x <= sq) {
      if (x <= sq - i) {
        return [i - 1, i];
      } else {
        return [i, i];
      }
    }
  }
}

// change grid layout when the width becomes larger or smaller than the height
window.onresize = () => {
  const videoElements = document.getElementsByClassName("remote_video");
  if (videoElements.length > 1) {
    const width = parseInt(
      (videoElements[0] as HTMLVideoElement).style.width.slice(0, -1)
    );
    const height = parseInt(
      (videoElements[0] as HTMLVideoElement).style.height.slice(0, -1)
    );
    if (window.innerHeight > window.innerWidth !== height < width) {
      for (let i = 0; i < videoElements.length; i++) {
        (videoElements[i] as HTMLVideoElement).style.width = height + "%";
        (videoElements[i] as HTMLVideoElement).style.height = width + "%";
      }
    }
  }
};

function sendToServer(msg: Message) {
  ws.send(JSON.stringify(msg));
}

function handleRegister(msg: Message) {
  localUserId = msg.payload;
}

function handleError(err) {
  console.log(err);
}
