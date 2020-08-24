import {Message} from "../interfaces";

interface PeerConnection {
    [key: string]:  RTCPeerConnection
}
const peerConnections: PeerConnection = {};

// used by browser to request media
const mediaConstraints = {audio: true, video: true};

let localStream; // initialized after navigator.mediaDevices.getUserMedia
let localUserId; // initialized during() connect (supplied by server)
let ws: WebSocket; // initialized during connect()


navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then((stream) => {
        localStream = stream;
        localVideoElement.srcObject = localStream;
        connect();
    })
    .catch(handleError);

function connect() {
    ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
        console.log("connected");
        ws.onmessage = (msg) => {
            const data: Message = JSON.parse(msg.data);
            console.log(data);

            switch (data.type) {
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
                case "hang-up":
                    handleHangUp(data);
                    break;
            }
        };
    };
}

function sendToServer(msg) {
    ws.send(JSON.stringify(msg));
}

const localVideoElement: HTMLVideoElement = document.getElementById("local_video") as HTMLVideoElement;
document.getElementById("hangup_button").onclick = () => hangUpCall();



function invite(remoteUserId) {
    // TODO: replace with check if *specific* connection already exists (using remoteUserId)
    // if (myPeerConnection) {
    //     alert("peer connection already exists");
    //     return;
    // }
    const myPeerConnection = createPeerConnection(remoteUserId);
    localStream.getTracks().forEach(
        (track) => myPeerConnection.addTrack(track, localStream))

}

// remoteUserId not supplied in case of creating peer connection as answer to a video offer
function createPeerConnection(remoteUserId) {
    const myPeerConnection = new RTCPeerConnection({
        iceServers: [] //{urls: "stun:stun.stunprotocol.org"}
    });

    peerConnections[remoteUserId] = myPeerConnection;

    // first three of these event handlers are required
    myPeerConnection.onicecandidate = (event) => handleICECandidateEvent(event, remoteUserId);
    myPeerConnection.ontrack = (event) => handleTrackEvent(event, remoteUserId);
    // onnegotiationneeded is not called in case of video-answer
    myPeerConnection.onnegotiationneeded = () => {handleNegotiationNeededEvent(myPeerConnection, remoteUserId)};
    // myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    // myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    // myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    // myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
    return myPeerConnection;
}

// called by browser when it is ready to connect to peer, creates video-offer
function handleNegotiationNeededEvent(myPeerConnection, remoteUserId) {
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
function handleVideoOfferMsg(msg: Message) {
    const myPeerConnection = createPeerConnection(msg.source);
    createRemoteVideoElement(msg.source);
    myPeerConnection
        .setRemoteDescription(new RTCSessionDescription(msg.sdp))
        // prepare local video + audio stream
        .then(() => {
            // give our peer access to our stream by adding a track
            localStream.getTracks().forEach(
                track => myPeerConnection.addTrack(track, localStream))
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
function handleVideoAnswerMsg(msg: Message) {
    peerConnections[msg.source].setRemoteDescription(new RTCSessionDescription(msg.sdp));
    createRemoteVideoElement(msg.source);
}




// called by RTCPeerConnection when new ICE candidate is found for our network
function handleICECandidateEvent(event, remoteUserId) {
    if (event.candidate) {
        // let others know of our candidate
        sendToServer({
            type: "new-ice-candidate",
            source: localUserId,
            target: remoteUserId,
            candidate: event.candidate
        });
    }
}

// event handler for when remote user makes a potential ICE candidate known for his network
function handleNewICECandidateMsg(msg: Message) {
    if (peerConnections[msg.source]) {
        peerConnections[msg.source].addIceCandidate(
            new RTCIceCandidate(msg.candidate)
        ).catch(handleError);
    }
}

// called by RTCPeerConnection when remote user makes tracks available
function handleTrackEvent(event, remoteUserId) {
    console.log("handleTrack");
    console.log(remoteUserId);
    (document.getElementById(remoteUserId) as HTMLVideoElement).srcObject = event.streams[0];
}

// function handleRemoveTrackEvent(event) {
//     // this function is called by the browser when tracks are removed from the receiving
//     // video stream.
//     if ((remoteVideoElement.srcObject as MediaStream).getTracks().length === 0) {
//         // call has ended, reset the app
//     }
// }

function hangUpCall() {
    sendToServer({
        type: "hang-up",
        source: localUserId
    });
}

function handleHangUp(msg: Message) {
    document.getElementById("video_container").removeChild(
        document.getElementById(msg.source));
}

// // resets the internal state
// function closeVideoCall() {
//     if (myPeerConnection) {
//         myPeerConnection.onicecandidate = null;
//         myPeerConnection.ontrack = null;
//         myPeerConnection.onnegotiationneeded = null;
//         // myPeerConnection.onremovetrack = null;
//         // myPeerConnection.oniceconnectionstatechange = null;
//         // myPeerConnection.onicegatheringstatechange = null;
//         // myPeerConnection.onsignalingstatechange = null;
//         if (remoteVideoElement.srcObject) {
//             (remoteVideoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
//         }
//         if (localVideoElement.srcObject) {
//             (localVideoElement.srcObject as MediaStream).getTracks().forEach(track => track.stop());
//         }
//
//         myPeerConnection.close();
//         myPeerConnection = null;
//     }
//     remoteVideoElement.removeAttribute("src");
//     remoteVideoElement.removeAttribute("srcObject");
//     localVideoElement.removeAttribute("src");
//     localVideoElement.removeAttribute("srcObject");
// }

function createRemoteVideoElement(remoteUserId) {
    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.id = remoteUserId;
    document.getElementById("video_container").appendChild(videoElement);
}

function handleError(err) {
    alert("error, see console log");
    console.log(err);
}