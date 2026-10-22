import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./adventure-ui.css";

const root = createRoot(document.getElementById("root")!);
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("design-preview")) {
  import("./design-preview").then(({ DesignPreview }) => root.render(<DesignPreview />));
} else {
  root.render(<App />);
}
