import express from "express";
import gameRoutes from "../routes/gameRoutes";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// Register HTTP routes
app.use("/api/game", gameRoutes);

export default app;
