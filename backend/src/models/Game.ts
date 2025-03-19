import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "../messages";
import { Player } from "../models/Player";
import { WebSocket } from "ws";

export class Game {
  public id: string;
  public player1: Player;
  public player2: Player | null;
  private board: Chess;
  private moves: string[];
  private startTime: Date | null;

  constructor(players: { player1: Player; player2: Player | null }) {
    if (players.player2 === null) {
      this.player1 = players.player1;
      this.player2 = null;
      this.startTime = null;
      this.id = Math.random().toString(36).substr(2, 9);
      this.board = new Chess();
      this.moves = [];
    } else {
      const { player1, player2 } = players;
      this.id = Math.random().toString(36).substr(2, 9);
      this.player1 = player1;
      this.player2 = player2;
      this.board = new Chess();
      this.moves = [];
      this.startTime = new Date();

      if (!this.player1.socket || !this.player2.socket) return;

      // let both know game has started
      this.player1.socket.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "white",
          },
        })
      );
      this.player2.socket.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            color: "black",
          },
        })
      );
    }
  }

  // this function will be used to start game using link
  startGame() {
    this.startTime = new Date();

    if (!this.player2) return;
    if (!this.player1.socket || !this.player2.socket) return;

    // let both know game has started
    this.player1.socket.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "white",
        },
      })
    );
    this.player2.socket.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "black",
        },
      })
    );
  }

  makeMoves(
    player: Player,
    move: {
      from: string;
      to: string;
    }
  ) {
    if (player === this.player1 || player === this.player2) {
      // validate the type of move using zod

      // check if it is the player's turn
      if (this.moves.length % 2 === 0 && player !== this.player1) {
        console.log("Not your turn player 1");
        return;
      }
      if (this.moves.length % 2 === 1 && player !== this.player2) {
        console.log("Not your turn player 2");
        return;
      }

      try {
        this.board.move(move);
        this.moves.push(move.from + " " + move.to);
        console.log(this.board.ascii());
      } catch (error) {
        return;
      }

      if (!this.player2) return;
      if (!this.player1.socket || !this.player2.socket) return;

      // check if the game is over
      if (this.board.isGameOver()) {
        // send the game over message to both players
        this.player1.socket.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: {
              winner: this.board.turn() === "w" ? "black" : "white",
            },
          })
        );
        this.player2?.socket.send(
          JSON.stringify({
            type: GAME_OVER,
            payload: {
              winner: this.board.turn() === "w" ? "black" : "white",
            },
          })
        );
        return;
      }

      if (this.moves.length % 2 === 0) {
        this.player1.socket.send(
          JSON.stringify({
            type: MOVE,
            payload: move,
          })
        );
        console.log("Player 2 did : " + JSON.stringify(move));
        console.log("Player 1's turn now");
      } else {
        this.player2?.socket.send(
          JSON.stringify({
            type: MOVE,
            payload: move,
          })
        );
        console.log("Player 1 did : " + JSON.stringify(move));
        console.log("Player 2's turn now");
      }
    }
  }
}
