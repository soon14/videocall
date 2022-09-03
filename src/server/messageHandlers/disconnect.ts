import { messageHandlerArgs } from ".";
import { Color, logWithColor } from "../logger";
import { IncomingSocketMessage } from "../Socket/SocketMessage";

interface DisconnectMessage extends IncomingSocketMessage {
  implicit: boolean;
}

export function handleDisconnect({
  user,
  msg,
  state,
  broadcastToRoom,
}: messageHandlerArgs<DisconnectMessage>) {
  const implicitOrExplicit = msg.implicit ? "implicit" : "explicit";

  logWithColor(
    Color.FgMagenta,
    `User ${user.id} disconnected (${implicitOrExplicit})`
  );

  const roomDeleted = state.removeUserFromRoom(user.id, user.room);

  if (!roomDeleted) {
    broadcastToRoom(msg);
  }

  state.deleteUserById(user.id);
}
