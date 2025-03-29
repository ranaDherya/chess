import { Player } from "./Player";
import { Game } from "./Game";

class GameManager {
  private pendingUser: Player | null;
  private players: Map<string, Player>;
  private games: Map<string, Game>;
  private static instance: GameManager | null = null;

  private constructor() {
    this.pendingUser = null;
    this.players = new Map();
    this.games = new Map();
  }

  // Singleton instance
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  // Game Manager Methods

  public addUser(userId: string) {}
}

export const gameManager = GameManager.getInstance();
