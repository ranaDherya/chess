import { createContext, useState, useContext, ReactNode } from "react";

interface UserContextType {
  userID: string | null;
  userSocket: WebSocket | null;
  gameID: string | null;
  token: string;
  setToken: (token: string) => void;
  setUser: (userID: string) => void;
  setSocket: (socket: WebSocket | null) => void;
  setGameID: (gameURL: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userID, setUserID] = useState<string | null>(null);
  const [sockt, setSockt] = useState<WebSocket | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [tokn, setTokn] = useState<string>("");

  const setUser = (id: string) => {
    setUserID(id);
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

  return (
    <UserContext.Provider
      value={{
        userID,
        userSocket: sockt,
        gameID: gameId,
        token: tokn,
        setToken,
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
