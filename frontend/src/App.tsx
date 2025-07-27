import "./App.css";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import SidePanel from "./components/SidePanel";
import { useEffect, useState } from "react";
import LoginModal from "./components/LoginModal";
import { useUser } from "./context/UserContext";
import GithubCallback from "./pages/GithubCallback";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { token, setUser, setToken } = useUser();

  useEffect(() => {
    if (token) return;
    else {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user.id, user.name);
        setToken(user.token);
      }
    }
  });
  return (
    <>
      <div className="app">
        {showLoginModal && (
          <LoginModal
            closeModal={() => {
              setShowLoginModal(false);
            }}
          />
        )}
        <SidePanel
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Landing
                showLoginModal={showLoginModal}
                setShowLoginModal={setShowLoginModal}
              />
            }
          />
          <Route
            path="/game"
            element={<Game setShowLoginModal={setShowLoginModal} />}
          />
          <Route
            path="/game/:id"
            element={<Game setShowLoginModal={setShowLoginModal} />}
          />
          <Route path="/github/callback" element={<GithubCallback />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
