import { broadcastToRoom } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import { MessagesToServer } from "../Socket/SocketTypes";
import { UserId } from "../StateRepository/StateRepository";
import { userToSocketUser } from "../util";

export const handleChatMessage = (
  msg: MessagesToServer["chatMessage"],
  userId: UserId
) => {
  const user = State.getUserById(userId);
  broadcastToRoom(userToSocketUser(user), user.room, {
    type: "chatMessage",
    text: msg.text,
  });
};
