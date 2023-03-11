import { log } from "../logger";
import { sendToUser } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import { UserId } from "../StateRepository/StateRepository";
import { disconnectUser } from "./disconnect";

export const handlePong = (userId: UserId) => {
  log(`Received pong from ${userId}`);

  State.clearDisconnectTimer(userId);

  setTimeout(() => {
    sendToUser(null, userId, {
      type: "ping",
    });

    State.setDisconnectTimer(userId, () => disconnectUser(userId, "implicit"));
  }, 20000);
};
