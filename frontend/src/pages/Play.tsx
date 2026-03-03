import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Button } from "../components/Button";
import "./Play.css";
import { useAuthModal } from "../context/AuthModalContext";

function Play() {
  const navigate = useNavigate();
  const { token } = useUser();
  const authModal = useAuthModal();

  const handlePlayMode = (mode: "random" | "friend") => {
    if (!token) {
      authModal.open({ reason: "Sign in to start a game." });
      return;
    }
    // Navigate to game page with mode query param
    navigate(`/game?mode=${mode}`);
  };

  return (
    <div className="play-container">
      <div className="play-card">
        <div className="play-header">
          <h1>Choose Game Mode</h1>
          <p>Select how you'd like to play chess</p>
        </div>

        <div className="play-modes">
          <div
            className="mode-card random-mode"
            onClick={() => handlePlayMode("random")}
          >
            <div className="mode-icon">🎲</div>
            <h2>Random Opponent</h2>
            <p>Get matched with a random player around your skill level</p>
            <Button onClick={() => handlePlayMode("random")}>
              Find Opponent
            </Button>
          </div>

          <div className="divider"></div>

          <div
            className="mode-card friend-mode"
            onClick={() => handlePlayMode("friend")}
          >
            <div className="mode-icon">👥</div>
            <h2>Play with Friend</h2>
            <p>Create a game and share the link with your friend</p>
            <Button onClick={() => handlePlayMode("friend")}>
              Create Game
            </Button>
          </div>
        </div>

        <div className="play-footer">
          <p>or</p>
          <div className="join-direct">
            <input
              type="text"
              placeholder="Paste game ID to spectate or join..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const gameId = (e.target as HTMLInputElement).value.trim();
                  if (gameId) {
                    navigate(`/game/${gameId}`);
                  }
                }
              }}
              className="direct-input"
            />
          </div>
          <Button onClick={() => navigate("/")} className="back-btn">
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Play;
