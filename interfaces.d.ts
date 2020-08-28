export interface Clients {
    [userId: string]: {
        name: string;
        socket: WebSocket;
        room: string;
    }
}

export interface Rooms {
    [roomId: string]: string[]; // array of userId's
}

export interface Message {
    type: messageType;
    source?: string; // source has ? because sometimes the server sends the client info, like the generated username
    target?: string; // target is not specified if the msg should be broadcast.
    payload?: string; // not always needed. Very often, the type, source and target are enough.
    candidate?: RTCIceCandidateInit; // for ice candidates
    sdp?: RTCSessionDescriptionInit;
}
type messageType = 'video-offer' | 'video-answer' |
    'new-ice-candidate' | 'user-joined-room' | 'register' | 'disconnect';