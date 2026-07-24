import { useMemo } from "react";
import { useGameClient, createRelayTransport } from "@couch-kit/client";
import { gameReducer, initialState } from "@my-game/shared";

// Default relay endpoint for cross-network play. Override at build time with
// VITE_RELAY_URL, or per-link with a `&relay=wss://...` query param.
const DEFAULT_RELAY_URL =
  (import.meta.env.VITE_RELAY_URL as string | undefined) ??
  "wss://couch-kit-relay.icycliff-4c194e2e.eastus.azurecontainerapps.io";

/**
 * Cross-network relay is **opt-in** via `?room=CODE` in the controller URL
 * (the browser display links to it). Without a room code the controller
 * connects over the default LAN WebSocket, exactly as before.
 */
function readRelayConfig(): { roomId: string; url: string } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  if (!room) return null;
  return { roomId: room, url: params.get("relay") ?? DEFAULT_RELAY_URL };
}

export default function App() {
  const relay = useMemo(readRelayConfig, []);
  const createTransport = useMemo(
    () =>
      relay
        ? createRelayTransport({ url: relay.url, roomId: relay.roomId })
        : undefined,
    [relay],
  );

  const { state, sendAction, status } = useGameClient({
    reducer: gameReducer,
    initialState,
    debug: true,
    createTransport,
  });

  const handleBuzz = () => {
    sendAction({ type: "BUZZ" });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "2rem" }}>Buzz Controller</h1>

      <button
        onClick={handleBuzz}
        style={{
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#ef4444",
          color: "white",
          fontSize: "2rem",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          transition: "transform 0.1s",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        PRESS ME
      </button>

      <div style={{ marginTop: "2rem", fontSize: "1.5rem" }}>
        Current Score: {state.score}
      </div>

      <div
        style={{
          marginTop: "1rem",
          fontSize: "0.875rem",
          color: status === "connected" ? "#4ade80" : "#ef4444",
        }}
      >
        {relay ? `Relay room ${relay.roomId}` : "LAN"}: {status}
      </div>
    </div>
  );
}
