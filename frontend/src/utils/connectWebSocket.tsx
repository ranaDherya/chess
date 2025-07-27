const WS_URL = "ws://localhost:8080";

type props = {
  setSocket: (socket: WebSocket | null) => void;
  token: string;
};

export const connectWebSocket = async (props: props) => {
  console.log("inside usesockets");
  console.log("WS URL: ", WS_URL);
  let ws = new WebSocket(`${WS_URL}?token=${props.token}`);

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
