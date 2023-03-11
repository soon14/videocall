import { log, logError } from "../logger";
import { sendToUser } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import { UserId } from "../StateRepository/StateRepository";
import { disconnectUser } from "./disconnect";

export const handlePong = (userId: UserId) => {
  log(`Received pong from ${userId}`);

  State.clearDisconnectTimer(userId);

  setTimeout(() => {
    try {
      sendToUser(null, userId, {
        type: "ping",
      });

      State.setDisconnectTimer(userId, () =>
        disconnectUser(userId, "implicit")
      );
    } catch (e: any) {
      logError(e);
    }
  }, 20000);
};
