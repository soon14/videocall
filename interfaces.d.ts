export interface Clients {
    [userId: string]: {
        name: string;
        socket: WebSocket;
    }
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
    'new-ice-candidate' | 'hang-up' | 'user-joined-room' | 'register' | 'hang-up';