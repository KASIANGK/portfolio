import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import i18n from "./i18n"; // IMPORTANT: exporte ton instance i18n dans ce fichier

async function bootstrap() {
  // Charge ce que tu veux AVANT le premier render
  await i18n.loadNamespaces(["intro", "nav"]);
  // Si tu as une liste fixe de langues:
  await i18n.loadLanguages(["en", "fr", "pl", "nl"]); // adapte à tes LANGS

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
