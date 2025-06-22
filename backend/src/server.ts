import app from "./http/app";
import { wss } from "./ws/socket";
import { gameManager } from "./core/GameManager";
import { parse } from "url";
import { extractAuthUser } from "./ws/auth";

// Run the WebSocket server
wss.on("connection", function connection(ws, req) {
  //@ts-ignore
  const token: string = parse(req.url, true).query.token;
  const user = extractAuthUser(token, ws);
  gameManager.addUser(user);

  ws.on("close", () => {
    gameManager.removeUser(ws);
  });
});

app.get("/", (req, res) => {
  console.log("Hello");
  res.json({ msg: "Supp!!!" });
});

// Runs the http server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
