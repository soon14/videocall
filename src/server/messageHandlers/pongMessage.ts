import { State } from "../Socket/SocketConnection";
import { UserId } from "../StateRepository/StateRepository";

export const handlePong = (userId: UserId) => {
  State.clearDisconnectTimer(userId);
};
