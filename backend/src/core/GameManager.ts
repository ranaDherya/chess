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
  CREATE_GAME,
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
  SURRENDER,
  SPECTATE,
  ROLE_CHOICE,
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
    // Prevent duplicate handlers
    if (!(user.socket as any)._handlerAdded) {
      this.addHandler(user);
      (user.socket as any)._handlerAdded = true;
    }
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
      try {
        const message = JSON.parse(data.toString());
        // INIT_GAME
        if (message.type === INIT_GAME) {
          try {
            if (this.pendingGameId) {
              const game = this.games.get(this.pendingGameId);
              if (!game) {
                user.socket.send(
                  JSON.stringify({
                    type: GAME_ALERT,
                    payload: { message: "Game not found!" },
                  }),
                );
                return;
              }
              if (user.userId === game.whitePlayerId) {
                user.socket.send(
                  JSON.stringify({
                    type: GAME_ALERT,
                    payload: { message: "Cannot join your own game!" },
                  }),
                );
                return;
              }
              socketManager.addUser(user, game.gameId);
              await game.updateSecondPlayer(user.userId);
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
                  payload: {
                    gameId: game.gameId,
                  },
                }),
              );
            }
          } catch (error) {
            console.error("Error handling INIT_GAME:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error initializing game" },
              }),
            );
          }
        }

        if (message.type === CREATE_GAME) {
          try {
            const game = new Game(user.userId, null);
            this.games.set(game.gameId, game);
            socketManager.addUser(user, game.gameId);
            // Creator waits for second player: no clock, no moves allowed
            user.socket.send(
              JSON.stringify({
                type: GAME_JOINED,
                payload: {
                  gameId: game.gameId,
                  fen: game.board.fen(),
                  moves: [],
                  moveList: game.getMoveList(),
                  blackPlayer: null,
                  whitePlayer: {
                    id: user.userId,
                    name: "",
                  },
                  player1TimeConsumed: 0,
                  player2TimeConsumed: 0,
                  timePerPlayer: 600000,
                  playerTurn: "w",
                  playerColor: "w",
                  waitingForOpponent: true, // No clock, no moves until second player joins
                },
              }),
            );
          } catch (error) {
            console.error("Error handling CREATE_GAME:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error creating game" },
              }),
            );
          }
        }

        if (message.type === MOVE) {
          try {
            const gameId = message.payload.gameId;
            const game = this.games.get(gameId);
            if (!game) {
              user.socket.send(
                JSON.stringify({
                  type: GAME_ALERT,
                  payload: { message: "Game not found!" },
                }),
              );
              return;
            }

            game.makeMove(user, message.payload.move);
            if (game.result) {
              this.removeGame(game.gameId);
            }
          } catch (error) {
            console.error("Error handling MOVE:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error making move" },
              }),
            );
          }
        }

        if (message.type === EXIT_GAME) {
          try {
            const gameId = message.payload.gameId;
            const game = this.games.get(gameId);

            if (game) {
              game.exitGame(user);
              this.removeGame(game.gameId);
            }
          } catch (error) {
            console.error("Error handling EXIT_GAME:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error exiting game" },
              }),
            );
          }
        }

        if (message.type === SURRENDER) {
          try {
            const gameId = message.payload.gameId;
            const game = this.games.get(gameId);

            if (!game) {
              user.socket.send(
                JSON.stringify({
                  type: GAME_ALERT,
                  payload: { message: "Game not found!" },
                }),
              );
              return;
            }

            // Determine winner based on who surrendered
            const isWhiteSurrendering = user.userId === game.whitePlayerId;
            const result = isWhiteSurrendering ? "BLACK_WINS" : "WHITE_WINS";

            await game.endGame("COMPLETED", result);
            this.removeGame(gameId);
          } catch (error) {
            console.error("Error handling SURRENDER:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error processing surrender" },
              }),
            );
          }
        }

        if (message.type === JOIN_GAME) {
          try {
            const gameId = message.payload.gameId;
            if (!gameId) return;

            const availableGame = this.games.get(gameId);

            // Game exists only in memory (white created, not yet in DB)
            if (availableGame?.isWaitingForSecondPlayer()) {
              socketManager.addUser(user, gameId);
              const isCreator = user.userId === availableGame.whitePlayerId;
              user.socket.send(
                JSON.stringify({
                  type: GAME_JOINED,
                  payload: {
                    gameId,
                    fen: availableGame.board.fen(),
                    moves: [],
                    moveList: availableGame.getMoveList(),
                    blackPlayer: null,
                    whitePlayer: { id: availableGame.whitePlayerId, name: "" },
                    player1TimeConsumed: 0,
                    player2TimeConsumed: 0,
                    timePerPlayer: 600000,
                    playerTurn: "w",
                    playerColor: isCreator ? "w" : null,
                    showRoleChoice: !isCreator, // Only ask "join as player or spectate" if they're not the creator
                    waitingForOpponent: true,
                  },
                }),
              );
              return;
            }

            const gameFromDb = await db.game.findUnique({
              where: { id: gameId },
              include: {
                moves: { orderBy: { moveNumber: "asc" } },
                blackPlayer: true,
                whitePlayer: true,
              },
            });

            if (!gameFromDb) {
              user.socket.send(
                JSON.stringify({
                  type: GAME_NOT_FOUND,
                }),
              );
              return;
            }

            // If game is already ended, send as spectator
            if (gameFromDb.status !== GameStatus.IN_PROGRESS) {
              socketManager.addUser(user, gameId);
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
                }),
              );
              return;
            }

            // If game is in progress, add user as spectator
            socketManager.addUser(user, gameId);

            // If game is in memory and in progress - show as spectator
            if (availableGame) {
              user.socket.send(
                JSON.stringify({
                  type: GAME_JOINED,
                  payload: {
                    gameId,
                    fen: availableGame.board.fen(),
                    moves: [],
                    moveList: availableGame.getMoveList(),
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
                    timePerPlayer: 600000,
                    playerTurn: availableGame.board.turn() === "w" ? "w" : "b",
                    playerColor: null,
                    waitingForOpponent: false,
                  },
                }),
              );
              return;
            }

            // Game not in memory but in DB with no black player yet (e.g. server restarted)
            if (!availableGame && !gameFromDb.blackPlayerId) {
              const game = new Game(
                gameFromDb.whitePlayerId!,
                null,
                gameFromDb.id,
                gameFromDb.startAt,
              );
              game.seedMoves(gameFromDb.moves || []);
              this.games.set(gameId, game);

              user.socket.send(
                JSON.stringify({
                  type: GAME_JOINED,
                  payload: {
                    gameId,
                    fen: game.board.fen(),
                    moves: [],
                    moveList: game.getMoveList(),
                    blackPlayer: null,
                    whitePlayer: {
                      id: gameFromDb.whitePlayerId,
                      name: gameFromDb.whitePlayer.name,
                    },
                    player1TimeConsumed: 0,
                    player2TimeConsumed: 0,
                    timePerPlayer: 600000,
                    playerTurn: "w",
                    playerColor: null,
                    showRoleChoice: true,
                    waitingForOpponent: true,
                  },
                }),
              );
              return;
            }

            // Game has both players but not in memory - recreate and add to manager
            const game = new Game(
              gameFromDb.whitePlayerId!,
              gameFromDb.blackPlayerId!,
              gameFromDb.id,
              gameFromDb.startAt,
            );
            game.seedMoves(gameFromDb.moves || []);
            this.games.set(gameId, game);

            user.socket.send(
              JSON.stringify({
                type: GAME_JOINED,
                payload: {
                  gameId,
                  fen: game.board.fen(),
                  moves: gameFromDb.moves,
                  moveList: game.getMoveList(),
                  blackPlayer: {
                    id: gameFromDb.blackPlayer.id,
                    name: gameFromDb.blackPlayer.name,
                  },
                  whitePlayer: {
                    id: gameFromDb.whitePlayer.id,
                    name: gameFromDb.whitePlayer.name,
                  },
                  player1TimeConsumed: game.getPlayer1TimeConsumed(),
                  player2TimeConsumed: game.getPlayer2TimeConsumed(),
                  timePerPlayer: 600000,
                  playerTurn: game.board.turn() === "w" ? "w" : "b",
                  playerColor: null,
                  waitingForOpponent: false,
                },
              }),
            );
          } catch (error) {
            console.error("Error handling JOIN_GAME:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error joining game" },
              }),
            );
          }
        }

        if (message.type === SPECTATE) {
          try {
            const gameId = message.payload.gameId;
            const action = message.payload.action; // "spectate" or "play"
            const game = this.games.get(gameId);

            if (action === "spectate") {
              // User chose to spectate: send current state (game still waiting for black)
              user.socket.send(
                JSON.stringify({
                  type: GAME_JOINED,
                  payload: {
                    gameId,
                    fen: game?.board.fen() ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    moves: [],
                    moveList: game?.getMoveList() ?? [],
                    blackPlayer: null,
                    whitePlayer: game ? { id: game.whitePlayerId, name: "" } : null,
                    player1TimeConsumed: 0,
                    player2TimeConsumed: 0,
                    timePerPlayer: 600000,
                    playerTurn: "w",
                    playerColor: null,
                    waitingForOpponent: true,
                  },
                }),
              );
            } else if (action === "play") {
              // User wants to join as second player; updateSecondPlayer broadcasts INIT_GAME to all
              if (!game) {
                user.socket.send(
                  JSON.stringify({
                    type: GAME_ALERT,
                    payload: { message: "Game not found!" },
                  }),
                );
                return;
              }
              if (!game.isWaitingForSecondPlayer()) {
                user.socket.send(
                  JSON.stringify({
                    type: GAME_ALERT,
                    payload: { message: "This game already has two players." },
                  }),
                );
                return;
              }
              await game.updateSecondPlayer(user.userId);
            }
          } catch (error) {
            console.error("Error handling SPECTATE:", error);
            user.socket.send(
              JSON.stringify({
                type: GAME_ALERT,
                payload: { message: "Error processing spectate action" },
              }),
            );
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        try {
          user.socket.send(
            JSON.stringify({
              type: GAME_ALERT,
              payload: {
                message: "An error occurred while processing your request",
              },
            }),
          );
        } catch (sendError) {
          console.error("Error sending error message to client:", sendError);
        }
      }
    });
  }
}

export const gameManager = GameManager.getInstance();
