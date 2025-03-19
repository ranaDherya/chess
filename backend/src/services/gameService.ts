import { Player } from "../models/Player";
import { Game } from "../models/Game";
import { GameManager } from "../models/GameManager";

export const players: Map<string, Player> = new Map();
export const games: Map<string, Game> = new Map();
export const gameManager = new GameManager();
