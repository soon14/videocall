import { logError } from "../logger";
import { userToSocketUser } from "../util";
import { sendToUser } from "./MessageSenders";
import { MyWebSocket, State } from "./SocketConnection";
import { MessageToServerValues } from "./SocketTypes";

const notifyError = (ws: MyWebSocket, error: string) => {
  if (!ws.userId) {
    logError("Unable to notify user about error because of missing userId");
    return;
  }

  try {
    const socketUser = userToSocketUser(State.getUserById(ws.userId));
    sendToUser(socketUser, ws, {
      type: "error",
      error,
    });
  } catch (e) {
    logError(`Failed to send error message to ${ws.userId}`);
  }
};

export const handleError = (
  msg: MessageToServerValues,
  err: Error,
  ws: MyWebSocket
) => {
  logError(`Error occurred for message type: ${msg.type}: ${err.message}`);
  logError(err.stack || "");

  const message = `Execution of message with type ${msg.type} failed.`;
  notifyError(ws, message);
};
