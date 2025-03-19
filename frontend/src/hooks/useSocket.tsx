import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;

    const connectWebSocket = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("✅ WebSocket Connected");
        setSocket(ws);
      };

      ws.onclose = () => {
        console.log("❌ WebSocket Disconnected. Reconnecting...");
        setSocket(null);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket Error", error);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      ws.close();
    };
  }, []);

  return socket;
};
