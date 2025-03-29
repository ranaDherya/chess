import app from "./http/app";
import { wss } from "./ws/socket";
import { gameManager } from "./services/gameService";
import { parse } from "url";

// Run the WebSocket server
wss.on("connection", function connection(ws, req) {
  const { query } = parse(req.url!, true);
  const userID = query.userID as string;
  console.log("Query: ", query);
  console.log(userID);

  gameManager.addUser(userID, ws);

  ws.on("disconnect", () => gameManager.removeUser(userID));
});

// Runs the http server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
