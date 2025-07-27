import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import ChessBoard from "../components/ChessBoard.tsx";
import { connectWebSocket } from "../utils/connectWebSocket.tsx";
import { Chess } from "chess.js";
import { useUser } from "../context/UserContext";
import { useNavigate, useParams } from "react-router-dom";

import "./Game.css";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const JOIN_GAME = "join_game";
export const GAME_ADDED = "game_added";
export const CREATE_GAME = "create_game";
export const GAME_JOINED = "game_joined";

function formatTime(ms: number | string) {
  const totalSeconds = Math.floor(Number(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

type Props = {
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
};

function Game({ setShowLoginModal }: Props) {
  const { id } = useParams();

  // use states
  const [isPaused, setIsPaused] = useState(true);
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [gameLink, setGameLink] = useState("");
  const [moveList, setMoveList] = useState<string[]>([]);
  const [player1TimeRemaining, setPlayer1TimeRemaining] =
    useState<number>(600000);
  const [player2TimeRemaining, setPlayer2TimeRemaining] =
    useState<number>(600000);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState<number>(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState<number>(0);
  const [activePlayer, setActivePlayer] = useState<"w" | "b" | null>(null);
  const [gameTime, setGameTime] = useState<number>(600000);

  // user context
  const {
    userSocket,
    setSocket,
    gameID,
    setUser,
    setGameID,
    userID,
    token,
    setToken,
    setPlayerColor,
  } = useUser();

  const navigate = useNavigate();

  const playIntent = useRef<"random" | "friend" | null>(null);

  // Funcs
  const handlePlayIntent = (intent: "random" | "friend") => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    playIntent.current = intent;
    if (!userSocket) {
      connectWebSocket({ setSocket, token });
    } else {
      sendGameRequest(intent);
    }
  };

  const sendGameRequest = (intent: "random" | "friend") => {
    if (!userSocket) return;
    if (intent === "random") {
      userSocket.send(JSON.stringify({ type: INIT_GAME }));
    } else if (intent === "friend") {
      userSocket.send(JSON.stringify({ type: CREATE_GAME }));
    }
  };

  useEffect(() => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!userSocket) {
      connectWebSocket({ setSocket, token });
      return;
    }

    if (id) {
      userSocket.send(
        JSON.stringify({
          type: JOIN_GAME,
          payload: { gameId: id },
        })
      );
    }

    // Send game request if intent is set and socket just connected
    if (playIntent.current) {
      sendGameRequest(playIntent.current);
      playIntent.current = null;
    }

    userSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      let fen: string;
      switch (message.type) {
        case INIT_GAME:
          // Update chess board
          fen = message.payload.fen;
          chess.load(fen);
          setBoard(chess.board());

          // start the game
          setStarted(true);
          console.log("Game started: " + JSON.stringify(message.payload));

          // check our colour
          if (message.payload.whitePlayer.id === userID) {
            setPlayerColor("w");
          } else if (message.payload.blackPlayer.id === userID) {
            setPlayerColor("b");
          }

          setGameID(message.payload.gameId);
          setActivePlayer("w");
          setGameTime(message.payload.timePerPlayer);
          setPlayer1TimeRemaining(message.payload.timePerPlayer);
          setPlayer2TimeRemaining(message.payload.timePerPlayer);
          setIsPaused(false);
          console.log(isPaused);
          navigate(`/game/${message.payload.gameId}/`);
          break;
        case GAME_ADDED:
          setGameID(message.payload.gameId);
          setGameLink(message.payload.gameId);
          console.log(message.payload.gameId);
          navigate(`/game/${message.payload.gameId}/`);
          break;
        case GAME_JOINED:
          setBoard(chess.board());
          setStarted(true);
          console.log("Game started: " + JSON.stringify(message.payload));
          if (message.payload.whitePlayer.id === userID) {
            setPlayerColor("w");
          } else if (message.payload.blackPlayer.id === userID) {
            setPlayerColor("b");
          }
          setGameID(message.payload.gameId);
          navigate(`/game/${message.payload.gameId}/`);
          setIsPaused(false);
          break;
        case MOVE:
          // Update the board
          fen = message.payload.fen;
          chess.load(fen);
          setBoard(chess.board());

          const move = message.payload.move;
          // Update time of both players
          setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
          setPlayer2TimeConsumed(message.payload.player2TimeConsumed);
          setPlayer1TimeRemaining(
            player1TimeRemaining - message.payload.player1TimeConsumed
          );
          setPlayer2TimeRemaining(
            player2TimeRemaining - message.payload.player2TimeConsumed
          );

          setActivePlayer(message.payload.playerTurn);
          setMoveList(message.payload.moveList);
          console.log("Move made by other: " + JSON.stringify(move));
          setIsPaused(false);
          break;
        case GAME_OVER:
          console.log("Game over");
          break;
        default:
          // other cases
          break;
      }
    };
  }, [userSocket, token]);

  useEffect(() => {
    if (isPaused || !activePlayer) return;

    const interval = setInterval(() => {
      if (activePlayer === "w") {
        setPlayer1TimeRemaining((prev) => Math.max(prev - 1000, 0)); // white = bottom = player2
      } else {
        setPlayer2TimeRemaining((prev) => Math.max(prev - 1000, 0)); // black = top = player1
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePlayer, isPaused]);

  const createGameHandler = () => {
    try {
      if (userSocket) {
        console.log("create game");
        userSocket.send(
          JSON.stringify({
            type: CREATE_GAME,
          })
        );
      }
    } catch (e) {
      console.log("Error creating Game: ", e);
    }
  };

  const joinGameHandler = () => {
    if (userSocket && gameLink) {
      userSocket.send(
        JSON.stringify({
          type: JOIN_GAME,
          payload: { gameId: gameLink },
        })
      );
    }
  };

  return (
    <div className="game-page-container">
      <div className="game-board">
        <div className="player-data">
          <div className="player-info">
            <img src="/profile-b.png" />
            <span>Opponent</span>
          </div>
          <div className="player-timer">{formatTime(player2TimeRemaining)}</div>
        </div>
        <ChessBoard
          paused={{ isPaused, setIsPaused }}
          chess={chess}
          setBoard={setBoard}
          socket={userSocket}
          board={board}
          activePlayer={activePlayer}
        />
        <div className="player-data">
          <div className="player-info">
            <img src="/profile-w.png" />
            <span>Guest</span>
          </div>
          <div className="player-timer">{formatTime(player1TimeRemaining)}</div>
        </div>
      </div>
      <div className="game-sideboard">
        {started ? (
          <div className="sideboard-game-info">
            <div className="move-list">
              <h3>Moves</h3>
              <ul>
                {moveList.map((san, idx) => (
                  <li key={idx}>{san}</li>
                ))}
              </ul>
            </div>
            <div className="chat-menu">
              <h3>Chat</h3>
              {/* Replace below with your chat component or logic */}
              <div className="chat-placeholder">Chat coming soon...</div>
            </div>
          </div>
        ) : (
          <div className="sideboard-play-btns">
            <Button onClick={() => handlePlayIntent("random")}>
              Play with Random
            </Button>
            {playIntent.current !== "friend" && (
              <>
                <Button onClick={() => handlePlayIntent("friend")}>
                  Play with Friend
                </Button>
              </>
            )}
            {playIntent.current === "friend" && (
              <>
                <Button onClick={createGameHandler}>Create Game</Button>
                <span>
                  Share this Game ID with your friend: <b>{gameLink}</b>
                </span>
                <input onChange={(e) => setGameLink(e.target.value)} />
                <Button onClick={joinGameHandler}>Join Game</Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
