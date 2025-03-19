import "./App.css";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Game from "./pages/Game";
import Header from "./components/Header";

function App() {
  return (
    <>
      <Header />
      <div className="">
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
