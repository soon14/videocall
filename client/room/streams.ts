import {peerConnections} from "./peerConnection";
import {handleError, log} from "./debug";

let audioStream; // initialized after navigator.mediaDevices.getUserMedia
let videoStream; // initialized after video toggle button is pressed
let localStream = new MediaStream();
let localScreenStream; // initialized after user clicks the button

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
export function sendVideo(myPeerConnection) {
    if (videoStream && myPeerConnection["videoSender"] == null) { // == instead of === to include 'undefined'
      log("streaming camera");
      const videoTrack = videoStream.getVideoTracks()[0];
      myPeerConnection["videoSender"] = myPeerConnection.addTrack(
        videoTrack,
        localStream
      );
    } 
  }
  
  function muteVideo(myPeerConnection) {
    if (myPeerConnection["videoSender"]) {
      log("stopped camera stream");
      // removeTrack triggers negotiation
      myPeerConnection.removeTrack(myPeerConnection["videoSender"]);
      myPeerConnection["videoSender"] = null;
    }
  }
  
  const videoButton = document.getElementById("toggle_video");
  videoButton.onclick = () => {
    if (videoStream) {
      console.log("turning off video...");
      videoButton.innerText = "camera [off]";

      // Stop browser from accessing the device
      // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
      videoStream.getTracks().forEach(track => {
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
      console.log("turning on video...");
      // Request access to device
      navigator.mediaDevices.getUserMedia({ video: {facingMode: "user"}})
      .then((stream) => {
        videoButton.innerText = "camera [on]";
        videoStream = stream;
        console.log("video stream initialized");
        localVideoElement.srcObject = stream;

        // If not screensharing, send track to peerConnections
        // TODO: Is it correct to check for "not null" with !localScreenStream?
        if (localScreenStream == null) {  // == instead of === to include 'undefined'
          log(Object.values(peerConnections).length + " peer connections");
          Object.values(peerConnections).forEach((myPeerConnection) =>
            sendVideo(myPeerConnection)
          );
        }
      })
      .catch(handleError);
    }
  };
  
  /************ TOGGLE AUDIO *******************/
  export function sendAudio(myPeerConnection) {
    if (audioStream && myPeerConnection["audioSender"] == null) { // == instead of === to include 'undefined'
      log("Streaming mic");
      myPeerConnection["audioSender"] = myPeerConnection.addTrack(
        audioStream.getAudioTracks()[0],
        localStream
      );
    }
  }
  
  function muteAudio(myPeerConnection) {
    if (myPeerConnection["audioSender"]) {
      log("Stopped streaming mic");
      myPeerConnection.removeTrack(myPeerConnection["audioSender"]);
      myPeerConnection["audioSender"] = null;
    }
  }
  
  const audioButton = document.getElementById("toggle_audio");
  audioButton.onclick = () => {
    if (audioStream) {
      console.log("turning off audio...");
      audioButton.innerText = "mic [off]";

      // Stop browser from accessing this device
      // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
      audioStream.getTracks().forEach(track => {
        track.stop();
      });
      audioStream = null;

      // Remove tracks from peerConnections
      Object.values(peerConnections).forEach((myPeerConnection) =>
        muteAudio(myPeerConnection)
      );
      
    } 
    else {
      console.log("turning on audio...");
      // Request access to device
      navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log("audio stream initialized");
        audioButton.innerText = "mic [on]";
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
  export function sendScreen(myPeerConnection) {
    if (localScreenStream) {
      log("streaming screen");
        const screenTrack = localScreenStream.getVideoTracks()[0];
        // If camera is already using the videoSender, replace the track.
        // Screen share has priority.
        if (myPeerConnection["videoSender"]) {
          log("replace screen track");
          myPeerConnection["videoSender"].replaceTrack(screenTrack);
        } 
        else {
          log("add new screen track");
          myPeerConnection["videoSender"] = myPeerConnection.addTrack(
            screenTrack,
            localStream
          );
        }
    }
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
      console.log("Turning off screen sharing...");
      screenButton.innerText = "screen [off]";

      // Stop browser from accessing this device
      // https://stackoverflow.com/questions/11642926/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
      localScreenStream.getTracks().forEach(track => {
        track.stop();
      });
      localScreenStream = null;

      Object.values(peerConnections).forEach((myPeerConnection) =>
        muteScreen(myPeerConnection)
      );
      
    } 
    else {
      console.log("Turning on screen sharing...");
      // Request access to screen
      (navigator.mediaDevices as any)
      .getDisplayMedia({})
      .then((stream) => {
        console.log("screen stream initialized");
        screenButton.innerText = "screen [on]";
        localScreenStream = stream;
        log(Object.values(peerConnections).length + " peer connections (screen)");
        // Send tracks to peerConnections
        Object.values(peerConnections).forEach((myPeerConnection) =>
          sendScreen(myPeerConnection)
        );
      })
      .catch(handleError);
    }
  };
