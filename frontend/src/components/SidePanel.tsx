import React from "react";
import "./SidePanel.css";
import { Button } from "./Button";

function SidePanel() {
  return (
    <>
      <div className="sidepanel">
        <div className="sidepanel-logo">
          <span>Chess</span>
        </div>
        <div className="sidepanel-contents">
          <span>Play</span>
          <span>Puzzle</span>
          <span>Learn</span>
          <span>Watch</span>
          <span>News</span>
          <span>Social</span>
          <span>More</span>
        </div>
        <div className="sidepanel-search">
          <input placeholder="Search..."></input>
        </div>
        <div className="sidepanel-login">
          <Button onClick={() => {}}>SignUp</Button>
          <Button onClick={() => {}}>Login</Button>
        </div>
      </div>
    </>
  );
}

export default SidePanel;
