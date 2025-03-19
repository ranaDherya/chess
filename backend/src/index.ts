import http from "http";
import app from "./http/app";
import { wss } from "./ws/socket";
import { gameManager } from "./services/gameService";
import { parse } from "url";

const server = http.createServer(app);

// Register WebSocket routes
wss.on("connection", function connection(ws, req) {
  const { query } = parse(req.url!, true);
  const userId = query.userId as string;

  gameManager.addUser(userId, ws);

  ws.on("disconnect", () => gameManager.removeUser(userId));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
