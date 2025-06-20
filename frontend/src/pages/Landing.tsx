import React from "react";
import { Button } from "../components/Button";
import "./Landing.css";
import chessBoardPNG from "/landing-chess-board.png";

function Landing() {
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
          <Button onClick={() => {}}>Play Online</Button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
