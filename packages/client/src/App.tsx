import { useMemo } from "react";
import {
  useGameClient,
  createRelayTransport,
  useRelayRoom,
  describeRelayError,
} from "@couch-kit/client";
import { gameReducer, initialState } from "@my-game/shared";
import { JoinScreen } from "./JoinScreen";

// Default relay endpoint for cross-network play. Override at build time with
// VITE_RELAY_URL, or per-link with a `&relay=wss://...` query param.
const DEFAULT_RELAY_URL =
  (import.meta.env.VITE_RELAY_URL as string | undefined) ??
  "wss://couch-kit-relay.faluciano.workers.dev";

/**
 * Relay play is chosen by room code: `?room=CODE` (what the display's QR links
 * to) or typed on the join screen. `&relay=wss://...` overrides the endpoint.
 *
 * With no code we show the join screen rather than attempting a LAN connection:
 * a hosted controller has no LAN host to reach, so that attempt can only hang.
 */
function relayEndpoint(): string {
  if (typeof window === "undefined") return DEFAULT_RELAY_URL;
  return (
    new URLSearchParams(window.location.search).get("relay") ?? DEFAULT_RELAY_URL
  );
}

export default function App() {
  const { roomId, setRoomId } = useRelayRoom();

  // The client is only mounted once a room exists. Rendering the join screen
  // while `useGameClient` runs is not enough — with no relay transport it falls
  // back to the LAN socket and retries a host that cannot exist here, and those
  // retries stomp on the status the join screen is trying to report.
  if (!roomId) return <JoinScreen onJoin={setRoomId} />;

  return <Controller key={roomId} roomId={roomId} onRejoin={setRoomId} />;
}

function Controller({
  roomId,
  onRejoin,
}: {
  readonly roomId: string;
  readonly onRejoin: (code: string) => void;
}) {
  const url = useMemo(relayEndpoint, []);
  const createTransport = useMemo(
    () => createRelayTransport({ url, roomId }),
    [url, roomId],
  );

  const { state, sendAction, status, disconnectReason } = useGameClient({
    reducer: gameReducer,
    initialState,
    debug: true,
    createTransport,
  });

  // A terminal relay failure (wrong or expired code, full room) is worth
  // explaining; an ordinary drop is retried and needs no screen.
  const joinError = describeRelayError(disconnectReason);
  if (joinError) return <JoinScreen onJoin={onRejoin} error={joinError} />;

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
        {`Room ${roomId}`}: {status}
      </div>
    </div>
  );
}
