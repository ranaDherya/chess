import { useEffect, useRef, useState } from "react";
import ChessBoard from "../components/ChessBoard.tsx";
import { connectWebSocket } from "../utils/connectWebSocket.tsx";
import { Chess } from "chess.js";
import { useUser } from "../context/UserContext";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";

import "./Game.css";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_ENDED = "game_ended";
export const JOIN_GAME = "join_game";
export const GAME_ADDED = "game_added";
export const CREATE_GAME = "create_game";
export const GAME_JOINED = "game_joined";
export const SURRENDER = "surrender";
export const SPECTATE = "spectate";
export const GAME_NOT_FOUND = "game_not_found";
export const GAME_ALERT = "game_alert";

function formatTime(ms: number | string) {
  const totalSeconds = Math.floor(Number(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function Game() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const gameMode = searchParams.get("mode") as "random" | "friend" | null;
  const authModal = useAuthModal();

  // Handles links like `/game/<id>/` where `useParams()` can sometimes miss the id
  const effectiveGameId =
    id ??
    (location.pathname.match(/^\/game\/([^/]+)\/?$/)?.[1] ?? null);

  // Game state
  const [isPaused, setIsPaused] = useState(true);
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [moveList, setMoveList] = useState<string[]>([]);
  const [player1TimeRemaining, setPlayer1TimeRemaining] =
    useState<number>(600000);
  const [player2TimeRemaining, setPlayer2TimeRemaining] =
    useState<number>(600000);
  const [activePlayer, setActivePlayer] = useState<"w" | "b" | null>(null);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [roleChoiceGameId, setRoleChoiceGameId] = useState<string | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; status: string } | null>(null);

  const joinedGameIdsRef = useRef<Set<string>>(new Set());
  const createRequestSentRef = useRef(false);
  const lastSocketRef = useRef<WebSocket | null>(null);

  // user context
  const {
    userSocket,
    setSocket,
    gameID,
    setGameID,
    userID,
    token,
    playerColor,
    setPlayerColor,
  } = useUser();

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    if (!userSocket) {
      connectWebSocket({ setSocket, token });
      return;
    }

    // On new socket (e.g. reconnect), allow sending join/create again so we get state
    if (userSocket !== lastSocketRef.current) {
      lastSocketRef.current = userSocket;
      joinedGameIdsRef.current.clear();
      createRequestSentRef.current = false;
    }

    // Send initial request at most once per game id or per create mode (avoids duplicate JOIN_GAME loop)
    if (effectiveGameId) {
      if (!joinedGameIdsRef.current.has(effectiveGameId)) {
        joinedGameIdsRef.current.add(effectiveGameId);
        userSocket.send(
          JSON.stringify({ type: JOIN_GAME, payload: { gameId: effectiveGameId } }),
        );
      }
    } else if (gameMode === "random") {
      if (!createRequestSentRef.current) {
        createRequestSentRef.current = true;
        userSocket.send(JSON.stringify({ type: INIT_GAME }));
      }
    } else if (gameMode === "friend") {
      if (!createRequestSentRef.current) {
        createRequestSentRef.current = true;
        userSocket.send(JSON.stringify({ type: CREATE_GAME }));
      }
    }

    userSocket.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case INIT_GAME: {
          joinedGameIdsRef.current.add(message.payload.gameId);
          const fen = message.payload.fen;
          chess.load(fen);
          setBoard(chess.board());
          setStarted(true);
          setWaitingForOpponent(false);
          setGameOver(null);

          if (message.payload.whitePlayer?.id === userID) {
            setPlayerColor("w");
          } else {
            setPlayerColor("b");
          }

          setGameID(message.payload.gameId);
          setActivePlayer("w");
          setPlayer1TimeRemaining(message.payload.timePerPlayer ?? 600000);
          setPlayer2TimeRemaining(message.payload.timePerPlayer ?? 600000);
          setIsPaused(false);
          navigate(`/game/${message.payload.gameId}`);
          break;
        }

        case GAME_ADDED:
          joinedGameIdsRef.current.add(message.payload.gameId);
          setGameID(message.payload.gameId);
          navigate(`/game/${message.payload.gameId}`);
          break;

        case GAME_JOINED: {
          joinedGameIdsRef.current.add(message.payload.gameId);
          const fen = message.payload.fen;
          chess.load(fen);
          setBoard(chess.board());
          setStarted(true);
          const waiting = message.payload.waitingForOpponent === true;
          setWaitingForOpponent(waiting);
          setGameOver(null);

          if (
            message.payload.whitePlayer?.id === userID
          ) {
            setPlayerColor("w");
          } else if (
            message.payload.blackPlayer?.id === userID
          ) {
            setPlayerColor("b");
          } else {
            setPlayerColor(message.payload.playerColor ?? null);
          }

          setGameID(message.payload.gameId);
          setActivePlayer(message.payload.playerTurn ?? "w");
          setMoveList(message.payload.moveList ?? []);
          setPlayer1TimeRemaining(
            (message.payload.timePerPlayer ?? 600000) -
              (message.payload.player1TimeConsumed ?? 0),
          );
          setPlayer2TimeRemaining(
            (message.payload.timePerPlayer ?? 600000) -
              (message.payload.player2TimeConsumed ?? 0),
          );
          setIsPaused(waiting);

          if (!effectiveGameId) {
            navigate(`/game/${message.payload.gameId}`);
          }

          if (message.payload.showRoleChoice) {
            setRoleChoiceGameId(message.payload.gameId);
            setShowRoleChoice(true);
          }
          break;
        }

        case MOVE:
          chess.load(message.payload.fen);
          setBoard(chess.board());
          setPlayer1TimeRemaining(
            message.payload.timePerPlayer - message.payload.player1TimeConsumed,
          );
          setPlayer2TimeRemaining(
            message.payload.timePerPlayer - message.payload.player2TimeConsumed,
          );
          setActivePlayer(message.payload.playerTurn);
          setMoveList(message.payload.moveList);
          setIsPaused(false);
          break;

        case GAME_ENDED:
          setGameOver({
            result: message.payload.result,
            status: message.payload.status,
          });
          setIsPaused(true);
          break;

        case GAME_NOT_FOUND:
          setStarted(false);
          setGameOver({ result: "Game not found", status: "NOT_FOUND" });
          break;

        case GAME_ALERT:
          if (message.payload?.message) {
            setGameOver({
              result: message.payload.message,
              status: "ALERT",
            });
          }
          break;

        default:
          break;
      }
    };
  }, [userSocket, token, id, gameMode]);

  // Run clock only when game has started (both players joined) and not paused
  useEffect(() => {
    if (waitingForOpponent || isPaused || !activePlayer || gameOver) return;

    const interval = setInterval(() => {
      if (activePlayer === "w") {
        setPlayer1TimeRemaining((prev) => Math.max(prev - 1000, 0));
      } else {
        setPlayer2TimeRemaining((prev) => Math.max(prev - 1000, 0));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePlayer, isPaused, waitingForOpponent, gameOver]);

  const handleSurrender = () => {
    if (!userSocket || !gameID) return;

    const confirmSurrender = window.confirm(
      "Are you sure you want to surrender? You will lose the game.",
    );
    if (!confirmSurrender) return;

    userSocket.send(
      JSON.stringify({
        type: SURRENDER,
        payload: { gameId: gameID },
      }),
    );
  };

  const handleRoleChoice = (action: "spectate" | "play") => {
    if (!userSocket || !roleChoiceGameId) return;

    userSocket.send(
      JSON.stringify({
        type: SPECTATE,
        payload: { gameId: roleChoiceGameId, action },
      }),
    );

    setShowRoleChoice(false);
  };

  const isGameOverOverlay =
    gameOver &&
    gameOver.status !== "IN_PROGRESS" &&
    gameOver.status !== "NOT_FOUND" &&
    gameOver.status !== "ALERT";

  const gameOverResultLabel =
    gameOver && (gameOver.status === "NOT_FOUND" || gameOver.status === "ALERT")
      ? gameOver.result
      : gameOver
        ? gameOver.result.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : "";

  const needsLogin = !token && (effectiveGameId || gameMode);

  return (
    <div className="game-page-container">
      {/* Not logged in: avoid endless "Loading" and show login prompt */}
      {needsLogin && (
        <div className="game-waiting-container">
          <div className="waiting-card">
            <h2>Log in to view this game</h2>
            <p className="waiting-text">
              Sign in or create an account to join or spectate.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="back-btn"
                onClick={() =>
                  authModal.open({
                    reason: "Sign in to join or spectate this game.",
                    returnTo: `${location.pathname}${location.search}`,
                  })
                }
              >
                Log in
              </button>
              <button className="back-btn" onClick={() => navigate("/play")}>
                Go to Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-page message only when no board (NOT_FOUND / ALERT) */}
      {!needsLogin && gameOver && !started && gameOver.status !== "IN_PROGRESS" && (
        <div className="game-waiting-container">
          <div className="waiting-card">
            <h2>
              {gameOver.status === "NOT_FOUND" ? "Game not found" : "Notice"}
            </h2>
            <p className="waiting-text">{gameOverResultLabel}</p>
            <button
              className="back-btn"
              onClick={() => {
                setGameOver(null);
                navigate("/play");
              }}
            >
              Go to Play
            </button>
          </div>
        </div>
      )}

      {!needsLogin && started ? (
        <>
          {waitingForOpponent && (
            <div className="waiting-banner">
              Waiting for opponent to join... Share the game link. Clock will start when both players are in.
            </div>
          )}
          <div className="game-board">
            {/* Top player info (Black) */}
            <div className="player-data player-top">
              <div className="player-info">
                <img src="/profile-b.png" alt="opponent" />
                <div className="player-details">
                  <span className="player-name">Black</span>
                  {playerColor === "b" ? (
                    <span className="player-role">You</span>
                  ) : playerColor === "w" ? (
                    <span className="player-role">Opponent</span>
                  ) : (
                    <span className="player-role spectator">Spectating</span>
                  )}
                </div>
              </div>
              <div className="player-timer">
                {formatTime(player2TimeRemaining)}
              </div>
            </div>

            {/* Chess board */}
            <ChessBoard
              paused={{ isPaused, setIsPaused }}
              chess={chess}
              setBoard={setBoard}
              socket={userSocket}
              board={board}
              activePlayer={activePlayer}
            />

            {/* Bottom player info (White) */}
            <div className="player-data player-bottom">
              <div className="player-info">
                <img src="/profile-w.png" alt="player" />
                <div className="player-details">
                  <span className="player-name">White</span>
                  {playerColor === "w" ? (
                    <span className="player-role">You</span>
                  ) : playerColor === "b" ? (
                    <span className="player-role">Opponent</span>
                  ) : (
                    <span className="player-role spectator">Spectating</span>
                  )}
                </div>
              </div>
              <div className="player-timer">
                {formatTime(player1TimeRemaining)}
              </div>
            </div>
          </div>

          <div className="game-sideboard">
            <div className="sideboard-game-info">
              <div className="move-list">
                <h3>Move History</h3>
                <div className="moves-container">
                  {moveList.length > 0 ? (
                    <ul>
                      {moveList.map((san, idx) => (
                        <li key={idx} className="move-item">
                          <span className="move-number">
                            {Math.floor(idx / 2) + 1}.
                          </span>
                          {san}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-moves">No moves yet...</p>
                  )}
                </div>
              </div>
              <div className="game-status">
                {playerColor === null && (
                  <div className="spectator-badge">👁️ You are spectating</div>
                )}
                <div className="current-turn">
                  Current turn:{" "}
                  <strong>{activePlayer === "w" ? "White" : "Black"}</strong>
                </div>
                {playerColor !== null && (
                  <button
                    className="surrender-btn"
                    onClick={handleSurrender}
                    title="Surrender and lose the game"
                  >
                    🏳️ Surrender
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Game Over overlay on top of board (chess.com style) */}
          {isGameOverOverlay && (
            <div className="modal-overlay game-over-overlay">
              <div className="game-over-dialog">
                <div className="game-over-crown">
                  {gameOver?.result === "DRAW"
                    ? "½"
                    : gameOver?.result === "WHITE_WINS"
                      ? "♔"
                      : "♚"}
                </div>
                <h2 className="game-over-title">Game Over</h2>
                <p className="game-over-result">{gameOverResultLabel}</p>
                <p className="game-over-sub">
                  {gameOver?.status === "COMPLETED"
                    ? "Thanks for playing"
                    : gameOver?.status}
                </p>
                <button
                  className="game-over-btn"
                  onClick={() => {
                    setGameOver(null);
                    navigate("/play");
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </>
      ) : !needsLogin ? (
        <div className="game-waiting-container">
          <div className="waiting-card">
            <h2>Game Loading...</h2>
            <p className="waiting-text">Connecting to game server...</p>
            <div className="spinner"></div>
          </div>
        </div>
      ) : null}

      {showRoleChoice && (
        <div className="modal-overlay">
          <div className="role-choice-dialog">
            <h2>Join Game</h2>
            <p>Would you like to join as a player or spectate?</p>
            <div className="role-choice-buttons">
              <button
                className="btn-play"
                onClick={() => handleRoleChoice("play")}
              >
                🎮 Join as Player 2
              </button>
              <button
                className="btn-spectate"
                onClick={() => handleRoleChoice("spectate")}
              >
                👁️ Spectate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
