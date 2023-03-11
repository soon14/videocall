import { log } from "../logger";
import { RoomId, UserId } from "../StateRepository/StateRepository";
import { MyWebSocket, State } from "./SocketConnection";
import { MessageToClientValues, SocketUser } from "./SocketTypes";

// https://stackoverflow.com/questions/57103834/typescript-omit-a-property-from-all-interfaces-in-a-union-but-keep-the-union-s
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

export function sendToUser<T extends MessageToClientValues>(
  source: SocketUser | null,
  target: UserId | MyWebSocket,
  msg: DistributiveOmit<T, "source">
) {
  const socket =
    typeof target === "string" ? State.getUserById(target).socket : target;

  const fullMessage = {
    ...msg,
    source,
  };

  const msgString = JSON.stringify(fullMessage);

  log(`Sending message of type ${msg.type} to user: ${target}`);
  socket.send(msgString);
}

export const broadcastToRoom = <T extends MessageToClientValues>(
  source: SocketUser,
  roomId: RoomId,
  msg: DistributiveOmit<T, "source">
) => {
  log(`Broadcasting message of type ${msg.type} to room ${roomId}`);
  const room = State.getRoomById(roomId);

  room.participants.forEach((participant) => {
    // TODO: is this a safe comparison?...
    if (source.id !== participant) {
      sendToUser(source, participant, msg);
    }
  });
};
