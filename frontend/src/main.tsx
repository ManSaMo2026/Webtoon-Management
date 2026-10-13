
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { initializeFontSizePreference } from "./utils/fontSize.ts";

  initializeFontSizePreference();
  createRoot(document.getElementById("root")!).render(<App />);

