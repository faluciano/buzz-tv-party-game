import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  GameHostProvider,
  useGameHost,
  useExtractAssets,
} from "@couch-kit/host";
import QRCode from "react-native-qrcode-svg";
import manifest from "./src/www-manifest.json";
import { gameReducer, initialState } from "@my-game/shared";

const GameScreen = () => {
  const { state, serverUrl, serverError } = useGameHost();

  // Append /index to the server URL for the client page
  const clientUrl = serverUrl ? `${serverUrl}/index` : null;
  const connectedPlayers = Object.values(state.players).filter(
    (p) => p.connected,
  ).length;

  useEffect(() => {
    console.log("[Buzz] GameScreen mounted");
    console.log("[Buzz] serverUrl:", serverUrl);
    console.log("[Buzz] clientUrl:", clientUrl);
    console.log("[Buzz] serverError:", serverError?.message || "none");
  }, [serverUrl, clientUrl, serverError]);

  if (serverError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Server Error: {serverError.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <Text style={styles.title}>Buzz</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{state.score}</Text>
          </View>
          <Text style={styles.playerCount}>Players: {connectedPlayers}</Text>
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.subtitle}>Scan to Join</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={clientUrl || "waiting..."}
              size={160}
              color="black"
              backgroundColor="white"
            />
          </View>
          <Text style={styles.urlText}>
            {clientUrl || "Starting server..."}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function App() {
  const { staticDir, loading, error } = useExtractAssets(manifest);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ade80" />
        <Text style={styles.loadingText}>Preparing game assets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <GameHostProvider
      config={{ reducer: gameReducer, initialState, staticDir, debug: true }}
    >
      <GameScreen />
    </GameHostProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 40,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  leftPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightPanel: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    color: "#aaaaaa",
    marginBottom: 12,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
  },
  urlText: {
    fontSize: 14,
    color: "#888888",
    marginTop: 12,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 24,
    color: "#dddddd",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 96,
    fontWeight: "bold",
    color: "#4ade80",
  },
  playerCount: {
    fontSize: 18,
    color: "#888888",
  },
  loadingText: {
    fontSize: 20,
    color: "#aaaaaa",
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
