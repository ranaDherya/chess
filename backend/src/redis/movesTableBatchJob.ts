import { db } from "../db/db";
import { redis } from "./redis";
import { REDIS_MOVE_QUEUE } from "../constants";
import { GameStatus } from "@prisma/client";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

export const startMoveSyncJob = () => {
  setInterval(async () => {
    while (true) {
      const payload = await redis.lPop(REDIS_MOVE_QUEUE);

      if (!payload) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      const data = JSON.parse(payload);
      const { gameId, moveNumber, move, createdAt, timeTaken } = data;

      try {
        // Idempotency: gameId+moveNumber is unique. Upsert makes retries safe.
        await db.move.upsert({
          where: {
            gameId_moveNumber: {
              gameId,
              moveNumber,
            },
          },
          create: {
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
          update: {
            // Keep the first write as the source of truth; allow filling missing fields if needed.
            san: move.san,
            after: move.after,
            before: move.before,
            from: move.from,
            to: move.to,
            timeTaken,
          },
        });
      } catch (e) {
        console.error("[movesTableBatchJob] move.upsert failed", e);
        continue;
      }

      let retries = MAX_RETRIES;
      while (retries > 0) {
        try {
          // Invariant: (currentFen, lastMoveNumber) only advance monotonically.
          // This makes out-of-order worker processing safe.
          const updated = await db.game.updateMany({
            where: {
              id: gameId,
              status: GameStatus.IN_PROGRESS,
              lastMoveNumber: { lt: moveNumber },
            },
            data: {
              currentFen: move.after,
              lastMoveNumber: moveNumber,
            },
          });
          // If updated.count === 0, this event was stale/out-of-order or game already ended; ignore.
          break;
        } catch (e: unknown) {
          const isRetryable =
            (e as { code?: string })?.code === "P2034" ||
            (e as { message?: string })?.message?.includes("deadlock") ||
            (e as { message?: string })?.message?.includes("write conflict");
          retries--;
          if (!isRetryable || retries === 0) {
            console.error("[movesTableBatchJob] game.update failed", e);
            break;
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
  }, 5000);
};
