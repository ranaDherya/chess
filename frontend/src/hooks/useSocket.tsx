import { useEffect } from "react";
import { useUser } from "../context/UserContext";

const WS_URL = "ws://localhost:8080";

type props = {
  setSocket: (socket: WebSocket | null) => void;
};

export const useSocket = (props: props) => {
  const user = useUser();
  console.log("inside usesockets");
  useEffect(() => {
    let ws: WebSocket;

    const connectWebSocket = () => {
      console.log("WS URL: ", WS_URL);
      ws = new WebSocket(`${WS_URL}?token=${user.token}`);

      ws.onopen = () => {
        console.log("✅ WebSocket Connected");
        props.setSocket(ws);
      };

      ws.onclose = () => {
        console.log("❌ WebSocket Disconnected. Reconnecting...");
        props.setSocket(null);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket Error", error);
        props.setSocket(null);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      props.setSocket(null);
      ws.close();
    };
  }, []);
};
