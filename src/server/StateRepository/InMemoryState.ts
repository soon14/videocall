import { Color, logError, logWithColor } from "../logger";
import { generateUserId } from "../util";
import {
  CreateUserArgs,
  Room,
  RoomId,
  StateRepository,
  User,
  UserId,
} from "./StateRepository";

interface Users {
  [userId: string]: User;
}

interface Rooms {
  [roomId: string]: Room;
}

export class InMemoryState implements StateRepository {
  private readonly DISCONNECT_TIMEOUT = 5000;
  private readonly PINGPONG_TIMEOUT = 20000;

  users: Users = {};
  rooms: Rooms = {};

  getUserById(userId: UserId) {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error("User not found: " + userId);
    }
    return user;
  }

  findUserById(userId: UserId) {
    return this.users[userId] ?? null;
  }

  getRoomById(roomId: RoomId) {
    const room = this.rooms[roomId];
    if (!room) {
      throw new Error("Room not found: " + roomId);
    }
    return room;
  }

  createUser({ name: nickname, ws, roomId }: CreateUserArgs): User {
    const userId = generateUserId();

    this.users[userId] = {
      id: userId,
      name: nickname || null,
      socket: ws,
      room: roomId,
      disconnectTimer: null,
      pingpongTimer: null,
    };

    return this.users[userId];
  }

  clearDisconnectTimer(userId: UserId) {
    const user = this.findUserById(userId);
    if (!user) {
      return;
    }

    const disconnectTimer = user.disconnectTimer;

    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      user.disconnectTimer = null;
    }
  }

  setDisconnectTimer(userId: UserId, callback: Function) {
    this.clearDisconnectTimer(userId);
    const user = this.findUserById(userId);
    if (!user) {
      return;
    }

    const disconnectTimer = setTimeout(() => {
      callback();
    }, this.DISCONNECT_TIMEOUT);

    user.disconnectTimer = disconnectTimer;
  }

  clearPingPongTimer(userId: string): void {
    const user = this.findUserById(userId);
    if (!user) {
      return;
    }

    const timer = user.pingpongTimer;

    if (timer) {
      clearTimeout(timer);
      user.pingpongTimer = null;
    }
  }

  setPingPongTimer(userId: string, callback: Function): void {
    this.clearPingPongTimer(userId);
    const user = this.findUserById(userId);
    if (!user) {
      return;
    }

    const timer = setTimeout(() => {
      callback();
    }, this.PINGPONG_TIMEOUT);

    user.pingpongTimer = timer;
  }

  addUserToRoom(userId: string, roomId: string): Room {
    let room = this.rooms[roomId];

    if (room) {
      this.rooms[roomId].participants.push(userId);
      logWithColor(
        Color.FgYellow,
        `Added user ${userId} to room ${roomId}, now ${room.participants.length} users in room`
      );
    } else {
      this.rooms[roomId] = { name: "", participants: [userId] };
      logWithColor(
        Color.FgYellow,
        `Created room ${roomId} with user ${userId}`
      );
    }

    return this.rooms[roomId];
  }

  removeUserFromRoom(userId: string, roomId: string): boolean {
    logWithColor(
      Color.FgMagenta,
      `Removing user ${userId} from room: ${roomId}`
    );

    // Get user just to check if he exists.
    this.getUserById(userId);

    const room = this.getRoomById(roomId);

    // TODO: check if user is actually in this room.

    // Clear disconnect timer if there was any.
    this.clearDisconnectTimer(userId);

    // Check this just in case...
    if (room.participants.length < 1) {
      logError(`Tried to delete user ${userId} from EMPTY room ${roomId}`);
      this.deleteRoomById(roomId);
      return true;
    }

    // Delete the user from the room.
    room.participants.splice(room.participants.indexOf(userId), 1);

    if (room.participants.length < 1) {
      this.deleteRoomById(roomId);
      return true;
    }

    return false;
  }

  deleteRoomById(roomId: RoomId) {
    logWithColor(Color.FgMagenta, `Deleting room: ${roomId}`);
    delete this.rooms[roomId];
  }

  deleteUserById(userId: string): void {
    logWithColor(Color.FgMagenta, `Deleting user: ${userId}`);
    delete this.users[userId];
  }
}
