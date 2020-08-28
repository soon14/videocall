import * as express from 'express';
const app = express();
import * as http from 'http';
import * as https from 'https';
import {readFileSync} from "fs";
import * as WebSocket from 'ws';
import {join} from 'path';
import { v4 as uuidv4 } from 'uuid';
import {Clients, Message, Rooms} from "./interfaces";

const socketPort = 3000;
const httpsPort = 443;
const httpPort = 80;

const clients: Clients = {};
const rooms: Rooms = {};

app.use(express.static(join(__dirname, 'client')));
app.use("/test_videos", express.static(join(__dirname, 'test_videos')));

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, '/client/main/index.html'));
});

app.get("/createRoom", (req, res) => {
    res.redirect("/room/" + uuidv4());
});

app.get("/room/:room", (req, res) => {
    res.sendFile(join(__dirname, '/client/room/room.html'));
});

http.createServer(app).listen(httpPort, () => {
    console.log("http server started on port %d", httpPort);
});

// https.createServer({
//     key: readFileSync('server.key'),
//     cert: readFileSync('server.cert')
// }, app).listen(httpsPort, () => {
//     console.log("https server listening on port %d", httpsPort);
// });
//
// const httpsServer = https.createServer({
//     key: readFileSync('server.key'),
//     cert: readFileSync('server.cert')
// }).listen(socketPort);

const wss = new WebSocket.Server({port: socketPort});
wss.on('listening', () => {
    console.log("websocket server listening on port %d", socketPort);
});

wss.on('connection', (ws) => {
    console.log("client connected");

    ws.on('message', (msg) => {
        const msgJson: Message = JSON.parse(msg);
        const source = msgJson.source;

        // for some message types, we need to process some things
        switch(msgJson.type) {
            case "register":
                handleRegister(ws, msgJson);
                break;
            case "disconnect":
                handleDisconnect(source, msg);
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
});

function handleRegister(ws, msg) {
    // if a user is trying to register himself by sending us his room id,
    // which he extracted from his url, we need to process it
    const roomId = msg.payload;

    // generate userId
    const userId = uuidv4();

    clients[userId] = {
        name: userId, // can be changed later by the user to something more readable
        socket: ws,
        room: roomId
    };

    // let client know his id
    sendToOneUser(userId, {
        type: 'register',
        payload: userId
    });

    if (rooms[roomId]) {
        rooms[roomId].push(userId);
    } else {
        rooms[roomId] = [userId];
    }

    // let others know that a new user joined the room, so they can send him offers
    broadcast(userId, {
        type: 'user-joined-room',
        source: userId
    });
}

// TODO: detect implicit disconnect by periodically sending ping signals.
function handleDisconnect(source: string, msg: Message | string) {
    // in case the disconnect was implicit (by exiting the browser), the client did not send
    // a message, so we need to create one ourselves.
    if (typeof msg === 'undefined') {
        msg = {type: 'disconnect', source}
    }
    // let others know
    broadcast(source, msg);

    // delete from room
    const room: string[] = rooms[clients[source].room];
    if (room.length === 1) {
        // delete entire room if user is the sole participant
        delete rooms[clients[source].room];
    } else {
        room.splice(room.indexOf(source), 1);
    }
    // delete client
    clients[source].socket.close();
    delete clients[source];
}

// broadcast to everyone in the same room, except the original sender.
function broadcast(source: string, msg: string | Message) {
    const roomId = clients[source].room;
    const msgString: string = (typeof msg === 'object') ? JSON.stringify(msg) : msg;
    rooms[roomId].forEach((userId) => {
        if (userId !== source) { // do not send back to source
            clients[userId].socket.send(msgString);
        }
    });
}

function sendToOneUser(target: string, msg: string | Message) {
    const msgString: string = (typeof msg === 'object') ? JSON.stringify(msg) : msg;
    clients[target].socket.send(msgString);
}