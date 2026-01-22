// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import i18n from "./i18n";

function BootSplash() {
  return (
    <div
    >
      <div
        style={{
          width: 300,
          maxWidth: "calc(100vw - 40px)",
          height: 200,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "radial-gradient(420px 240px at 20% 20%, rgba(255,0,170,0.12), transparent 60%), radial-gradient(420px 240px at 80% 70%, rgba(0,255,255,0.10), transparent 60%), rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px) saturate(130%)",
          WebkitBackdropFilter: "blur(10px) saturate(130%)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
          display: "grid",
          placeItems: "center",
          padding: 16,
          color: "rgba(245,245,255,0.88)",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* scanlines subtil */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 6px)",
            opacity: 0.12,
            mixBlendMode: "overlay",
          }}
        />

        <div style={{ display: "grid", gap: 10, justifyItems: "center", zIndex: 1 }}>
          <div style={{ opacity: 0.9, fontSize: 12 }}>ANGELS GANG</div>
          <div style={{ opacity: 0.75, fontSize: 11 }}>BOOT</div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BootSplash />
  </React.StrictMode>
);

async function bootstrap() {
  await i18n.loadNamespaces(["intro", "nav"]);
  await i18n.loadLanguages(["en", "fr", "pl", "nl"]);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();





// import React from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";
// import i18n from "./i18n"; // IMPORTANT: exporte ton instance i18n dans ce fichier

// async function bootstrap() {
//   // Charge ce que tu veux AVANT le premier render
//   await i18n.loadNamespaces(["intro", "nav"]);
//   // Si tu as une liste fixe de langues:
//   await i18n.loadLanguages(["en", "fr", "pl", "nl"]); // adapte à tes LANGS

//   createRoot(document.getElementById("root")).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   );
// }

// bootstrap();
