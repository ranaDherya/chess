import jwt from "jsonwebtoken";
import { User } from "./User";
import { WebSocket } from "ws";
import { UserJwtClaims } from "../types/types";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export const extractAuthUser = (token: string, ws: WebSocket): User => {
  const decoded = jwt.verify(token, JWT_SECRET) as UserJwtClaims;
  return new User(ws, decoded);
};
