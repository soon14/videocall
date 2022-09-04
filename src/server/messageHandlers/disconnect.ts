import { messageHandlerArgs } from '.';
import { Color, logWithColor } from '../logger';
import { StateRepository, User } from '../StateRepository/StateRepository';
import { userToSocketUser } from '../util';

interface DisconnectArgs {
  user: User;
  state: StateRepository;
  implicit: boolean;
  broadcastToRoom: messageHandlerArgs['broadcastToRoom'];
}

export function handleDisconnect({
  user,
  state,
  implicit,
  broadcastToRoom,
}: DisconnectArgs) {
  const implicitOrExplicit = implicit ? 'implicit' : 'explicit';

  logWithColor(
    Color.FgMagenta,
    `User ${user.id} disconnected (${implicitOrExplicit})`
  );

  const roomDeleted = state.removeUserFromRoom(user.id, user.room);

  if (!roomDeleted) {
    broadcastToRoom({
      type: 'user-left-room',
      source: userToSocketUser(user),
    });
  }

  state.deleteUserById(user.id);
}
