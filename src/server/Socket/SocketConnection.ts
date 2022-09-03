import * as WebSocket from 'ws';
import { Color, log, logError, logWithColor } from '../logger';
import { messageTypeToRegisteredHandler } from '../messageHandlers';
import { handleRegister } from '../messageHandlers/register';
import { InMemoryState } from '../StateRepository/InMemoryState';
import { RoomId, UserId } from '../StateRepository/StateRepository';
import { IncomingSocketMessage, OutgoingSocketMessage } from './SocketMessage';

export const State = new InMemoryState();

export const initWsServer = (wss: WebSocket.Server) => {
  wss.on('connection', (ws: MyWebSocket) => {
    logWithColor(Color.FgYellow, 'WebSocket connected');

    ws.on('message', (msg: string) => {
      log(`Received message from ${ws.userId}`);

      let parsedMessage: IncomingSocketMessage;
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
    ws.on('close', () => {
      try {
        const userId = ws.userId;

        if (!userId) {
          logError('Received close event for ws without userId');
          return;
        }

        logWithColor(Color.FgMagenta, `Lost connection with: ${userId}`);

        State.setDisconnectTimer(userId, () => {
          handleMessage(
            {
              type: 'disconnect',
              implicit: true,
            },
            ws
          );
        });
      } catch (e: any) {
        logError('Error occuring inside close event handler');
        logError(e);
      }
    });
  });
};

const handleMessage = <T extends IncomingSocketMessage>(
  incomingMessage: T,
  ws: MyWebSocket
) => {
  try {
    const userId = ws.userId;
    if (!userId && incomingMessage.type === 'register') {
      handleRegister({
        msg: incomingMessage as any, // wtf?...
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
    const type = incomingMessage.type;

    messageTypeToRegisteredHandler[type]({
      user,
      msg: incomingMessage,
      state: State,
      sendToUser: <T extends OutgoingSocketMessage>(target: UserId, msg: T) =>
        sendToUser(userId, target, msg),
      broadcastToRoom: <T extends OutgoingSocketMessage>(msg: T) =>
        broadcastToRoom(userId, user.room, msg),
    });
  } catch (e: any) {
    logError('Error occurred in handleMessage()');
    handleError(incomingMessage, e, ws);
  }
};

const parseMessage = (msg: string): IncomingSocketMessage => {
  const res = JSON.parse(msg);
  if (!res.type) {
    throw new Error('Message does not contain type');
  }
  return res;
};

const notifyError = (ws: MyWebSocket, message: string) => {
  if (!ws.userId) {
    logError('Unable to notify user about error because of missing userId');
    return;
  }

  try {
    sendToUser(ws.userId, ws, {
      type: 'error',
      message,
    });
  } catch (e) {
    logError(`Failed to send error message to ${ws.userId}`);
  }
};

const handleError = (
  msg: IncomingSocketMessage,
  err: Error,
  ws: MyWebSocket
) => {
  logError(`Error occurred for message type: ${msg.type}: ${err.message}`);
  logError(err.stack || '');

  const message = `Execution of message with type ${msg.type} failed.`;
  notifyError(ws, message);
};

function sendToUser<T extends OutgoingSocketMessage>(
  source: UserId,
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

function broadcastToRoom<T extends OutgoingSocketMessage>(
  source: UserId,
  roomId: RoomId,
  msg: T
) {
  log(`Broadcasting message of type ${msg.type} to room ${roomId}`);
  const room = State.getRoomById(roomId);

  room.participants.forEach((participant) => {
    // TODO: is this a safe comparison?...
    if (source !== participant) {
      sendToUser(source, participant, msg);
    }
  });
}

export interface MyWebSocket extends WebSocket.WebSocket {
  userId?: string;
}
