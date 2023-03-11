import { log, logError } from "../logger";
import { handleChatMessage } from "../messageHandlers/chatMessage";
import { handlePong } from "../messageHandlers/pongMessage";
import { handleRegister } from "../messageHandlers/register";
import { relayMessage } from "../messageHandlers/relayMessage";
import { MyWebSocket } from "./SocketConnection";
import { MessageToServerValues } from "./SocketTypes";

export const handleMessage = (msg: string, ws: MyWebSocket) => {
  log(`Received message from ${ws.userId}`);

  let parsedMessage: MessageToServerValues;
  try {
    parsedMessage = parseMessage(msg);
    log(parsedMessage);
  } catch (e) {
    logError("Failed to parse message");
    return;
  }

  handleParsedMessage(parsedMessage, ws);
};

const handleParsedMessage = (msg: MessageToServerValues, ws: MyWebSocket) => {
  try {
    const msgType = msg.type;

    if (msgType === "register") {
      return handleRegister(msg, ws);
    }

    const userId = ws.userId;

    if (!userId) {
      throw new Error("UserId not defined on ws");
    }

    if (msgType === "chatMessage") {
      handleChatMessage(msg, userId);
    } else if (msgType === "pong") {
      handlePong(userId);
    } else {
      relayMessage(msg, userId);
    }
  } catch (e: any) {
    logError("Error occurred in handleMessage()");
    handleError(msg, e, ws);
  }
};

const parseMessage = (msg: string): MessageToServerValues => {
  const res = JSON.parse(msg);
  if (!res.type) {
    throw new Error("Message does not contain type");
  }
  return res;
};

function handleError(
  incomingMessage: MessageToServerValues,
  e: any,
  ws: MyWebSocket
) {
  console.error(e);
}
