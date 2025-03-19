import { Request, Response } from "express";
import { Player } from "../models/Player";
import { games, players } from "../services/gameService";
import { Game } from "../models/Game";

// Want to play with random players
export const createGameWithRandom = async (req: Request, res: Response) => {
  const player = new Player();
  players.set(player.id, player);

  res.json({
    message: "User is created.",
    userId: player.id,
    ws: "ws://localhost:8080",
  });
};

// Want to play with friends (createLink)
export const createGameShareableLink = async (req: Request, res: Response) => {
  const player1 = new Player();
  let player2 = null;
  players.set(player1.id, player1);
  const game = new Game({ player1, player2 });
  games.set(game.id, game);
  const gameUrl = `localhost:3000/api/game/${game.id}`;
  player1.currentGame = game.id;

  res.json({
    gameURL: gameUrl,
    message: "User is created.",
    userId: player1.id,
    ws: "ws://localhost:8080",
  });
};

// join a game
export const joinGame = async (req: Request, res: Response) => {
  const player = new Player();
  players.set(player.id, player);
  const { id } = req.params;

  const game = games.get(id);

  if (!game) {
    res.status(404).json({ message: "Game not found." });
    return;
  }

  game.player2 = player;
  player.currentGame = id;

  res.json({
    userId: player.id,
    gameId: id,
    ws: `ws://localhost:8080/`,
    message: "Game Exists!!",
  });
};
