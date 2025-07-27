import React from "react";
import { Button } from "./Button";
import { useUser } from "../context/UserContext";

import "./SidePanel.css";

type Props = {
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
};

function SidePanel({ showLoginModal, setShowLoginModal }: Props) {
  const { token, clearUser } = useUser();
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
          {!token && (
            <>
              <Button
                onClick={() => {
                  setShowLoginModal(!showLoginModal);
                }}
              >
                SignUp
              </Button>
              <Button
                onClick={() => {
                  setShowLoginModal(!showLoginModal);
                }}
              >
                Login
              </Button>
            </>
          )}
          {token && (
            <div className="logout-btn">
              <Button
                onClick={() => {
                  clearUser();
                  localStorage.removeItem("user");
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SidePanel;
