import {
  MessageToClientValues,
  MessageToServerType,
  MessageToServerValues,
} from '../Socket/SocketTypes';
import {
  StateRepository,
  User,
  UserId,
} from '../StateRepository/StateRepository';
import { handleChatMessage } from './chatMessage';
import { handleReconnectingUser } from './register';

export type messageHandlerArgs<T extends MessageToServerValues | {} = {}> = {
  user: User;
  msg: T;
  state: StateRepository;
  sendToUser: (target: UserId, msg: MessageToClientValues) => void;
  broadcastToRoom: (msg: MessageToClientValues) => void;
};

type messageHandler = (args: messageHandlerArgs<any>) => void;

const notImplemented = () => {
  throw new Error('Not implemented');
};

export const messageTypeToRegisteredHandler: {
  [type in MessageToServerType]: messageHandler;
} = {
  register: handleReconnectingUser,
  chatMessage: handleChatMessage,
  // getRoomParticipants: notImplemented,
  // 'media-answer': notImplemented,
  // 'media-offer': notImplemented,
  // 'new-ice-candidate': notImplemented,
  // 'user-joined-room': notImplemented,
};
