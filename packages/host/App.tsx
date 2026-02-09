import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { GameHostProvider, useGameHost } from "@couch-kit/host";
import QRCode from "react-native-qrcode-svg";
import RNFS from "react-native-fs";
import { gameReducer, initialState } from "@my-game/shared";

/**
 * Recursively copy a directory from Android APK assets to the real filesystem.
 * Required because RNFS.copyFileAssets only copies individual files, not directories.
 */
async function copyAssetsDirectory(
  assetDir: string,
  destDir: string,
): Promise<void> {
  // Ensure the destination directory exists
  const destExists = await RNFS.exists(destDir);
  if (!destExists) {
    await RNFS.mkdir(destDir);
  }

  const entries = await RNFS.readDirAssets(assetDir);

  for (const entry of entries) {
    const assetPath = assetDir ? `${assetDir}/${entry.name}` : entry.name;
    const destPath = `${destDir}/${entry.name}`;

    if (entry.isDirectory()) {
      await copyAssetsDirectory(assetPath, destPath);
    } else {
      await RNFS.copyFileAssets(assetPath, destPath);
    }
  }
}

/**
 * Hook that extracts the bundled www/ assets from the APK to the device filesystem.
 * Only runs on Android. On iOS, returns undefined (the library default works).
 */
function useExtractAssets() {
  const [staticDir, setStaticDir] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(Platform.OS === "android");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const extract = async () => {
      try {
        const destDir = `${RNFS.DocumentDirectoryPath}/www`;
        console.log(
          "[Buzz] DocumentDirectoryPath:",
          RNFS.DocumentDirectoryPath,
        );
        console.log("[Buzz] Extracting assets to:", destDir);

        // Always re-extract to ensure fresh assets after app updates
        const exists = await RNFS.exists(destDir);
        if (exists) {
          console.log("[Buzz] Removing old www directory");
          await RNFS.unlink(destDir);
        }

        // Check if www assets exist in the APK
        const hasAssets = await RNFS.existsAssets("www");
        console.log("[Buzz] APK has www assets:", hasAssets);
        if (!hasAssets) {
          setError(
            'No www assets found in APK. Run "bun run bundle:client" first.',
          );
          setLoading(false);
          return;
        }

        await copyAssetsDirectory("www", destDir);

        // Verify extraction — list all files recursively
        const listRecursive = async (
          dir: string,
          prefix = "",
        ): Promise<string[]> => {
          const entries = await RNFS.readDir(dir);
          const results: string[] = [];
          for (const entry of entries) {
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
              results.push(`${rel}/ (dir)`);
              results.push(...(await listRecursive(entry.path, rel)));
            } else {
              results.push(`${rel} (${entry.size}B)`);
            }
          }
          return results;
        };

        const allFiles = await listRecursive(destDir);
        console.log(
          "[Buzz] All extracted files:",
          JSON.stringify(allFiles, null, 2),
        );

        // Verify index.html is readable
        const indexPath = `${destDir}/index.html`;
        const indexExists = await RNFS.exists(indexPath);
        console.log("[Buzz] index.html exists:", indexExists, "at", indexPath);
        if (indexExists) {
          const indexContent = await RNFS.readFile(indexPath, "utf8");
          console.log("[Buzz] index.html size:", indexContent.length, "chars");
          console.log(
            "[Buzz] index.html preview:",
            indexContent.substring(0, 200),
          );
        }

        setStaticDir(destDir);
        console.log("[Buzz] staticDir set to:", destDir);
        setLoading(false);
      } catch (e) {
        console.error("[Buzz] Asset extraction failed:", (e as Error).message);
        setError(`Failed to extract assets: ${(e as Error).message}`);
        setLoading(false);
      }
    };

    extract();
  }, []);

  return { staticDir, loading, error };
}

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
  const { staticDir, loading, error } = useExtractAssets();

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
