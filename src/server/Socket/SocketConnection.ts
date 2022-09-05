import * as WebSocket from 'ws';
import { Color, log, logError, logWithColor } from '../logger';
import { messageTypeToHandler } from '../messageHandlers';
import { handleDisconnect } from '../messageHandlers/disconnect';
import { handleRegister } from '../messageHandlers/register';
import { InMemoryState } from '../StateRepository/InMemoryState';
import { RoomId, UserId } from '../StateRepository/StateRepository';
import { userToSocketUser } from '../util';
import {
  MessageToClientValues,
  MessageToServerValues,
  SocketUser,
} from './SocketTypes';

export const State = new InMemoryState();

// https://www.iana.org/assignments/websocket/websocket.xhtml
const EXPLICIT_DISCONNECT_CODE = 1000; // Normal Closure

export const initWsServer = (wss: WebSocket.Server) => {
  wss.on('connection', (ws: MyWebSocket) => {
    logWithColor(Color.FgYellow, 'WebSocket connected');

    ws.on('message', (msg: string) => {
      log(`Received message from ${ws.userId}`);

      let parsedMessage: MessageToServerValues;
      try {
        parsedMessage = parseMessage(msg);
        log(parsedMessage);
      } catch (e) {
        logError('Failed to parse message');
        return;
      }

      handleMessage(parsedMessage, ws);
    });

    // Implicit disconnect.
    ws.on('close', (code) => {
      try {
        const userId = ws.userId;

        if (!userId) {
          logError('Received close event for ws without userId');
          return;
        }

        const user = State.getUserById(userId);

        const implicit = code !== EXPLICIT_DISCONNECT_CODE;

        handleDisconnect({
          implicit,
          user,
          state: State,
          broadcastToRoom: (msg: MessageToClientValues) =>
            broadcastToRoom(userToSocketUser(user), user.room, msg),
        });
      } catch (e: any) {
        logError('Error occuring inside close event handler');
        logError(e);
      }
    });
  });
};

const handleMessage = (
  incomingMessage: MessageToServerValues,
  ws: MyWebSocket
) => {
  try {
    const userId = ws.userId;
    if (!userId && incomingMessage.type === 'register') {
      handleRegister({
        msg: incomingMessage,
        state: State,
        ws,
        sendToUser,
        broadcastToRoom,
      });
      return;
    }

    if (!userId) {
      throw new Error('UserId not defined on ws');
    }

    const user = State.getUserById(userId);
    const socketUser = userToSocketUser(user);
    const type = incomingMessage.type;

    messageTypeToHandler[type]({
      user,
      msg: incomingMessage,
      state: State,
      sendToUser: (target: UserId, msg: MessageToClientValues) =>
        sendToUser(socketUser, target, msg),
      broadcastToRoom: (msg: MessageToClientValues) =>
        broadcastToRoom(socketUser, user.room, msg),
    });
  } catch (e: any) {
    logError('Error occurred in handleMessage()');
    handleError(incomingMessage, e, ws);
  }
};

const parseMessage = (msg: string): MessageToServerValues => {
  const res = JSON.parse(msg);
  if (!res.type) {
    throw new Error('Message does not contain type');
  }
  return res;
};

const notifyError = (ws: MyWebSocket, error: string) => {
  if (!ws.userId) {
    logError('Unable to notify user about error because of missing userId');
    return;
  }

  try {
    const socketUser = userToSocketUser(State.getUserById(ws.userId));
    sendToUser(socketUser, ws, {
      type: 'error',
      error,
    });
  } catch (e) {
    logError(`Failed to send error message to ${ws.userId}`);
  }
};

const handleError = (
  msg: MessageToServerValues,
  err: Error,
  ws: MyWebSocket
) => {
  logError(`Error occurred for message type: ${msg.type}: ${err.message}`);
  logError(err.stack || '');

  const message = `Execution of message with type ${msg.type} failed.`;
  notifyError(ws, message);
};

function sendToUser<T extends MessageToClientValues>(
  source: SocketUser,
  target: UserId | MyWebSocket,
  msg: T
) {
  const socket =
    typeof target === 'string' ? State.getUserById(target).socket : target;

  const msgWithSource = {
    ...msg,
    source,
  };

  const msgString = JSON.stringify(msgWithSource);

  log(`Sending message of type ${msg.type} to user: ${target}`);
  socket.send(msgString);
}

function broadcastToRoom<T extends MessageToClientValues>(
  source: SocketUser,
  roomId: RoomId,
  msg: T
) {
  log(`Broadcasting message of type ${msg.type} to room ${roomId}`);
  const room = State.getRoomById(roomId);

  room.participants.forEach((participant) => {
    // TODO: is this a safe comparison?...
    if (source.id !== participant) {
      sendToUser(source, participant, msg);
    }
  });
}

export interface MyWebSocket extends WebSocket.WebSocket {
  userId?: string;
}
