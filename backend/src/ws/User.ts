import { WebSocket } from "ws";
import { UserJwtClaims } from "../types/types";
import { ObjectId } from "mongodb";

export class User {
  public socket: WebSocket;
  public userId: string;
  public name: string;
  public isGuest: boolean;
  public id: string;

  constructor(socket: WebSocket, UserJWTClaims: UserJwtClaims) {
    this.socket = socket;
    this.userId = UserJWTClaims.userId;
    this.name = UserJWTClaims.name;
    this.isGuest = UserJWTClaims.isGuest || false;
    this.id = new ObjectId().toString();
  }
}
