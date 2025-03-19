import { WebSocket } from "ws";

export interface IPlayer {
  id: string;
  socket: WebSocket | null;
  currentGame: string | null;
}

export class Player implements IPlayer {
  public id: string;
  public socket: WebSocket | null;
  public currentGame: string | null;
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.socket = null;
    this.currentGame = null;
  }

  getUserId() {
    return this.id;
  }

  addSocket(socket: WebSocket) {
    this.socket = socket;
  }

  assignGame(gameId: string) {
    this.currentGame = gameId;
  }
}
