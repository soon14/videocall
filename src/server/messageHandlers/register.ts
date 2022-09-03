import { messageHandlerArgs } from '.';
import { Color, logWithColor } from '../logger';
import { MyWebSocket } from '../Socket/SocketConnection';
import {
  IncomingSocketMessage,
  OutgoingSocketMessage,
} from '../Socket/SocketMessage';
import { MessagesToServer } from '../Socket/SocketTypes';
import { RoomId, UserId } from '../StateRepository/StateRepository';

type RegisterUserArgs = Pick<
  messageHandlerArgs<MessagesToServer['register']>,
  'msg' | 'state'
> & {
  ws: MyWebSocket;
  sendToUser: <T extends OutgoingSocketMessage>(
    source: UserId,
    target: UserId,
    msg: T
  ) => void;
  broadcastToRoom: <T extends OutgoingSocketMessage>(
    source: UserId,
    roomId: RoomId,
    msg: T
  ) => void;
};

export function handleRegister({
  msg,
  state,
  ws,
  sendToUser,
  broadcastToRoom,
}: RegisterUserArgs) {
  logWithColor(Color.FgGreen, `handleRegister\n${JSON.stringify(msg)}`);

  const { name, roomId } = msg;

  const userId = state.createUser({ roomId, name, ws });
  ws.userId = userId;

  // let client know his id
  sendToUser(userId, userId, {
    type: 'register',
    userId,
  });

  state.addUserToRoom(userId, roomId);

  // let others know that a new user joined the room, so they can send him offers
  broadcastToRoom(userId, roomId, {
    type: 'user-joined-room',
    userId,
    name,
  });
}

interface ReconnectUserArgs extends IncomingSocketMessage {}

export const handleReconnectingUser = ({
  user,
  state,
}: messageHandlerArgs<ReconnectUserArgs>) => {
  logWithColor(Color.FgYellow, 'Reconnected user ' + user.id);

  state.clearDisconnectTimer(user.id);
};
