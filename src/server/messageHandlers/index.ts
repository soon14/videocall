import {
  incomingMessageType,
  IncomingSocketMessage,
} from "../Socket/SocketMessage";
import {
  StateRepository,
  User,
  UserId,
} from "../StateRepository/StateRepository";
import { handleChatMessage } from "./chatMessage";
import { handleDisconnect } from "./disconnect";
import { handleReconnectingUser } from "./register";

export type messageHandlerArgs<T extends IncomingSocketMessage> = {
  user: User;
  msg: T;
  state: StateRepository;
  sendToUser: (target: UserId, msg: T) => void;
  broadcastToRoom: (msg: T) => void;
};

type messageHandler = (args: messageHandlerArgs<any>) => void;

const notImplemented = () => {
  throw new Error("Not implemented");
};

export const messageTypeToRegisteredHandler: {
  [type in incomingMessageType]: messageHandler;
} = {
  register: handleReconnectingUser,
  disconnect: handleDisconnect,
  getRoomParticipants: notImplemented,
  "media-answer": notImplemented,
  "media-offer": notImplemented,
  chatMessage: handleChatMessage,
  "new-ice-candidate": notImplemented,
  "user-joined-room": notImplemented,
};
