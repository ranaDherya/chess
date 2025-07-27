import React from "react";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../pages/Game";

import "./ChessBoard.css";
import { useUser } from "../context/UserContext";

function isPromotionMove(chess: Chess, from: Square, to: Square): boolean {
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;

  const targetRank = parseInt(to[1]);
  const isWhite = piece.color === "w";

  return (isWhite && targetRank === 8) || (!isWhite && targetRank === 1);
}

function ChessBoard({
  chess,
  paused,
  board,
  socket,
  setBoard,
  activePlayer,
}: {
  chess: Chess;
  paused: {
    isPaused: boolean;
    setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  };
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
  socket: WebSocket | null;
  activePlayer: "w" | "b" | null;
}) {
  const [from, setFrom] = useState<null | Square>(null);
  const [invalidMoveSquare, setInvalidMoveSquare] = useState<Square | null>();
  const { isPaused, setIsPaused } = paused;
  const { playerColor, gameID, userID } = useUser();
  const canMove = !isPaused && activePlayer === playerColor;

  // Drag and Drop Handdling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Needed to allow drop
  };
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (isPaused) {
      e.preventDefault();
    }
    if (!isPaused && canMove) {
      setFrom(square);
      // Hide the default drag ghost image
      // const img = document.createElement("img");
      // img.src =
      //   "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="; // 1x1 transparent gif
      // e.dataTransfer.setDragImage(img, 0, 0);
    }
  };
  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!isPaused && canMove) {
      if (from !== targetSquare) {
        try {
          const tempChess = new Chess(chess.fen());
          const isPromotion = isPromotionMove(chess, from!, targetSquare);
          tempChess.move({
            from: from ?? "",
            to: targetSquare,
            promotion: isPromotion ? "q" : undefined,
          });
        } catch (e) {
          setInvalidMoveSquare(from);
          setTimeout(() => setInvalidMoveSquare(null), 1000);
          return;
        }
        const isPromotion = isPromotionMove(chess, from!, targetSquare);
        const move = {
          from: from ?? "",
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined, // default to queen
        };

        socket?.send(
          JSON.stringify({
            type: MOVE,
            payload: {
              move: move,
              userId: userID,
              gameId: gameID,
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
                userId: userID,
                gameId: gameID,
              },
            })
        );

        chess.move(move);
        setBoard(chess.board());
        console.log({
          from,
          to: targetSquare,
        });
        setIsPaused(true);
        setFrom(null);
      } else if (from === targetSquare) {
        setFrom(null);
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
                  } ${
                    invalidMoveSquare === squareIndex ? "square-invalid" : ""
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
                    if (!isPaused && canMove) {
                      if (!from) {
                        if (square) {
                          setFrom(squareIndex);
                        }
                      } else if (from !== squareIndex) {
                        try {
                          const tempChess = new Chess(chess.fen());
                          const isPromotion = isPromotionMove(
                            chess,
                            from!,
                            squareIndex
                          );
                          tempChess.move({
                            from: from ?? "",
                            to: squareIndex,
                            promotion: isPromotion ? "q" : undefined,
                          });
                        } catch (e) {
                          setInvalidMoveSquare(from);
                          setTimeout(() => setInvalidMoveSquare(null), 1000);
                          return;
                        }
                        const isPromotion = isPromotionMove(
                          chess,
                          from!,
                          squareIndex
                        );
                        const move = {
                          from,
                          to: squareIndex,
                          promotion: isPromotion ? "q" : undefined, // default to queen
                        };
                        socket?.send(
                          JSON.stringify({
                            type: MOVE,
                            payload: {
                              move: move,
                              gameId: gameID,
                              userId: userID,
                            },
                          })
                        );
                        console.log(
                          "socket sent with message:" +
                            JSON.stringify({
                              type: MOVE,
                              payload: {
                                move: move,
                                gameId: gameID,
                                userId: userID,
                              },
                            })
                        );
                        setIsPaused(true);
                        chess.move(move);
                        setBoard(chess.board());
                        console.log({
                          from,
                          to: squareIndex,
                        });
                        setFrom(null);
                      } else if (from === squareIndex) {
                        setFrom(null);
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
