import React from "react";
import { Button } from "./Button";
import { useUser } from "../context/UserContext";
import { useAuthModal } from "../context/AuthModalContext";

import "./SidePanel.css";

function SidePanel() {
  const { token, clearUser } = useUser();
  const authModal = useAuthModal();
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
                  authModal.open({ reason: "Create an account or continue as guest." });
                }}
              >
                SignUp
              </Button>
              <Button
                onClick={() => {
                  authModal.open({ reason: "Welcome back. Sign in to continue." });
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
