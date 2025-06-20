import { useNavigate } from "react-router-dom";
import chessPNG from "/chessboard.png";

import "./Landing.css";
import axios from "axios";

import { useUser } from "../context/UserContext";
import { useRef, useState } from "react";

function Landing() {
  const navigate = useNavigate();
  const { setUser, setGameID, gameID, userID } = useUser();
  const [playWithFriend, setPlayWithFriend] = useState(false);
  const gameLink = useRef<HTMLInputElement>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  const playHandler = () => {
    navigate("/game");
  };

  const playRandomClickHandler = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/game/creategame");

      const data = res.data;

      setUser(data.userID, data.ws);

      console.log(data.message, data);

      navigate("/game");
    } catch (e) {
      console.log("Error creating Game: ", e);
    }
  };

  const createLinkHandler = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/game/creategamelink"
      );
      const data = res.data;
      setUser(data.userID, data.ws);
      console.log("create Link user id:", userID);
      setGameID(data.gameID);

      console.log(data.message, data);
      setShareableLink(data.gameID);
    } catch (e) {
      console.log("Error creating Link: ", e);
    }
  };

  const joinLinkHandler = async () => {
    console.log("heheahaha + ", gameID);
    try {
      const res = await axios.get(`http://localhost:3000/api/game/${gameID}`);
      const data = res.data;
      setUser(data.userID, data.ws);
      console.log("Join Link user id:", userID);
      setGameID(data.gameID);
      setShareableLink(data.gameID);

      console.log(data.message, data);
    } catch (e) {
      console.log("Error creating Link: ", e);
    }

    // navigate(`/game/${gameID}`);

    // setPlayWithFriend(false);
  };

  return (
    <div className="landing-container">
      <div className="landing-image">
        <img src={chessPNG} />
      </div>

      <div className="landing-play-div">
        <button className="play-btn" onClick={playRandomClickHandler}>
          Play With Randoms
        </button>
        {!playWithFriend && (
          <button className="play-btn" onClick={() => setPlayWithFriend(true)}>
            Play with Friends
          </button>
        )}
        {playWithFriend && !shareableLink && (
          <>
            <div className="join-game-sec">
              <input
                type="text"
                onChange={(e) => setGameID(e.currentTarget.value)}
                placeholder="Enter Game Id to play..."
                className="link-input-box"
              />
              <button className="play-btn" onClick={joinLinkHandler}>
                Join Game
              </button>
            </div>

            <button className="play-btn" onClick={createLinkHandler}>
              Create Link
            </button>
          </>
        )}
        {playWithFriend && shareableLink && (
          <>
            <span>Send this game id: {shareableLink}</span>
            <button
              className="play-btn"
              onClick={() => {
                setPlayWithFriend(false);
                navigate(`/game/${gameID}`);
              }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Landing;
