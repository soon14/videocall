import * as WebSocket from "ws";

import { Color, logWithColor } from "./logger";
import { initWsServer } from "./Socket/SocketConnection";

const socketPort = 9120;

const wss = new WebSocket.Server({ port: socketPort });

wss.on("listening", () => {
  logWithColor(
    Color.FgGreen,
    `websocket server listening on port ${socketPort}`
  );
});

initWsServer(wss);
