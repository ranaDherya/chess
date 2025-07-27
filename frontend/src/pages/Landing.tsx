import React from "react";
import { Button } from "../components/Button";
import chessBoardPNG from "/landing-chess-board.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

import "./Landing.css";

type Props = {
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
};

function Landing({ showLoginModal, setShowLoginModal }: Props) {
  const navigate = useNavigate();
  const { token } = useUser();

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
                setShowLoginModal(!showLoginModal);
              } else {
                navigate("/game/");
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
