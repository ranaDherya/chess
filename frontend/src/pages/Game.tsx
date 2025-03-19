import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
import { useUser } from "../context/UserContext";
import axios from "axios";

import "./Landing.css";
import { useParams } from "react-router-dom";
// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const JOIN_GAME = "join_game";

function Game() {
  const { id } = useParams();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const { userSocket, wsURL, setSocket, gameID } = useUser();
  useSocket({ wsURL, setSocket });

  const playHandler = () => {
    if (!id) {
      console.log("yuhu");
      userSocket?.send(
        JSON.stringify({
          type: INIT_GAME,
        })
      );
    }
    console.log(id);
    console.log(gameID);
    if (id) {
      console.log("hehehe");
      userSocket?.send(
        JSON.stringify({
          type: JOIN_GAME,
          payload: {
            gameID: id,
          },
        })
      );
    }
  };

  useEffect(() => {
    if (!userSocket) {
      return;
    }
    userSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          console.log("Game started: " + JSON.stringify(message.payload));
          break;
        case JOIN_GAME:
          setBoard(chess.board());
          setStarted(true);
          console.log("Game started: " + JSON.stringify(message.payload));
          break;
        case MOVE:
          const move = message.payload;
          chess.move(move);
          setBoard(chess.board());
          console.log("Move made by other: " + JSON.stringify(move));
          break;
        case GAME_OVER:
          console.log("Game over");
          break;
      }
    };
  }, [userSocket]);

  if (!userSocket) return <div>Connecting...</div>;

  return (
    <div className="justify-center flex">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-6 gap-4 w-full">
          <div className="col-span-4 w-full flex justify-center">
            <ChessBoard
              chess={chess}
              setBoard={setBoard}
              socket={userSocket}
              board={board}
            />
          </div>

          <div className="col-span-2 bg-slate-900 w-full flex justify-center">
            <div className="pt-8">
              {!started && (
                <>
                  <Button onClick={playHandler}>Play</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
