import { MyWebSocket } from "../Socket/SocketConnection";

export type Room = {
  name: string;
  participants: UserId[];
};

export type User = {
  id: UserId;
  name: string | null;
  socket: MyWebSocket;
  room: string;
  disconnectTimer: NodeJS.Timeout | null; // id returned by setTimeOut()
  pingpongTimer: NodeJS.Timeout | null; // id returned by setTimeOut()
};

export type UserId = string;
export type RoomId = string;

export type CreateUserArgs = {
  name?: string;
  ws: MyWebSocket;
  roomId: RoomId;
};

export interface StateRepository {
  getUserById(userId: UserId): void;
  findUserById(userId: UserId): User;
  getRoomById(roomId: RoomId): void;

  createUser(args: CreateUserArgs): User;

  deleteUserById(userId: UserId): void;
  deleteRoomById(roomId: RoomId): void;

  clearDisconnectTimer(userId: UserId): void;
  setDisconnectTimer(userId: UserId, callback: Function): void;

  setPingPongTimer(userId: UserId, callback: Function): void;
  clearPingPongTimer(userId: UserId): void;

  addUserToRoom(userId: UserId, roomId: RoomId): Room;
  // Return value indicates if the room was deleted.
  removeUserFromRoom(userId: UserId, roomId: RoomId): boolean;
}
