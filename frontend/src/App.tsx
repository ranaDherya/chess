import "./App.css";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
// import Header from "./components/Header";
import SidePanel from "./components/SidePanel";

function App() {
  return (
    <>
      <div className="app">
        <SidePanel />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
