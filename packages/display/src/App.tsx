import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import {
  gameReducer,
  initialState,
  type GameState,
  type GameAction,
} from "@my-game/shared";
import { RelayDisplayHost } from "@couch-kit/display";

const RELAY_URL =
  import.meta.env.VITE_RELAY_URL ??
  "wss://couch-kit-relay.icycliff-4c194e2e.eastus.azurecontainerapps.io";

// Base URL of the deployed controller. The join link appends `?room=CODE`.
const CONTROLLER_URL = import.meta.env.VITE_CONTROLLER_URL ?? "";

// Unambiguous room code (no easily-confused characters).
function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 4 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export default function App() {
  const [{ display, roomId }] = useState(() => {
    const roomId = makeRoomCode();
    const display = new RelayDisplayHost<GameState, GameAction>({
      url: RELAY_URL,
      roomId,
      reducer: gameReducer,
      initialState,
    });
    return { display, roomId };
  });

  useEffect(() => () => display.stop(), [display]);

  const state = useSyncExternalStore(display.subscribe, display.getState);
  const players = Object.values(state.players).filter((p) => p.connected);
  const joinUrl = CONTROLLER_URL
    ? `${CONTROLLER_URL}${CONTROLLER_URL.includes("?") ? "&" : "?"}room=${roomId}`
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        gap: "1.5rem",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "3rem" }}>Buzz</h1>

      <div style={{ textAlign: "center" }}>
        {joinUrl && (
          <div style={{ fontSize: "1rem", opacity: 0.7, marginBottom: "0.75rem" }}>
            Scan to join
          </div>
        )}
        {joinUrl && (
          <div
            style={{
              display: "inline-block",
              padding: "1rem",
              backgroundColor: "white",
              borderRadius: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <QRCode value={joinUrl} size={200} />
          </div>
        )}
        <div style={{ fontSize: "1rem", opacity: 0.7 }}>
          {joinUrl ? "or enter room code" : "Join with room code"}
        </div>
        <div style={{ fontSize: "5rem", fontWeight: 800, letterSpacing: "0.5rem" }}>
          {roomId}
        </div>
        {joinUrl ? (
          <a href={joinUrl} style={{ color: "#38bdf8", fontSize: "0.9rem" }}>
            {joinUrl}
          </a>
        ) : (
          <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>
            Open the controller with <code>?room={roomId}</code>
          </div>
        )}
      </div>

      <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
        Score: {state.score}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1rem", opacity: 0.7, marginBottom: "0.5rem" }}>
          Players ({players.length})
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          {players.length === 0 ? (
            <span style={{ opacity: 0.5 }}>Waiting for players…</span>
          ) : (
            players.map((p) => (
              <span
                key={p.id}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "999px",
                  backgroundColor: "#1e293b",
                }}
              >
                {p.avatar ?? "🙂"} {p.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
