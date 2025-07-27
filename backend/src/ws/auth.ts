import jwt from "jsonwebtoken";
import { User } from "./User";
import { WebSocket } from "ws";
import { UserJwtClaims } from "../types/types";
import { getEnv } from "../http/utils/getEnv";

const JWT_SECRET = getEnv("JWT_SECRET", "your_secret_key");

export const extractAuthUser = (token: string, ws: WebSocket): User => {
  const decoded = jwt.verify(token, JWT_SECRET) as UserJwtClaims;
  return new User(ws, decoded);
};
