import { Request, Response } from "express";
import { Player } from "../../models/Player";
import { games, players } from "../../services/gameService";
import { Game } from "../../models/Game";

// Want to play with random players
export const createGameWithRandom = async (req: Request, res: Response) => {
  const player = new Player();
  players.set(player.id, player);

  res.json({
    message: "User is created.",
    userID: player.id,
    ws: `ws://localhost:8080?userId=${player.id}`,
  });
};

// Want to play with friends (createLink)
export const createGameShareableLink = async (req: Request, res: Response) => {
  const player1 = new Player();
  let player2 = null;
  players.set(player1.id, player1);
  const game = new Game({ player1, player2 });
  games.set(game.id, game);
  player1.currentGame = game.id;

  res.json({
    gameID: game.id,
    message: "User is created.",
    userID: player1.id,
    ws: `ws://localhost:8080?userID=${player1.id}`,
  });
};

// join a game
export const joinGame = async (req: Request, res: Response) => {
  const player = new Player();
  players.set(player.id, player);
  const { gameId } = req.params;

  const game = games.get(gameId);

  if (!game) {
    res.status(404).json({ message: "Game not found." });
    return;
  }

  game.player2 = player;
  player.currentGame = gameId;
  console.log("Game: ", game);

  console.log("player 2 created: ", player.id);

  res.json({
    userID: player.id,
    gameID: gameId,
    ws: `ws://localhost:8080?userID=${player.id}`,
    message: "Game Exists!!",
  });
};
