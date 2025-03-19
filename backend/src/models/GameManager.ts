import { WebSocket } from "ws";
import { INIT_GAME, INIT_WITH_FRIEND, JOIN_GAME, MOVE } from "../messages";
import { Game } from "../models/Game";
import { Player } from "./Player";
import { players } from "../services/gameService";
import { games } from "../services/gameService";

export class GameManager {
  private pendingUser: Player | null;
  // private gameLinks: Map<String, String>;

  constructor() {
    this.pendingUser = null;
    // this.gameLinks = new Map();
  }

  addUser(userId: string, socket: WebSocket) {
    const player = players.get(userId);
    if (!player) return;
    player.socket = socket;
    this.addHandler(player);
  }

  removeUser(userId: string) {
    const player = players.get(userId);
    if (!player || !player.currentGame) return;
    const game = games.get(player.currentGame);
    if (!game) return;

    const player2 = game.player2;

    //delete the game and player
    games.delete(player.currentGame);
    players.delete(userId);

    // stop the game
    if (!player2 || !player2.socket || !player2.currentGame) return;

    player2.socket.send("Opponent Left the match");
    player2.currentGame = null;
  }

  private addHandler(player: Player) {
    if (!player.socket) return null;
    player.socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      // starts game with randoms
      if (message.type === INIT_GAME) {
        if (this.pendingUser) {
          // start game
          const player1 = this.pendingUser;
          const player2 = player;
          const game = new Game({ player1, player2 });
          player1.currentGame = game.id;
          player2.currentGame = game.id;
          games.set(game.id, game);
          this.pendingUser = null;
          console.log("Game started" + game.id);
        } else {
          this.pendingUser = player;
          console.log("Waiting for another player");
        }
      }

      if (message.type === JOIN_GAME) {
        const game = games.get(message.payload.gameID);
        if (!game) return null;
        game.startGame();
        console.log("Game joined" + game.id);
      }

      if (message.type)
        if (message.type === MOVE) {
          // Find the game and update the board
          if (player.currentGame === null) return;
          const game = games.get(player.currentGame);
          if (game) {
            game.makeMoves(player, message.payload.move);
            console.log("moved in: " + game.id);
          }
        }
    });
  }
}
