import {
  createGameShareableLink,
  createGameWithRandom,
  joinGame,
} from "../controllers/gameController";
import { Router } from "express";

const router = Router();

router.get("/creategame", createGameWithRandom);
router.get("/creategamelink", createGameShareableLink);
router.get("/:id", joinGame);

export default router;
