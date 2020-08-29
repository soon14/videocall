import {Message} from "../../interfaces";

interface PeerConnection {
    [key: string]:  RTCPeerConnection
}

// local state
const peerConnections: PeerConnection = {};
let localUserId; // supplied by websocket during connect()
let roomId = window.location.pathname.split('/')[2];

let localStream; // initialized after navigator.mediaDevices.getUserMedia
let ws: WebSocket; // initialized during connect()

// HTML references and event listeners
const localVideoElement: HTMLVideoElement = document.getElementById("local_video") as HTMLVideoElement;
document.getElementById("disconnect").onclick = () => hangUpCall();

// request video and audio from user
navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then((stream) => {
        localStream = stream;
        localVideoElement.srcObject = localStream;
        connect();
    })
    .catch(handleError);

// called after user has agreed to share video and audio
function connect() {
    ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
        console.log("connected");
        // let server know our roomId. The server will respond with a userId we can use.
        sendToServer({type: "register", payload: roomId});

        // event handlers
        ws.onmessage = (msg) => {
            const data: Message = JSON.parse(msg.data);
            console.log(data);

            switch (data.type) {
                case "register":
                    handleRegister(data);
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
                case "disconnect":
                    handleDisconnect(data.source);
                    break;
            }
        };
    };
}

function sendToServer(msg: Message) {
    ws.send(JSON.stringify(msg));
}

function handleRegister(msg: Message) {
    localUserId = msg.payload;
}

function invite(remoteUserId) {
    // TODO: check if specific connection already exists (using remoteUserId)
    const myPeerConnection = createPeerConnection(remoteUserId);
    localStream.getTracks().forEach(
        (track) => myPeerConnection.addTrack(track, localStream))

}

// remoteUserId not supplied in case of creating peer connection as answer to a video offer
function createPeerConnection(remoteUserId) {
    const myPeerConnection = new RTCPeerConnection({
        iceServers: [] //{urls: "stun:stun.stunprotocol.org"}
    });
    // save reference to peer connection
    peerConnections[remoteUserId] = myPeerConnection;

    // first three of these event handlers are required
    myPeerConnection.onicecandidate = (event) => handleICECandidateEvent(event, remoteUserId);
    myPeerConnection.ontrack = (event) => handleTrackEvent(event, remoteUserId);
    // onnegotiationneeded is not called in case of video-answer
    myPeerConnection.onnegotiationneeded = () => {handleNegotiationNeededEvent(myPeerConnection, remoteUserId)};
    // myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = (event: RTCPeerConnectionIceEvent) => {handleICEConnectionStateChangeEvent(event, remoteUserId)};
    // myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    // myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
    return myPeerConnection;
}

function handleICEConnectionStateChangeEvent(event, remoteUserId) {
    console.log("connection state change");
    if (event.target.iceConnectionState === 'failed' || event.target.iceConnectionState === 'disconnected') {
        console.log("remote client %d disconnected", remoteUserId);
        handleDisconnect(remoteUserId);
    }
    console.log(event);
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
        type: "disconnect",
        source: localUserId
    });
    window.location.href = "/";
}

function handleDisconnect(source: string) {
    const videoElements = document.getElementsByClassName("remote_video");
    let [low, high] = calcGridDimensions(videoElements.length - 1);
    resizeVideos(videoElements, low, high);

    document.getElementById("video_container").removeChild(
        document.getElementById(source));
    peerConnections[source].close();
    delete peerConnections[source];
}

function createRemoteVideoElement(remoteUserId) {
    const videoElements = document.getElementsByClassName("remote_video");
    let [low, high] = calcGridDimensions(videoElements.length + 1);
    resizeVideos(videoElements, low, high);

    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.id = remoteUserId;
    videoElement.className = "remote_video";
    videoElement.style.width = (100 / low) + "%";
    videoElement.style.height = (100 / high) + "%";
    // videoElement.src = "/test_videos/video_vertical.mp4";
    // videoElement.canPlayType("video/mp4");
    document.getElementById("video_container").appendChild(videoElement);
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
        (videoElements[i] as HTMLVideoElement).style.width = (100 / low) + "%";
        (videoElements[i] as HTMLVideoElement).style.height = (100 / high) + "%";
    }
}

// returns [a, b], where a <= b. resizeVideos() checks which one should be use for width and height
function calcGridDimensions(x) {
    for (let i = 1; ; i++) {
        const sq = Math.pow(i, 2);
        if (x <= sq) {
            if (x <= sq - i) {
                return [i-1, i];
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
        const width = parseInt((videoElements[0] as HTMLVideoElement).style.width.slice(0, -1));
        const height = parseInt((videoElements[0] as HTMLVideoElement).style.height.slice(0, -1));
        if ((window.innerHeight > window.innerWidth) !== (height < width)) {
            for (let i = 0; i < videoElements.length; i++) {
                (videoElements[i] as HTMLVideoElement).style.width = height + "%";
                (videoElements[i] as HTMLVideoElement).style.height = width + "%";
            }
        }
    }
};


function handleError(err) {
    console.log(err);
}