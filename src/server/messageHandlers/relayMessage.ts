import { sendToUser } from "../Socket/MessageSenders";
import { State } from "../Socket/SocketConnection";
import { RelayMessages } from "../Socket/SocketTypes";
import { UserId } from "../StateRepository/StateRepository";
import { userToSocketUser } from "../util";

export const relayMessage = (
  msg: RelayMessages[keyof RelayMessages],
  userId: UserId
) => {
  const { target, ..._ } = msg;
  sendToUser(userToSocketUser(State.getUserById(userId)), msg.target, msg);
};
