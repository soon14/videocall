import { Color, logError, logWithColor } from "../logger";
import { broadcastToRoom } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import { UserId } from "../StateRepository/StateRepository";
import { userToSocketUser } from "../util";

type DisconnectType = "implicit" | "explicit";

export function handleDisconnect(
  userId: UserId | null,
  disconnectType: DisconnectType
) {
  if (!userId) {
    logError(`User without userId disconnected (${disconnectType})`);
    return;
  }

  if (disconnectType === "implicit") {
    State.setDisconnectTimer(userId, () =>
      disconnectUser(userId, disconnectType)
    );
  } else {
    disconnectUser(userId, disconnectType);
  }
}

export const disconnectUser = (
  userId: UserId,
  disconnectType: DisconnectType
) => {
  logWithColor(
    Color.FgMagenta,
    `User ${userId} disconnected (${disconnectType})`
  );

  const user = State.getUserById(userId);

  const roomDeleted = State.removeUserFromRoom(userId, user.room);

  if (!roomDeleted) {
    broadcastToRoom(userToSocketUser(user), user.room, {
      type: "user-left-room",
    });
  }

  State.deleteUserById(user.id);
};
