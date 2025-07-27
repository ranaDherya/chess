import { db } from "../db/db"; // your prisma or MongoDB connector
import { redis } from "./redis";

export const startMoveSyncJob = () => {
  setInterval(async () => {
    while (true) {
      const payload = await redis.lPop("move_queue");

      if (!payload) {
        await new Promise((r) => setTimeout(r, 500)); // sleep if queue is empty
        continue;
      }

      const data = JSON.parse(payload);
      const { gameId, moveNumber, move, createdAt, timeTaken } = data;

      await db.$transaction([
        db.move.create({
          data: {
            gameId,
            moveNumber,
            from: move.from,
            to: move.to,
            after: move.after,
            before: move.before,
            createdAt: new Date(createdAt),
            timeTaken,
            san: move.san,
          },
        }),
        db.game.update({
          data: {
            currentFen: move.after,
          },
          where: {
            id: gameId,
          },
        }),
      ]);
    }
  }, 5000);
};
