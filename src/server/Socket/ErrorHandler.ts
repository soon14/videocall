import { logError } from "../logger";
import { userToSocketUser } from "../util";
import { sendToUser } from "./MessageSenders";
import { MyWebSocket, State } from "./SocketConnection";
import { MessageToServerValues } from "./SocketTypes";

export const handleError = (
  msg: MessageToServerValues,
  err: Error,
  ws: MyWebSocket
) => {
  logError(`Error occurred for message type: ${msg.type}: ${err.message}`);
  logError(err.stack || "");
};
