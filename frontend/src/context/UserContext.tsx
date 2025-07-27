import { createContext, useState, useContext, ReactNode } from "react";

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
