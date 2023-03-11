import { Color, logError, logWithColor } from "../logger";
import { broadcastToRoom } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import {
  StateRepository,
  User,
  UserId,
} from "../StateRepository/StateRepository";
import { userToSocketUser } from "../util";

type DisconnectType = "implicit" | "explicit";

interface Args {
  userId: UserId | null;
  disconnectType: DisconnectType;
}

export function handleDisconnect({ userId, disconnectType }: Args) {
  if (!userId) {
    logError(`User without userId disconnected (${disconnectType})`);
    return;
  }

  const disconnectUser = () => {
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

  if (disconnectType === "implicit") {
    State.setDisconnectTimer(userId, () => disconnectUser());
  } else {
    disconnectUser();
  }
}
