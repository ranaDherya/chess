import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import axios from "axios";

interface UserContextType {
  userID: string | null;
  userSocket: WebSocket | null;
  gameID: string | null;
  token: string;
  userName: string | null;
  playerColor: string | null; // w-->white and b-->black
  setToken: (token: string) => void;
  setUser: (userID: string, userName: string) => void;
  setSocket: (socket: WebSocket | null) => void;
  setGameID: (gameURL: string | null) => void;
  setPlayerColor: (color: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userID, setUserID] = useState<string | null>(null);
  const [sockt, setSockt] = useState<WebSocket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [tokn, setTokn] = useState<string>("");
  const [color, setColor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const BACKEND_URL = "http://localhost:3000/api";

  // Hydrate auth once so login works seamlessly across all pages (incl. OAuth redirects)
  useEffect(() => {
    if (tokn) return;

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user?.id && user?.token) {
          setUserID(user.id);
          setName(user.name ?? null);
          setTokn(user.token);
          return;
        }
      } catch {
        // ignore and try refresh
      }
    }

    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/auth/refresh`, {
          withCredentials: true,
        });
        if (data?.token && data?.id) {
          setUserID(data.id);
          setName(data.name ?? null);
          setTokn(data.token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: data.id,
              name: data.name,
              token: data.token,
              isGuest: data.isGuest ?? false,
            }),
          );
        }
      } catch {
        // not logged in
      }
    })();
  }, []);

  const setUser = (id: string, name: string) => {
    setUserID(id);
    setName(name);
  };

  const setSocket = (socket: WebSocket | null) => {
    setSockt(socket);
  };

  const setGameID = (gameID: string | null) => {
    setGameId(gameID);
  };

  const setToken = (token: string) => {
    setTokn(token);
  };

  const setPlayerColor = (color: string) => {
    setColor(color);
  };

  const clearUser = () => {
    sockt?.close();
    setSockt(null);
    setGameId(null);
    setTokn("");
    setColor(null);
    setUserID(null);
    setName(null);
  };

  return (
    <UserContext.Provider
      value={{
        userID,
        userSocket: sockt,
        gameID: gameId,
        token: tokn,
        playerColor: color,
        userName: name,
        setToken,
        setUser,
        setSocket,
        setGameID,
        setPlayerColor,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
