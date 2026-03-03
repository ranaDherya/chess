import { Chess, Move, Square } from "chess.js";
import { GAME_ENDED, INIT_GAME, MOVE } from "../constants";
import { db } from "../db/db";
import { socketManager } from "../ws/SocketManager";
import { User } from "../ws/User";
import { AuthProvider } from "@prisma/client";
import { ObjectId } from "mongodb";
import { DbMove } from "../types/types";
import { redis } from "../redis/redis";
import { REDIS_MOVE_QUEUE } from "../constants";

type GAME_STATUS =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED"
  | "TIME_UP"
  | "PLAYER_EXIT";
type GAME_RESULT = "WHITE_WINS" | "BLACK_WINS" | "DRAW";

const GAME_TIME_MS = 10 * 60 * 1000; // 10 minutes

export const isPromoting = (chess: Chess, from: Square, to: Square) => {
  if (!from) return false;
  const piece = chess.get(from);
  if (piece?.type !== "p") return false;
  if (piece.color !== chess.turn()) return false;
  if (!["1", "8"].some((it) => to.endsWith(it))) return false;
  return chess
    .moves({ square: from, verbose: true })
    .map((it) => it.to)
    .includes(to);
};

export class Game {
  public gameId: string;
  public whitePlayerId: string;
  public blackPlayerId: string | null;
  public board: Chess;
  private moveCount = 0;
  private timer: NodeJS.Timeout | null = null;
  private moveTimer: NodeJS.Timeout | null = null;
  public result: GAME_RESULT | null = null;
  private player1TimeConsumed = 0;
  private player2TimeConsumed = 0;
  private startTime = new Date(Date.now());
  private lastMoveTime = new Date(Date.now());
  private moveList: string[];

  constructor(
    whitePlayerId: string,
    blackPlayerId: string | null,
    gameId?: string,
    startTime?: Date,
  ) {
    this.whitePlayerId = whitePlayerId;
    this.blackPlayerId = blackPlayerId;
    this.board = new Chess();
    this.gameId = gameId ?? new ObjectId().toString();
    if (startTime) {
      this.startTime = startTime;
      this.lastMoveTime = startTime;
    }
    this.moveList = [];
  }

  // Re-Sync Game
  seedMoves(
    moves: {
      id: string;
      gameId: string;
      moveNumber: number;
      from: string;
      to: string;
      comments: string | null;
      timeTaken: number | null;
      createdAt: Date;
    }[],
  ) {
    moves.forEach((move) => {
      // Moves the piece on the board
      // and checks if the move is a promotion
      const moveResult = isPromoting(
        this.board,
        move.from as Square,
        move.to as Square,
      )
        ? this.board.move({
            from: move.from,
            to: move.to,
            promotion: "q",
          })
        : this.board.move({
            from: move.from,
            to: move.to,
          });

      // Add to moveList if move was successful
      if (moveResult) {
        this.moveList.push(moveResult.san);
      }
    });

    // Adds the moves to the game object
    this.moveCount = moves.length;
    if (moves[moves.length - 1]) {
      this.lastMoveTime = moves[moves.length - 1].createdAt;
    }

    // Adds time taken for each move to the player time consumed
    // and resets the timer for each player
    moves.map((move, index) => {
      if (move.timeTaken) {
        if (index % 2 === 0) {
          this.player1TimeConsumed += move.timeTaken;
        } else {
          this.player2TimeConsumed += move.timeTaken;
        }
      }
    });
    this.resetAbandonTimer();
    this.resetMoveTimer();
  }

  // Update Second Player Id
  async updateSecondPlayer(blackPlayerId: string) {
    this.blackPlayerId = blackPlayerId;

    // Get Users for the game
    const users = await db.user.findMany({
      where: {
        id: {
          in: [this.whitePlayerId, this.blackPlayerId ?? ""],
        },
      },
    });

    // Create game in db
    try {
      await this.createGameInDb();
    } catch (e) {
      console.error(e);
      return;
    }

    // Assign White and Black to players
    const WhitePlayer = users.find((user) => user.id === this.whitePlayerId);
    const BlackPlayer = users.find((user) => user.id === this.blackPlayerId);

    // Game is now in progress: start timers
    this.resetAbandonTimer();
    this.resetMoveTimer();

    // Sends socket message to all in game (both players + spectators)
    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          whitePlayer: {
            name: WhitePlayer?.name,
            id: this.whitePlayerId,
            isGuest: WhitePlayer?.provider === AuthProvider.GUEST,
            timeConsumed: 0,
          },
          blackPlayer: {
            name: BlackPlayer?.name,
            id: this.blackPlayerId,
            isGuest: BlackPlayer?.provider === AuthProvider.GUEST,
            timeConsumed: 0,
          },
          startTime: this.startTime,
          moveList: [],
          timePerPlayer: 600000,
          fen: this.board.fen(),
          moves: [],
          gameStarted: true, // Clock and moves allowed from now
        },
      }),
    );
  }

  // Create game in db (only when both players are set)
  async createGameInDb() {
    if (!this.blackPlayerId) {
      throw new Error("Cannot create game in DB without black player");
    }
    this.startTime = new Date(Date.now());
    this.lastMoveTime = this.startTime;

    const game = await db.game.create({
      data: {
        id: this.gameId,
        timeControl: "CLASSICAL",
        status: "IN_PROGRESS",
        startAt: this.startTime,
        currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        whitePlayer: {
          connect: {
            id: this.whitePlayerId,
          },
        },
        blackPlayer: {
          connect: {
            id: this.blackPlayerId,
          },
        },
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    this.gameId = game.id;
  }

  // Add Moves to DB
  async addMovesToDb(move: DbMove, moveTimestamp: Date) {
    await db.$transaction([
      db.move.create({
        data: {
          gameId: this.gameId,
          moveNumber: this.moveCount + 1,
          from: move.from,
          to: move.to,
          after: move.after,
          before: move.before,
          createdAt: moveTimestamp,
          timeTaken: moveTimestamp.getTime() - this.lastMoveTime.getTime(),
          san: move.san,
        },
      }),
      db.game.update({
        data: {
          currentFen: move.after,
        },
        where: {
          id: this.gameId,
        },
      }),
    ]);
  }

  // True when only white has joined (waiting for second player). No moves or timers allowed.
  isWaitingForSecondPlayer(): boolean {
    return this.blackPlayerId === null;
  }

  // Move Piece on Board
  async makeMove(user: User, move: Move) {
    // No moves until both players have joined
    if (this.isWaitingForSecondPlayer()) {
      return;
    }

    // validate the type of move
    if (this.board.turn() === "w" && user.userId !== this.whitePlayerId) {
      return;
    }

    if (this.board.turn() === "b" && user.userId !== this.blackPlayerId) {
      return;
    }

    if (this.result) {
      console.error(
        `User ${user.userId} is making a move post game completion`,
      );
      return;
    }
    const moveTimestamp = new Date(Date.now());

    // Get FEN before move
    const beforeFen = this.board.fen();
    let moveResult;
    try {
      if (isPromoting(this.board, move.from, move.to)) {
        moveResult = this.board.move({
          from: move.from,
          to: move.to,
          promotion: "q",
        });
      } else {
        moveResult = this.board.move({
          from: move.from,
          to: move.to,
        });
      }
      this.moveList.push(moveResult.san);
    } catch (error) {
      console.error("Error while making move", error);
      return;
    }

    // Get FEN after move
    const afterFen = this.board.fen();

    // Build the move object for DB
    const dbMove: DbMove = {
      from: move.from,
      to: move.to,
      before: beforeFen,
      after: afterFen,
      san: moveResult?.san || "",
    };

    const redisPayload = {
      type: "MOVE_EVENT",
      gameId: this.gameId,
      moveNumber: this.moveCount + 1,
      move: dbMove,
      createdAt: moveTimestamp.toISOString(),
      timeTaken: moveTimestamp.getTime() - this.lastMoveTime.getTime(),
    };
    // Push to Redis queue
    await redis.rPush(REDIS_MOVE_QUEUE, JSON.stringify(redisPayload));

    // Flipped player turn because move already happened
    if (this.board.turn() === "b") {
      this.player1TimeConsumed +=
        moveTimestamp.getTime() - this.lastMoveTime.getTime();
    }
    if (this.board.turn() === "w") {
      this.player2TimeConsumed +=
        moveTimestamp.getTime() - this.lastMoveTime.getTime();
    }

    // await this.addMovesToDb(dbMove, moveTimestamp);
    this.resetAbandonTimer();
    this.resetMoveTimer();

    this.lastMoveTime = moveTimestamp;

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: MOVE,
        payload: {
          move: {
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          },
          fen: afterFen,
          playerTurn: this.board.turn(),
          player1TimeConsumed: this.player1TimeConsumed,
          player2TimeConsumed: this.player2TimeConsumed,
          timePerPlayer: 600000,
          moveList: this.moveList,
          gameId: this.gameId,
        },
      }),
    );

    if (this.board.isGameOver()) {
      const result = this.board.isDraw()
        ? "DRAW"
        : this.board.turn() === "b"
          ? "WHITE_WINS"
          : "BLACK_WINS";

      this.endGame("COMPLETED", result);
    }

    this.moveCount++;
  }

  getPlayer1TimeConsumed() {
    if (this.board.turn() === "w") {
      return (
        this.player1TimeConsumed +
        (new Date(Date.now()).getTime() - this.lastMoveTime.getTime())
      );
    }
    return this.player1TimeConsumed;
  }

  getPlayer2TimeConsumed() {
    if (this.board.turn() === "b") {
      return (
        this.player2TimeConsumed +
        (new Date(Date.now()).getTime() - this.lastMoveTime.getTime())
      );
    }
    return this.player2TimeConsumed;
  }

  getMoveList() {
    return this.moveList;
  }

  // Reset Timers
  async resetAbandonTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.endGame(
        "ABANDONED",
        this.board.turn() === "b" ? "WHITE_WINS" : "BLACK_WINS",
      );
    }, 60 * 1000);
  }

  async resetMoveTimer() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
    }
    const turn = this.board.turn();
    const timeLeft =
      GAME_TIME_MS -
      (turn === "w" ? this.player1TimeConsumed : this.player2TimeConsumed);

    this.moveTimer = setTimeout(() => {
      this.endGame("TIME_UP", turn === "b" ? "WHITE_WINS" : "BLACK_WINS");
    }, timeLeft);
  }

  // User exits the game
  async exitGame(user: User) {
    this.endGame(
      "PLAYER_EXIT",
      user.userId === this.blackPlayerId ? "WHITE_WINS" : "BLACK_WINS",
    );
  }

  // End Game – set result immediately so GameManager can clean up; always broadcast so frontend shows game over
  async endGame(status: GAME_STATUS, result: GAME_RESULT) {
    this.result = result;
    this.clearTimer();
    this.clearMoveTimer();

    let payload: {
      result: GAME_RESULT;
      status: GAME_STATUS;
      moves: unknown[];
      blackPlayer: { id: string; name: string | null };
      whitePlayer: { id: string; name: string | null };
    } = {
      result,
      status,
      moves: [],
      blackPlayer: { id: "", name: null },
      whitePlayer: { id: "", name: null },
    };

    try {
      const updatedGame = await db.game.update({
        data: { status, result },
        where: { id: this.gameId },
        include: {
          moves: { orderBy: { moveNumber: "asc" } },
          blackPlayer: true,
          whitePlayer: true,
        },
      });
      payload = {
        result,
        status,
        moves: updatedGame.moves,
        blackPlayer: {
          id: updatedGame.blackPlayer.id,
          name: updatedGame.blackPlayer.name,
        },
        whitePlayer: {
          id: updatedGame.whitePlayer.id,
          name: updatedGame.whitePlayer.name,
        },
      };
    } catch (e) {
      console.error("endGame: db update failed (game may not exist in DB yet)", e);
    }

    socketManager.broadcast(
      this.gameId,
      JSON.stringify({
        type: GAME_ENDED,
        payload,
      }),
    );
  }

  // Move and Abandon Timers
  clearMoveTimer() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  }

  setTimer(timer: NodeJS.Timeout) {
    this.timer = timer;
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }
}
