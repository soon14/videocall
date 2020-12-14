import * as express from "express";
const app = express();
import * as http from "http";
import * as https from "https";
import { readFileSync } from "fs";
import * as WebSocket from "ws";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { Clients, Message, Rooms } from "./interfaces";

const socketPort = 3000;
const httpsPort = 443;
const httpPort = 8080;

const clients: Clients = {};
const rooms: Rooms = {};

app.use(express.static(join(__dirname, "client/build")));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

app.get("/index.html", (req, res) => {
  res.sendFile(join(__dirname, "/client/build/main/index.html"));
});

app.get("/createRoom", (req, res) => {
  res.redirect("room/" + uuidv4());
});

app.get("/room/:room", (req, res) => {
  res.sendFile(join(__dirname, "/client/build/room/room.html"));
});

http.createServer(app).listen(httpPort, () => {
  console.log("http server started on port %d", httpPort);
});

const wss = new WebSocket.Server({ port: socketPort });
wss.on("listening", () => {
  console.log("websocket server listening on port %d", socketPort);
});

wss.on("connection", (ws) => {
  console.log("client connected");

  ws.on("message", (msg) => {
    const msgJson: Message = JSON.parse(msg);
    const source = msgJson.source;

    // for some message types, we need to process some things
    switch (msgJson.type) {
      case "register":
        handleRegister(ws, msgJson);
        break;
      case "disconnect":
        handleDisconnect(msgJson.source, msgJson);
        break;
      // otherwise, simply forward message to other user(s)
      default:
        if (msgJson.target) {
          sendToOneUser(msgJson.target, msg);
        } else {
          broadcast(source, msg);
        }
    }
  });
  ws.on("close", () => {
    if (clients[ws.userId]) {
      console.log("lost connection with " + ws.userId);

      const timeout = 5000; // allow 5 seconds for the user to reconnect
      const disconnectTimer = setTimeout(() => {
        handleDisconnect(ws.userId);
      }, timeout);
      // IMPORTANT: add disconnectTimer to ws object, because I'm too lazy to keep this separate somewhere else.
      clients[ws.userId].disconnectTimer = disconnectTimer;
    }
  });
});


function handleRegister(ws, msg) {
  // a user is trying to register himself by sending us his room id,
  // which he extracted from his url
  const roomId = msg.payload;

  // In case the client is trying to reconnect, he will supply his last known userId.
  // If he was in time, we still have him in memory.
  if (msg.source && clients[msg.source]) {
    console.log("reconnected user " + msg.source);

    // update websocket object associated with this client
    clients[msg.source].socket = ws;

    // bind userId to WebSocket object
    // (this also happens when registering new users)
    ws.userId = msg.source;

    // clear disconnectTimer if present (should be present from ws.close event handler)
    if (clients[msg.source].disconnectTimer) {
      clearTimeout(clients[msg.source].disconnectTimer);
      clients[msg.source].disconnectTimer = null;
    }
    return;
  }

  // If the client is too late to reconnect (or this is a new user), register him properly.

  // generate userId
  const userId = uuidv4();

  clients[userId] = {
    name: userId, // can be changed later by the user to something more readable
    socket: ws,
    room: roomId,
    disconnectTimer: null,
  };

  // IMPORTANT: store userId in socket object, so that we can quickly find the user
  // when we receive an on-close message.
  ws.userId = userId;

  // let client know his id
  sendToOneUser(userId, {
    type: "register",
    payload: userId,
  });

  if (rooms[roomId]) {
    rooms[roomId].push(userId);
    console.log(`added user ${userId} to room ${roomId}`);
  } else {
    rooms[roomId] = [userId];
    console.log(`created room ${roomId} with user ${userId}`);
  }

  // let others know that a new user joined the room, so they can send him offers
  broadcast(userId, {
    type: "user-joined-room",
    source: userId,
  });
}

function handleDisconnect(source: string, msg?: Message | string) {
  console.log("disconnecting user " + source);

  // in case the disconnect was implicit (by exiting the browser), the client did not send
  // a message, so we need to create one ourselves.
  let explicitDisconnect = true;
  let roomId = clients[source].room;
  if (typeof msg === "undefined") {
    explicitDisconnect = false;
    msg = { type: "disconnect", source };
  }
  // let others know
  broadcast(source, msg);
  
  // Free up resources:

  // room is a string array of users in this room
  const room: string[] = rooms[roomId];

  if (room.length === 1) {
    // delete entire room if user is the sole participant
    console.log(`deleting room ${roomId}`);
    delete rooms[roomId];
  } else {
    console.log(`After disconnect of ${source} there are still ${room.length - 1} users in room ${roomId}`);
    room.splice(room.indexOf(source), 1);
  }
  // finally, delete client
  delete clients[source];
}

// broadcast to everyone in the same room, except the original sender.
function broadcast(source: string, msg: string | Message) {
  const roomId = clients[source].room;
  const msgString: string = typeof msg === "object" ? JSON.stringify(msg) : msg;
  rooms[roomId].forEach((userId) => {
    if (userId !== source) {
      // do not send back to source
      clients[userId].socket.send(msgString);
    }
  });
}

function sendToOneUser(target: string, msg: string | Message) {
  const msgString: string = typeof msg === "object" ? JSON.stringify(msg) : msg;
  clients[target].socket.send(msgString);
}
