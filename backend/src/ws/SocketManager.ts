import { User } from "./User";

class SocketManager {
  private static instance: SocketManager;
  private interestedSockets: Map<string, User[]>;
  private userRoomMappping: Map<string, string>;

  private constructor() {
    this.interestedSockets = new Map<string, User[]>();
    this.userRoomMappping = new Map<string, string>();
  }

  static getInstance() {
    if (SocketManager.instance) {
      return SocketManager.instance;
    }

    SocketManager.instance = new SocketManager();
    return SocketManager.instance;
  }

  // Add user to the room and map it to the userId
  // This is used to send messages to all users in the room
  addUser(user: User, roomId: string) {
    if (!this.interestedSockets.has(roomId)) {
      this.interestedSockets.set(roomId, []);
    }

    const sockets = this.interestedSockets.get(roomId)!;
    sockets.push(user);
    this.userRoomMappping.set(user.userId, roomId);
  }

  // Broadcast message to all users in the room
  broadcast(roomId: string, message: string) {
    const users = this.interestedSockets.get(roomId);
    if (!users) {
      console.error("No users in room!!!");
      return;
    }

    users.forEach((user) => {
      user.socket.send(message);
    });
  }

  // Remove user from the room and delete the mapping
  removeUser(user: User) {
    const roomId = this.userRoomMappping.get(user.userId);
    if (!roomId) {
      console.error("User was not in any room!!!");
      return;
    }

    const room = this.interestedSockets.get(roomId) || [];
    const remainingUsers = room.filter((u) => u.userId !== user.userId);
    this.interestedSockets.set(roomId, remainingUsers);

    if (this.interestedSockets.get(roomId)?.length === 0) {
      this.interestedSockets.delete(roomId);
    }

    this.userRoomMappping.delete(user.userId);
  }
}

// Export the singleton instance of SocketManager
export const socketManager = SocketManager.getInstance();
