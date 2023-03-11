import * as WebSocket from "ws";
import { Color, logWithColor } from "../logger";
import { InMemoryState } from "../StateRepository/InMemoryState";
import { handleMessage } from "./MessageHandler";
import { handleSocketClose } from "./SocketClosedHandler";

export const State = new InMemoryState();

export const initWsServer = (wss: WebSocket.Server) => {
  wss.on("connection", (ws: MyWebSocket) => {
    logWithColor(Color.FgYellow, "WebSocket connected");

    ws.on("message", (msg: string) => handleMessage(msg, ws));

    ws.on("close", (code) => handleSocketClose(code, ws));
  });
};

export interface MyWebSocket extends WebSocket.WebSocket {
  userId?: string;
}
