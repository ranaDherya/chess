import { WebSocket } from "ws";
import { Game, isPromoting } from "./Game";
import { User } from "../ws/User";
import { db } from "../db/db";
import { socketManager } from "../ws/SocketManager";
import { Square } from "chess.js";
import { GameStatus } from "@prisma/client";
import {
  GAME_OVER,
  INIT_GAME,
  JOIN_GAME,
  MOVE,
  OPPONENT_DISCONNECTED,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ALERT,
  GAME_ADDED,
  GAME_ENDED,
  EXIT_GAME,
} from "../constants";

class GameManager {
  private pendingGameId: string | null;
  private users: Map<WebSocket, User>;
  private games: Map<string, Game>;
  private static instance: GameManager | null = null;

  private constructor() {
    this.pendingGameId = null;
    this.users = new Map();
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

  // adds user and a handler to the user
  addUser(user: User) {
    this.users.set(user.socket, user);
    this.addHandler(user);
  }

  // remove user
  removeUser(socket: WebSocket) {
    const user = this.users.get(socket);
    if (!user) {
      console.error("User not found?");
      return;
    }
    this.users.delete(socket);
    socketManager.removeUser(user);
  }

  // remove game
  removeGame(gameId: string) {
    this.games.delete(gameId);
  }

  // Web Socket Handler
  private addHandler(user: User) {
    user.socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      // INIT_GAME
      if (message.type === INIT_GAME) {
        // Pending game is available
        if (this.pendingGameId) {
          const game = this.games.get(this.pendingGameId);
          if (!game) {
            console.error("Game not found!");
            return;
          }
          if (user.userId === game.whitePlayerId) {
            socketManager.broadcast(
              game.gameId,
              JSON.stringify({
                type: GAME_ALERT,
                payload: {
                  message: "Trying to Connect with yourself?",
                },
              })
            );
            console.log("message broadcasted");
            return;
          }
          socketManager.addUser(user, game.gameId);
          await game?.updateSecondPlayer(user.userId);
          this.pendingGameId = null;
        } else {
          const game = new Game(user.userId, null);
          this.games.set(game.gameId, game);
          this.pendingGameId = game.gameId;
          socketManager.addUser(user, game.gameId);
          socketManager.broadcast(
            game.gameId,
            JSON.stringify({
              type: GAME_ADDED,
              gameId: game.gameId,
            })
          );
        }
      }

      if (message.type === MOVE) {
        const gameId = message.payload.gameId;
        const game = this.games.get(gameId);
        if (game) {
          game.makeMove(user, message.payload.move);
          if (game.result) {
            this.removeGame(game.gameId);
          }
        }
      }

      if (message.type === EXIT_GAME) {
        const gameId = message.payload.gameId;
        const game = this.games.get(gameId);

        if (game) {
          game.exitGame(user);
          this.removeGame(game.gameId);
        }
      }

      if (message.type === JOIN_GAME) {
        const gameId = message.payload.gameId;
        if (!gameId) return;

        let availableGame = this.games.get(gameId);
        const gameFromDb = await db.game.findUnique({
          where: {
            id: gameId,
          },
          include: {
            moves: {
              orderBy: {
                moveNumber: "asc",
              },
            },
            blackPlayer: true,
            whitePlayer: true,
          },
        });

        // If game is created but no second player
        if (availableGame && !availableGame.blackPlayerId) {
          socketManager.addUser(user, availableGame.gameId);
          await availableGame.updateSecondPlayer(user.userId);
          return;
        }
        if (!gameFromDb) {
          user.socket.send(
            JSON.stringify({
              type: GAME_NOT_FOUND,
            })
          );
          return;
        }

        // If game is already ended
        if (gameFromDb.status !== GameStatus.IN_PROGRESS) {
          user.socket.send(
            JSON.stringify({
              type: GAME_ENDED,
              payload: {
                result: gameFromDb.result,
                status: gameFromDb.status,
                moves: gameFromDb.moves,
                blackPlayer: {
                  id: gameFromDb.blackPlayer.id,
                  name: gameFromDb.blackPlayer.name,
                },
                whitePlayer: {
                  id: gameFromDb.whitePlayer.id,
                  name: gameFromDb.whitePlayer.name,
                },
              },
            })
          );
          return;
        }

        // If game is not available in server get from db and create game
        if (!availableGame) {
          const game = new Game(
            gameFromDb?.whitePlayerId!,
            gameFromDb?.blackPlayerId!,
            gameFromDb.id,
            gameFromDb.startAt
          );
          game.seedMoves(gameFromDb?.moves || []);
          this.games.set(gameId, game);
          availableGame = game;
        }

        user.socket.send(
          JSON.stringify({
            type: GAME_JOINED,
            payload: {
              gameId,
              moves: gameFromDb.moves,
              blackPlayer: {
                id: gameFromDb.blackPlayer.id,
                name: gameFromDb.blackPlayer.name,
              },
              whitePlayer: {
                id: gameFromDb.whitePlayer.id,
                name: gameFromDb.whitePlayer.name,
              },
              player1TimeConsumed: availableGame.getPlayer1TimeConsumed(),
              player2TimeConsumed: availableGame.getPlayer2TimeConsumed(),
            },
          })
        );

        socketManager.addUser(user, gameId);
      }
    });
  }
}
export const gameManager = GameManager.getInstance();
