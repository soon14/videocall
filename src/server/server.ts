import * as WebSocket from "ws";
import express from "express";
import * as http from "http";

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

// const app = express();

// const httpPort = 8080;

// http.createServer(app).listen(httpPort, () => {
//   logWithColor(Color.FgGreen, `HTTP server started on port ${httpPort}`);
// });
