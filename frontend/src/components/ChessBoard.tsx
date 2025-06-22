import React from "react";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../pages/Game";

import "./ChessBoard.css";

function ChessBoard({
  chess,
  isPaused,
  board,
  socket,
  setBoard,
}: {
  chess: Chess;
  isPaused: boolean;
  setBoard: React.Dispatch<
    React.SetStateAction<
      ({
        square: Square;
        type: PieceSymbol;
        color: Color;
      } | null)[][]
    >
  >;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
}) {
  const [from, setFrom] = useState<null | Square>(null);

  // Drag and Drop Handdling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Needed to allow drop
  };
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    !isPaused && setFrom(square);
  };
  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!isPaused) {
      if (from) {
        socket.send(
          JSON.stringify({
            type: MOVE,
            payload: {
              move: {
                from,
                to: targetSquare,
              },
            },
          })
        );
        console.log(
          "socket sent with message:" +
            JSON.stringify({
              type: MOVE,
              payload: {
                move: {
                  from,
                  to: targetSquare,
                },
              },
            })
        );
        setFrom(null);
        chess.move({
          from,
          to: targetSquare,
        });
        setBoard(chess.board());
        console.log({
          from,
          to: targetSquare,
        });
      }
    }
  };

  return (
    <div>
      {board.map((row, i) => {
        return (
          <div key={i} className="chessboard-container">
            {row.map((square, j) => {
              const squareIndex = (String.fromCharCode(97 + (j % 8)) +
                "" +
                (8 - i)) as Square; // sq representation as a8, b6, e3, etc
              return (
                <div
                  className={`chessboard-squares ${
                    (i + j) % 2 === 0 ? "square-green" : "square-white"
                  }`}
                  style={{
                    borderTopRightRadius:
                      i === 0 && j === 7 ? "6px" : undefined,
                    borderTopLeftRadius: i === 0 && j === 0 ? "6px" : undefined,
                    borderBottomLeftRadius:
                      i === 7 && j === 0 ? "6px" : undefined,
                    borderBottomRightRadius:
                      i === 7 && j === 7 ? "6px" : undefined,
                  }}
                  onClick={() => {
                    if (!isPaused) {
                      if (!from) {
                        if (square) {
                          setFrom(squareIndex);
                        }
                      } else {
                        socket.send(
                          JSON.stringify({
                            type: MOVE,
                            payload: {
                              move: {
                                from,
                                to: squareIndex,
                              },
                            },
                          })
                        );
                        console.log(
                          "socket sent with message:" +
                            JSON.stringify({
                              type: MOVE,
                              payload: {
                                move: {
                                  from,
                                  to: squareIndex,
                                },
                              },
                            })
                        );

                        setFrom(null);
                        chess.move({
                          from,
                          to: squareIndex,
                        });
                        setBoard(chess.board());
                        console.log({
                          from,
                          to: squareIndex,
                        });
                      }
                    }
                  }}
                  key={squareIndex}
                  onDrop={(e) => handleDrop(e, squareIndex)}
                  onDragOver={handleDragOver}
                >
                  <div className="chessboard-peices">
                    {square ? (
                      <img
                        src={`/${
                          square?.color === "b"
                            ? square?.type
                            : `${square?.type}-w`
                        }.svg`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, squareIndex)}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default ChessBoard;
