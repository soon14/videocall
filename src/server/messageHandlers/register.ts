import { messageHandlerArgs } from '.';
import { Color, logWithColor } from '../logger';
import { MyWebSocket } from '../Socket/SocketConnection';
import {
  MessagesToServer,
  MessageToClientValues,
  SocketUser,
} from '../Socket/SocketTypes';
import { RoomId, UserId } from '../StateRepository/StateRepository';
import { userToSocketUser } from '../util';

type RegisterUserArgs = Pick<
  messageHandlerArgs<MessagesToServer['register']>,
  'msg' | 'state'
> & {
  ws: MyWebSocket;
  sendToUser: (
    source: SocketUser,
    target: UserId,
    msg: MessageToClientValues
  ) => void;
  broadcastToRoom: (
    source: SocketUser,
    roomId: RoomId,
    msg: MessageToClientValues
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

  const user = state.createUser({ roomId, name, ws });
  const userId = user.id;
  ws.userId = userId;

  const socketUser = userToSocketUser(user);

  // let client know his id
  sendToUser(socketUser, user.id, {
    type: 'register',
    userId,
  });

  state.addUserToRoom(userId, roomId);

  // let others know that a new user joined the room, so they can send him offers
  broadcastToRoom(socketUser, roomId, {
    type: 'user-joined-room',
    source: socketUser,
  });
}

export const handleReconnectingUser = ({
  user,
  state,
}: messageHandlerArgs<MessagesToServer['register']>) => {
  logWithColor(Color.FgYellow, 'Reconnected user ' + user.id);

  state.clearDisconnectTimer(user.id);
};
