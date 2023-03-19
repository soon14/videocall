import { Color, logWithColor } from "../logger";
import { broadcastToRoom, sendToUser } from "../Socket/MessageSenders";
import { MyWebSocket, State } from "../Socket/SocketConnection";
import { MessagesToServer } from "../Socket/SocketTypes";
import { UserId } from "../StateRepository/StateRepository";
import { userToSocketUser } from "../util";
import { disconnectUser } from "./disconnect";
import { handlePong } from "./pongMessage";

export function handleRegister(
  msg: MessagesToServer["register"],
  ws: MyWebSocket
) {
  logWithColor(Color.FgGreen, `handleRegister\n${JSON.stringify(msg)}`);

  if (ws.userId) {
    return handleReconnectingUser(ws.userId);
  }

  const { user: givenUser } = msg;
  const roomId = msg.roomId.toLowerCase();

  const user = State.createUser({ roomId, name: givenUser.name, ws });
  const userId = user.id;
  ws.userId = userId;

  const socketUser = userToSocketUser(user);

  const room = State.addUserToRoom(userId, roomId);

  const otherUsers = room.participants
    .filter((participant) => participant !== userId)
    .map((participant) => userToSocketUser(State.getUserById(participant)));

  // let client know his id
  sendToUser(socketUser, user.id, {
    type: "register",
    userId,
    usersInRoom: otherUsers,
  });

  // Start the ping/pong cycle
  handlePong(userId);

  // let others know that a new user joined the room, so they can send him offers
  broadcastToRoom(socketUser, roomId, {
    type: "user-joined-room",
  });
}

const handleReconnectingUser = (userId: UserId) => {
  logWithColor(Color.FgYellow, "Reconnected user " + userId);

  State.clearDisconnectTimer(userId);
};
