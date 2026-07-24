import ReactDOM from "react-dom/client";
import App from "./App";

// Note: no React.StrictMode here — the display owns a single relay connection /
// room, and StrictMode's dev double-mount would create a second, orphaned one.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
