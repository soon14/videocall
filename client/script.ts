import {Message} from "../interfaces";

let localUserId;
let myPeerConnection;
// used by browser to request media
const mediaConstraints = {audio: true, video: true};


const ws = new WebSocket("ws://localhost:3000");
ws.onopen = () => {
    console.log("connected");
    ws.onmessage = (msg) => {
        const data: Message = JSON.parse(msg.data);
        console.log(data);

        switch(data.type) {
            case "register":
                localUserId = data.payload;
                break;
            case "video-offer":
                handleVideoOfferMsg(data);
                break;
            case "video-answer":
                handleVideoAnswerMsg(data);
                break;
            case "new-ice-candidate":
                handleNewICECandidateMsg(data);
                break;
            case "user-joined-room":
                invite(data.source);
                break;
        }
    };
};

function sendToServer(msg) {
    ws.send(JSON.stringify(msg));
}

const localVideoElement: HTMLVideoElement = document.getElementById("local_video") as HTMLVideoElement;
const remoteVideoElement: HTMLVideoElement = document.getElementById("remote_video") as HTMLVideoElement;

document.getElementById("invite_button").onclick = () => invite();
document.getElementById("hangup_button").onclick = () => hangUpCall();



function invite(remoteUserId?) {
    if (myPeerConnection) {
        alert("peer connection already exists");
        return;
    }
    createPeerConnection(remoteUserId);

    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then((localStream) => {
            localVideoElement.srcObject = localStream;
            localStream.getTracks().forEach(
                (track) => myPeerConnection.addTrack(track, localStream))
        })
        .catch(handleError);
}

function createPeerConnection(remoteUserId?) {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [] //{urls: "stun:stun.stunprotocol.org"}
    });

    // first three of these event handlers are required
    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = () => {handleNegotiationNeededEvent(remoteUserId)};
    // myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    // myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    // myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    // myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
}

// called by browser when it is ready to connect to peer
function handleNegotiationNeededEvent(remoteUserId) {
    console.log("handleNegotiationNeededEvent");
    myPeerConnection.createOffer()
        .then((offer) => {return myPeerConnection.setLocalDescription(offer)})
        .then(() => {
            sendToServer({
                type: "video-offer",
                source: localUserId,
                target: remoteUserId,
                sdp: myPeerConnection.localDescription
            })
        })
        .catch(handleError);
}

// receiving a video-offer from another client
function handleVideoOfferMsg(msg) {
    createPeerConnection();

    myPeerConnection
        .setRemoteDescription(new RTCSessionDescription(msg.sdp))
        // prepare local video + audio stream
        .then(() => {return navigator.mediaDevices.getUserMedia(mediaConstraints)})
        .then((stream) => {
            // display our own stream to ourselves
            localVideoElement.srcObject = stream;
            // give our peer access to our stream by adding a track
            stream.getTracks().forEach(
                track => myPeerConnection.addTrack(track, stream))
        })
        // create answer, so that peer can accept our stream as well
        .then(() => {return myPeerConnection.createAnswer()})
        .then((answer) => {return myPeerConnection.setLocalDescription(answer)})
        .then(() => {
            sendToServer({
                type: "video-answer",
                source: localUserId,
                target: msg.source,
                sdp: myPeerConnection.localDescription
            });
        })
        .catch(handleError);
}

// handle video-answer message
function handleVideoAnswerMsg(msg) {
    myPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
}

// called by RTCPeerConnection when new ICE candidate is found for our network
function handleICECandidateEvent(event) {
    if (event.candidate) {
        // let others know of our candidate
        sendToServer({
            type: "new-ice-candidate",
            source: localUserId,
            candidate: event.candidate
        });
    }
}

// event handler for when remote user makes a potential ICE candidate known for his network
function handleNewICECandidateMsg(msg) {
    myPeerConnection.addIceCandidate(
        new RTCIceCandidate(msg.candidate)
    ).catch(handleError);
}

// called by RTCPeerConnection when remote user makes tracks available
function handleTrackEvent(event) {
    remoteVideoElement.srcObject = event.streams[0];
}

function handleRemoveTrackEvent(event) {
    // this function is called by the browser when tracks are removed from the receiving
    // video stream.
    if ((remoteVideoElement.srcObject as MediaStream).getTracks().length === 0) {
        // call has ended, reset the app
        closeVideoCall();
    }
}

function hangUpCall() {
    sendToServer({
        type: "hang-up",
        source: localUserId
    });
    closeVideoCall();
}

// resets the internal state
function closeVideoCall() {
    if (myPeerConnection) {
        myPeerConnection.onicecandidate = null;
        myPeerConnection.ontrack = null;
        myPeerConnection.onnegotiationneeded = null;
        // myPeerConnection.onremovetrack = null;
        // myPeerConnection.oniceconnectionstatechange = null;
        // myPeerConnection.onicegatheringstatechange = null;
        // myPeerConnection.onsignalingstatechange = null;
        if (remoteVideoElement.srcObject) {
            (remoteVideoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        if (localVideoElement.srcObject) {
            (localVideoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }

        myPeerConnection.close();
        myPeerConnection = null;
    }
    remoteVideoElement.removeAttribute("src");
    remoteVideoElement.removeAttribute("srcObject");
    localVideoElement.removeAttribute("src");
    localVideoElement.removeAttribute("srcObject");
}

function handleError(err) {
    alert("error, see console log");
    console.log(err);
}