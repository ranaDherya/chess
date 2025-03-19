import { useEffect } from "react";

type props = {
  wsURL: string | null;
  setSocket: (socket: WebSocket | null) => void;
};

export const useSocket = (props: props) => {
  useEffect(() => {
    let ws: WebSocket;

    const connectWebSocket = () => {
      console.log("WS URL: ", props.wsURL);
      ws = new WebSocket(props.wsURL || "");

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
