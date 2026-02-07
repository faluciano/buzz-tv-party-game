# Buzz TV Party Game

The official starter project for [`@party-kit`](https://github.com/faluciano/react-native-party-kit) — a library that turns an Android TV into a local party-game console with phones as controllers.

Buzz is a multiplayer buzzer game that demonstrates the complete `@party-kit` setup: shared reducer, TV host app, phone web controller, and Android build pipeline. Clone it and modify the game logic to build your own party game.

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

### 2. Bundle the Client and Build for Android

This builds the web controller, copies it into the host's Android assets, and runs the app:

```bash
bun run build:android
```

Or run the steps separately:

```bash
# Build & bundle the web controller into host assets
bun run bundle:client

# Run the host on an ADB-connected device
cd packages/host && npx expo run:android
```

### 3. Connect and Play

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
bun run prebuild        # Generate native project files (run once, or after adding native deps)
bun run android         # Run on Android device/emulator
bun run start           # Start Expo development server
```

### Project Architecture

The game uses a Redux-like pattern with a shared reducer:

- **State**: `{ status: string, players: Record<string, IPlayer>, score: number }`
- **Actions**:
  - `BUZZ`: Increments the score by 1
  - `RESET`: Resets the score to 0
  - `PLAYER_JOINED`: Adds a player to the state (dispatched automatically by `@party-kit/host`)
  - `PLAYER_LEFT`: Marks a player as disconnected (dispatched automatically by `@party-kit/host`)

The reducer runs on both the TV (host) and web controller (client), ensuring both sides stay in sync.

## Package Details

### @my-game/shared
Contains the game state interface, actions, and reducer. This ensures both host and client use the same logic.

### @my-game/host
React Native app for Android TV. Uses `@party-kit/host` to:
- Start a WebSocket server
- Serve the web controller files
- Manage game state
- Display the game UI

### @my-game/client
Vite + React web app for smartphones. Uses `@party-kit/client` to:
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
The web controller wasn't bundled into the host. Run:
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

## Current Status

- @party-kit/host: ^0.2.0
- @party-kit/client: ^0.2.0
- @party-kit/core: 0.1.0
- Expo SDK: 54
- React Native: 0.81.5

Build your own party games by modifying the game reducer in `packages/shared/index.ts`. Add new actions, change the scoring logic, or create entirely new game modes! See the [`@party-kit` documentation](https://github.com/faluciano/react-native-party-kit) for the full API reference.
