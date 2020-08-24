import * as express from 'express';
const app = express();
import * as http from 'http';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {Clients, Message} from "./interfaces";

const port = 3000;
const wss = new WebSocket.Server({port});

const clients: Clients = {};

wss.on('listening', () => {
    console.log("websocket server listening on port %d", port);
});

wss.on('connection', (ws) => {
    console.log("client connected");
    const userId = uuidv4();

    // store client in memory
    clients[userId] = {
        name: userId, // can be changed later by the user to something more readable
        socket: ws
    };

    // let client know his id
    sendToOneUser(userId, {
        type: 'register',
        payload: userId
    });

    // let others know that a new user joined the room, so they can send him offers
    broadcast(userId, {
        type: 'user-joined-room',
        source: userId
    });

    ws.on('message', (msg) => {
        const msgJson: Message = JSON.parse(msg);
        const source = msgJson.source;
        if (msgJson.type !== 'new-ice-candidate') {
            console.log(
                '----------------------\n'
                + msgJson.type + '\n'
                + msgJson.source + '\n'
                + msgJson.target
            );
            // console.log(JSON.stringify(msgJson, null, 2));
        }
        if (msgJson.target) {
            sendToOneUser(msgJson.target, msg);
        } else {
            broadcast(source, msg);
        }
        // switch (msgJson.type) {
        //     case "video-offer":
        //         sendToOneUser(msgJson.target, msg);
        //         break;
        //     case "video-answer":
        //         sendToOneUser(msgJson.target, msg);
        //         break;
        //     case "new-ice-candidate":
        //         broadcast(source, msg);
        //         break;
        //     case "hang-up":
        //         broadcast(source, msg);
        //         break;
        //     case "user-joined-room":
        //         broadcast(source, msg);
        //         break;
        //     default:
        //         console.log("unrecognised message:");
        //         console.log(JSON.stringify(msgJson, null, 2));
        //         break;
        // }
    });
});

// broadcast to everyone, but not back to the sender.
function broadcast(source: string, msg: string | Message) {
    // for now, broadcast to all.
    // normally should only be forwarded to people in the same room

    const msgString: string = (typeof msg === 'object') ? JSON.stringify(msg) : msg;
    Object.keys(clients).forEach((username) => {
        if (username !== source) { // do not send back to source
            clients[username].socket.send(msgString);
        }
    });
}

function sendToOneUser(target: string, msg: string | Message) {
    const msgString: string = (typeof msg === 'object') ? JSON.stringify(msg) : msg;
    clients[target].socket.send(msgString);
}

// app.get("/", (req, res) => {
//     res.redirect("room1");
// });
//
// app.get("/:room", (req, res) => {
//     res.render('room', {roomId: req.params.room});
// });
//
// http.createServer(app).listen(port);