import React from "react";
import { Button } from "../components/Button";
import chessBoardPNG from "/landing-chess-board.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAuthModal } from "../context/AuthModalContext";

import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const { token } = useUser();
  const authModal = useAuthModal();

  return (
    <div className="landing-container">
      <div className="landing-poster">
        <img src={chessBoardPNG} />
      </div>
      <div className="landing-content">
        <div className="landing-content-heading">
          <span>Play Chess On The Best Site Ever!</span>
        </div>
        <div className="landing-content-subpart">
          <span>
            <span>#77,788</span> Games Played
          </span>
          <span>
            <span>#66,665</span> Playing Now
          </span>
        </div>
        <div className="landing-content-play-btn">
          <Button
            onClick={() => {
              if (!token) {
                authModal.open({ reason: "Sign in to play online." });
              } else {
                navigate("/play");
              }
            }}
          >
            Play Online
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
