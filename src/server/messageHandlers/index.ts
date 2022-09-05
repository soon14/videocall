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
import { relayMessage } from './relayMessage';

export type messageHandlerArgs<T extends MessageToServerValues | {} = {}> = {
  user: User;
  msg: T;
  state: StateRepository;
  sendToUser: (target: UserId, msg: MessageToClientValues) => void;
  broadcastToRoom: (msg: MessageToClientValues) => void;
};

type messageHandler = (args: messageHandlerArgs<any>) => void;

export const messageTypeToHandler: {
  [type in MessageToServerType]: messageHandler;
} = {
  register: handleReconnectingUser,
  chatMessage: handleChatMessage,
  'media-answer': relayMessage,
  'media-offer': relayMessage,
  'new-ice-candidate': relayMessage,
};
