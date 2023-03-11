export type StreamType = "camera" | "screen";

export type SocketUser = {
  id: string;
  name?: string;
};

// ******************** INCOMING ***********************

type WithSource = {
  source: SocketUser;
};

export interface MessagesToClient {
  register: {
    type: "register";
    userId: string;
    usersInRoom: SocketUser[];
  };
  chatMessage: {
    type: "chatMessage";
    text: string;
  } & WithSource;
  "new-ice-candidate": {
    type: "new-ice-candidate";
    candidate: RTCIceCandidate;
    streamType: StreamType;
  } & WithSource;
  "user-left-room": {
    type: "user-left-room";
  } & WithSource;
  "user-joined-room": {
    type: "user-joined-room";
  } & WithSource;
  "media-offer": {
    type: "media-offer";
    sdp: RTCSessionDescription;
    streamType: StreamType;
  } & WithSource;
  "media-answer": {
    type: "media-answer";
    sdp: RTCSessionDescription;
    streamType: StreamType;
  } & WithSource;
  error: {
    type: "error";
    error: string;
  };
  ping: {
    type: "ping";
  };
}

// This type enforces every message type to contain a "type" field.
export type MessageToClientType =
  MessagesToClient[keyof MessagesToClient]["type"];
// This type enforces every key to match its "type" field.
export type MessageToClientValues = MessagesToClient[MessageToClientType];

// ******************** OUTGOING ***********************

export interface MessagesToServer extends RelayMessages {
  register: {
    type: "register";
    roomId: string;
    name?: string;
  };
  chatMessage: {
    type: "chatMessage";
    text: string;
  };
  pong: {
    type: "pong";
  };
}

type WithDestination = {
  target: string;
};

export interface RelayMessages {
  "new-ice-candidate": {
    type: "new-ice-candidate";
    candidate: RTCIceCandidate;
    streamType: StreamType;
  } & WithDestination;
  "media-offer": {
    type: "media-offer";
    sdp: RTCSessionDescription;
    streamType: StreamType;
  } & WithDestination;
  "media-answer": {
    type: "media-answer";
    sdp: RTCSessionDescription;
    streamType: StreamType;
  } & WithDestination;
}

// This type enforces every message type to contain a "type" field.
export type MessageToServerType =
  MessagesToServer[keyof MessagesToServer]["type"];
// This type enforces every key to match its "type" field.
export type MessageToServerValues = MessagesToServer[MessageToServerType];
