import { useState, type FormEvent } from "react";

/**
 * Shown when the controller has no room to join — either it was opened without
 * `?room=CODE`, or the relay rejected the code it had.
 *
 * A hosted controller has no LAN host to fall back to, so without this it can
 * only sit on "connecting" forever. Asking for the code is the difference
 * between a dead app and a one-line fix the player can perform themselves.
 */
export function JoinScreen({
  onJoin,
  error,
}: {
  readonly onJoin: (code: string) => void;
  readonly error?: string | null;
}) {
  const [code, setCode] = useState("");
  const trimmed = code.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trimmed.length === 0) return;
    onJoin(trimmed);
  };

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>Buzz</h1>
      <p style={styles.hint}>Scan the QR code on the screen, or enter its room code:</p>

      <form onSubmit={submit} style={styles.form}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD"
          aria-label="Room code"
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={12}
          style={styles.input}
        />
        <button type="submit" disabled={trimmed.length === 0} style={styles.button}>
          Join
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  screen: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    padding: "1.5rem",
    boxSizing: "border-box",
    backgroundColor: "#1a1a1a",
    color: "white",
    fontFamily: "system-ui, sans-serif",
  },
  title: { margin: "0 0 0.5rem", fontSize: "2.5rem" },
  hint: {
    margin: "0 0 1.5rem",
    color: "#9ca3af",
    fontSize: "1rem",
    textAlign: "center",
    maxWidth: "22rem",
    lineHeight: 1.4,
  },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem", width: "min(18rem, 100%)" },
  input: {
    fontSize: "2rem",
    textAlign: "center",
    letterSpacing: "0.4em",
    textIndent: "0.4em",
    textTransform: "uppercase",
    padding: "0.75rem",
    borderRadius: "0.75rem",
    border: "2px solid #374151",
    backgroundColor: "#111827",
    color: "white",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    padding: "0.75rem",
    borderRadius: "0.75rem",
    border: "none",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
  error: {
    marginTop: "1.25rem",
    color: "#fca5a5",
    fontSize: "1rem",
    textAlign: "center",
    maxWidth: "22rem",
    lineHeight: 1.4,
  },
} satisfies Record<string, React.CSSProperties>;
