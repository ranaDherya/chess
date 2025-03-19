import { createContext, useState, useContext, ReactNode } from "react";

interface UserContextType {
  userID: string | null;
  wsURL: string | null;
  userSocket: WebSocket | null;
  gameID: string | null;
  setUser: (userID: string, wsURL: string) => void;
  setSocket: (socket: WebSocket | null) => void;
  setGameID: (gameURL: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userID, setUserID] = useState<string | null>(null);
  const [wsURL, setWsURL] = useState<string | null>(null);
  const [sockt, setSockt] = useState<WebSocket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const setUser = (id: string, url: string) => {
    setUserID(id);
    setWsURL(url);
  };

  const setSocket = (socket: WebSocket | null) => {
    setSockt(socket);
  };

  const setGameID = (gameID: string | null) => {
    setGameId(gameID);
  };

  return (
    <UserContext.Provider
      value={{
        userID,
        wsURL,
        userSocket: sockt,
        gameID: gameId,
        setUser,
        setSocket,
        setGameID,
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
