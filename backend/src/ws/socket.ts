// ws in node.js
import { WebSocketServer } from "ws";
import { GameManager } from "../models/GameManager";

export const wss = new WebSocketServer({ port: 8080 });

export const gameManager = new GameManager();
