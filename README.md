# Buzz TV Party Game

The official starter project for [`@couch-kit`](https://github.com/faluciano/react-native-couch-kit) — a library that turns an Android TV into a local party-game console with phones as controllers.

Buzz is a multiplayer buzzer game that demonstrates the complete `@couch-kit` setup: shared reducer, TV host app, phone web controller, and Android build pipeline. Clone it and modify the game logic to build your own party game.

## How It Works

- **TV (Host)**: Runs on Android TV and displays the game state
- **Smartphones (Controllers)**: Connect via QR code and act as buzzers
- **Real-time Sync**: All devices stay synchronized via WebSocket

## Project Structure

```
Buzz/
├── packages/
│   ├── shared/          # Shared game logic and types
│   ├── host/            # Android TV React Native app
│   └── client/          # Web controller for smartphones
├── package.json         # Root workspace configuration
└── README.md           # This file
```

## Prerequisites

- **Bun** (v1.3.5 or later) - [Install Bun](https://bun.sh/)
- **JDK 17** - Required by Gradle for the Android build
  ```bash
  brew install openjdk@17
  sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
  ```
- **Android SDK** with `ANDROID_HOME` set
- **ADB** connected device or Android TV emulator

### Environment Variables

Add the following to your shell config (`~/.config/fish/config.fish` for Fish, or `~/.zshrc` for Zsh):

```bash
# Fish
set -gx JAVA_HOME (brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home
set -gx ANDROID_HOME ~/Library/Android/sdk

# Zsh / Bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=~/Library/Android/sdk
```

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Generate the Native Android Project (First Time Only)

Expo needs to generate the native Android project files before you can build. Run this once after cloning, or whenever you add/change native dependencies or Expo plugins:

```bash
cd packages/host
bun run prebuild
```

> **Important:** `expo prebuild` clears and regenerates the `android/` directory. Any files previously placed there (including bundled client assets) will be deleted. Always run `prebuild` **before** bundling the client.

### 3. Bundle the Client and Build for Android

After prebuild has generated the native project, bundle the web controller into the host's Android assets and build the app:

```bash
bun run bundle:client
bun run build:android
```

Or run each step individually:

```bash
# Build & bundle the web controller into host assets
bun run bundle:client

# Run the host on an ADB-connected device
cd packages/host && npx expo run:android
```

For a complete first-time build from a fresh clone:

```bash
bun install
cd packages/host && bun run prebuild && cd ../..
bun run bundle:client
cd packages/host && npx expo run:android
```

### 4. Connect and Play

1. The TV/device will display a QR code and a URL
2. Scan the QR code with your phone (or open the URL in a browser on the same network)
3. Press the buzz button on your phone
4. Watch the score increase on the host!

## Verification

To verify everything is set up correctly:

```bash
# 1. Verify dependencies are installed
bun install

# 2. Verify TypeScript compilation
cd packages/client && bun run build
# Should show: "built in XXXms" with no errors

# 3. Verify shared package types
cd packages/shared && npx tsc --noEmit
# Should complete with no output (success)

# 4. Start the client dev server
cd packages/client && bun run dev
# Should start on http://localhost:5173
```

**Build Status**: ✅ Client builds successfully  
**Type Checking**: ✅ All packages typecheck successfully

## Development

### Dev Mode (Hot Reloading)

For iterating on the client without rebuilding the Android app each time:

1. Start the Vite dev server:
   ```bash
   bun run dev:client
   ```
2. Update `packages/host/App.tsx` to enable dev mode:
   ```tsx
   <GameHostProvider config={{
     reducer: gameReducer,
     initialState,
     devMode: true,
     devServerUrl: "http://<YOUR_LAPTOP_IP>:5173",
   }}>
   ```
3. Run the host on the device -- phones will be pointed at your laptop's Vite server instead.

### Production Build

```bash
# Full pipeline: build client, bundle into host, compile Android APK
bun run build:android
```

### Available Scripts

**Root Level:**

```bash
bun install              # Install all dependencies
bun run dev:client       # Start client Vite dev server
bun run build:client     # Build client for production
bun run bundle:client    # Build + copy client into host Android assets
bun run build:android    # bundle:client + expo run:android
```

**Client (Web Controller):**

```bash
cd packages/client
bun run dev             # Start development server
bun run build           # Build for production
bun run preview         # Preview production build
```

**Host (Android TV - Expo):**

```bash
cd packages/host
bun run prebuild        # Generate native project files (first time, or after adding native deps/plugins)
                        # WARNING: This clears the android/ directory — re-run bundle:client afterward
bun run android         # Run on Android device/emulator
bun run start           # Start Expo development server
```

### Project Architecture

The game uses a Redux-like pattern with a shared reducer:

- **State**: `{ status: string, players: Record<string, IPlayer>, score: number }`
- **Actions**:
  - `BUZZ`: Increments the score by 1
  - `RESET`: Resets the score to 0
  - `PLAYER_JOINED`: Adds a player to the state (dispatched automatically by `@couch-kit/host`)
  - `PLAYER_LEFT`: Marks a player as disconnected (dispatched automatically by `@couch-kit/host`)

The reducer runs on both the TV (host) and web controller (client), ensuring both sides stay in sync.

## Package Details

### @my-game/shared

Contains the game state interface, actions, and reducer. This ensures both host and client use the same logic.

### @my-game/host

React Native app for Android TV. Uses `@couch-kit/host` to:

- Start a WebSocket server
- Serve the web controller files
- Manage game state
- Display the game UI

### @my-game/client

Vite + React web app for smartphones. Uses `@couch-kit/client` to:

- Connect to the TV via WebSocket
- Display the controller UI
- Send actions (BUZZ) to the host

## Troubleshooting

### JDK version error ("Unsupported class file major version")

Gradle requires JDK 17. Verify with:

```bash
$JAVA_HOME/bin/java -version  # Should show 17.x.x
```

If wrong, set `JAVA_HOME` to JDK 17 (see Prerequisites above).

### Android SDK not found

Set the `ANDROID_HOME` environment variable (see Prerequisites above).

### Client page is blank after scanning QR code

The web controller wasn't bundled into the host. This can happen if you ran `expo prebuild` after `bundle:client`, since prebuild clears the `android/` directory. Fix by re-bundling:

```bash
bun run bundle:client
```

Then rebuild the Android app.

### WebSocket connection fails

Ensure both devices are on the same WiFi network. The host device acts as the server, so it needs to be discoverable on the local network.

### Metro bundler port conflict

If port 8081 is already in use, Expo will prompt to use an alternative port. You can also clear Metro cache:

```bash
cd packages/host
bun run start --reset-cache
```

## License

MIT

Build your own party games by modifying the game reducer in `packages/shared/index.ts`. Add new actions, change the scoring logic, or create entirely new game modes! See the [`@couch-kit` documentation](https://github.com/faluciano/react-native-couch-kit) for the full API reference.
