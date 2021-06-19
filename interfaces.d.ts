export interface Clients {
    [userId: string]: {
        name: string;
        socket: WebSocket;
        room: string;
        disconnectTimer: TimeOut; // id returned by setTimeOut()
    }
}

export interface Rooms {
    [roomId: string]: string[]; // array of userId's
}

export interface Message {
    type: messageType;
    source?: string; // source has ? because sometimes the server sends the client info, like the generated username
    target?: string; // target is not specified if the msg should be broadcast.
    payload?: any; // not always needed. Very often, the type, source and target are enough.
    candidate?: RTCIceCandidateInit; // for ice candidates
    sdp?: RTCSessionDescriptionInit;
    timer?: number;
}
type messageType = 'media-offer' | 'media-answer' |
    'new-ice-candidate' | 'user-joined-room' | 'register' | 'disconnect' | 'message'
    | 'getRoomParticipants';