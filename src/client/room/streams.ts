import { peerConnections } from "./peerConnection";
import { Color, handleError, log } from "./debug";

let audioStream; // initialized after navigator.mediaDevices.getUserMedia
let videoStream; // initialized after video toggle button is pressed
// let localStream = new MediaStream();
let localScreenStream; // initialized after user clicks the button

// let frontCamera: boolean = true; // if false, use rear camera
// document.getElementById("local_video").onclick = () => {
//   if (videoStream) {
//     let constraints;
//     if (frontCamera) {
//       log("swapping to rear camera")
//       frontCamera = false;
//       constraints = {video: {facingMode: {exact: "environment"}}};
//     }
//     else {
//       log("swapping to front camera")
//       frontCamera = true;
//       constraints = {video: {facingMode: "user"}};
//     }
//     videoStream.getTracks().forEach(track => {
//       track.stop();
//     });
//     navigator.mediaDevices.getUserMedia(constraints)
//     .then((stream) => {
//       videoStream = stream;
//       localVideoElement.srcObject = stream;

//       // If not screensharing, send track to peerConnections
//       // TODO: Is it correct to check for "not null" with !localScreenStream?
//       if (localScreenStream == null) {  // == instead of === to include 'undefined'
//         log(Object.values(peerConnections).length + " peer connections");
//         Object.values(peerConnections).forEach((myPeerConnection) =>
//           sendVideo(myPeerConnection)
//         );
//       }
//     })
//     .catch(handleError);
//   }
// };

const localVideoElement: HTMLVideoElement = document.getElementById(
  "local_video"
) as HTMLVideoElement;

/**
 * The layout of this file is, for each stream type:
 * 
 * sendX() => adds the stream tracks to the RTCPeerConnection
 * muteX() => remove the stream tracks from the RTCPeerConnection
 * toggleX() => request access to device and initialize stream objects,
 *              or stop access by calling stop() on the tracks.
 * 
 * toggleX is called by a button click event.
 * sendX and muteX are called by toggleX after initializing the streams,
 *    and also by invite() in peerConnections.ts
 */


/************* TOGGLE VIDEO *****************/

/**
 * Attempt to send video. Return true if successful, return false if not.
 */
export function sendVideo(myPeerConnection): boolean {
  if (videoStream && myPeerConnection["videoSender"] == null) { // == instead of === to include 'undefined'
    const videoTrack = videoStream.getVideoTracks()[0];
    if (myPeerConnection["videoSender"]) {
      myPeerConnection["videoSender"].replaceTrack(videoTrack);
    }
    else {
      myPeerConnection["videoSender"] = myPeerConnection.addTrack(
        videoTrack,
        // localStream
      );
    }
    return true;
  }
  return false;
}

function muteVideo(myPeerConnection) {
  if (myPeerConnection["videoSender"]) {
    // removeTrack triggers negotiation
    myPeerConnection.removeTrack(myPeerConnection["videoSender"]);
    myPeerConnection["videoSender"] = null;
  }
}

const videoButton = document.getElementById("toggle_video");
videoButton.onclick = onVideoToggle;

let cameraConstraints = {
  video: {
    facingMode: "user",
    // width: 1280,
    // height: 720,
    // frameRate: 30
  }
};

// Toggle between front and rear camera by clicking on the local video element
localVideoElement.onclick = () => {
  if (cameraConstraints.video.facingMode === "user") {
    cameraConstraints.video.facingMode = "environment";
  } else {
    cameraConstraints.video.facingMode = "user";
  }
  // pray to God this works...
  onVideoToggle();
  setTimeout(onVideoToggle, 1000);
  // update: actually works, unless you rapidly toggle back and forth.
}

function onVideoToggle() {
  if (videoStream) {
    videoButton.innerText = "camera [off]";
    videoButton.classList.remove("active");

    // Stop browser from accessing the device
    // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
    videoStream.getVideoTracks().forEach(track => {
      track.stop();
    });
    videoStream = null;
    localVideoElement.srcObject = null;

    // Remove tracks from peerConnections
    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteVideo(myPeerConnection)
    );
  }
  else {
    // Request access to device
    navigator.mediaDevices.getUserMedia(cameraConstraints)
      .then((stream) => {
        videoButton.innerText = "camera [on]";
        videoButton.classList.add("active");
        videoStream = stream;
        localVideoElement.srcObject = stream;

        // If not screensharing, send track to peerConnections
        // TODO: Is it correct to check for "not null" with !localScreenStream?
        if (localScreenStream == null) {  // == instead of === to include 'undefined'
          Object.values(peerConnections).forEach((myPeerConnection) =>
            sendVideo(myPeerConnection)
          );
        }
      })
      .catch(handleError);
  }
};

/************ TOGGLE AUDIO *******************/
export function sendAudio(myPeerConnection): boolean {
  if (audioStream && myPeerConnection["audioSender"] == null) { // == instead of === to include 'undefined'
    myPeerConnection["audioSender"] = myPeerConnection.addTrack(
      audioStream.getAudioTracks()[0],
      // localStream
    );
    return true;
  }
  return false;
}

function muteAudio(myPeerConnection) {
  if (myPeerConnection["audioSender"]) {
    myPeerConnection.removeTrack(myPeerConnection["audioSender"]);
    myPeerConnection["audioSender"] = null;
  }
}

const audioButton = document.getElementById("toggle_audio");
audioButton.onclick = () => {
  if (audioStream) {
    audioButton.innerText = "mic [off]";
    audioButton.classList.remove("active");

    // Stop browser from accessing this device
    // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
    audioStream.getAudioTracks().forEach(track => {
      track.stop();
    });
    audioStream = null;

    // Remove tracks from peerConnections
    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteAudio(myPeerConnection)
    );

  }
  else {
    // Request access to device
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        audioButton.innerText = "mic [on]";
        audioButton.classList.add("active");
        audioStream = stream;
        // Send tracks to peerConnections
        Object.values(peerConnections).forEach((myPeerConnection) =>
          sendAudio(myPeerConnection)
        );
      })
      .catch(handleError);

  }
};

/************** TOGGLE SCREEN SHARING *********************/
export function sendScreen(myPeerConnection): boolean {
  if (localScreenStream) {
    const screenTrack = localScreenStream.getVideoTracks()[0];
    // If camera is already using the videoSender, replace the track.
    // Screen share has priority.
    if (myPeerConnection["videoSender"]) {
      myPeerConnection["videoSender"].replaceTrack(screenTrack);
    }
    else {
      myPeerConnection["videoSender"] = myPeerConnection.addTrack(
        screenTrack,
        // localStream
      );
    }
    return true;
  }
  return false;
}

function muteScreen(myPeerConnection) {
  // Both screen share and camera use the videoSender
  if (myPeerConnection["videoSender"]) {
    // If camera is being captured, replace screen share with that stream.
    if (videoStream) {
      myPeerConnection["videoSender"].replaceTrack(
        videoStream.getVideoTracks()[0]
      );
    }
    else {
      myPeerConnection.removeTrack(myPeerConnection["videoSender"]);
      myPeerConnection["videoSender"] = null;
    }
  }
}

const screenButton = document.getElementById("toggle_screen");
screenButton.onclick = () => {
  if (localScreenStream) {
    screenButton.innerText = "screen [off]";
    screenButton.classList.remove("active");

    // Stop browser from accessing this device
    // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
    localScreenStream.getVideoTracks().forEach(track => {
      track.stop();
    });
    localScreenStream = null;

    Object.values(peerConnections).forEach((myPeerConnection) =>
      muteScreen(myPeerConnection)
    );

  }
  else {
    // Request access to screen
    (navigator.mediaDevices as any)
      .getDisplayMedia({})
      .then((stream) => {
        screenButton.innerText = "screen [on]";
        screenButton.classList.add("active");
        localScreenStream = stream;
        // Send tracks to peerConnections
        Object.values(peerConnections).forEach((myPeerConnection) =>
          sendScreen(myPeerConnection)
        );
      })
      .catch(handleError);
  }
};
