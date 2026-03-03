import "./App.css";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Play from "./pages/Play";
import SidePanel from "./components/SidePanel";
import GithubCallback from "./pages/GithubCallback";

function App() {
  return (
    <>
      <div className="app">
        <SidePanel />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play" element={<Play />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/github/callback" element={<GithubCallback />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
