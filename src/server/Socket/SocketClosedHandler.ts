import { logError } from "../logger";
import { handleDisconnect } from "../messageHandlers/disconnect";
import { MyWebSocket } from "./SocketConnection";

// https://www.iana.org/assignments/websocket/websocket.xhtml
const EXPLICIT_DISCONNECT_CODE = 1000; // Normal Closure

export const handleSocketClose = (code: number, ws: MyWebSocket) => {
  try {
    const implicit = code !== EXPLICIT_DISCONNECT_CODE;

    handleDisconnect(ws.userId || null, implicit ? "implicit" : "explicit");
  } catch (e: any) {
    logError("Error occuring inside ws close event handler");
    logError(e);
  }
};
