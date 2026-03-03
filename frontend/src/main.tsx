import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext.tsx";
import { AuthModalProvider } from "./context/AuthModalContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <AuthModalProvider>
          <App />
        </AuthModalProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
