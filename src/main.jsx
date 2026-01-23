import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import i18n from "./i18n";

function BootSplash() {
  return (
    <div
      style={{
        width: 300,
        maxWidth: "calc(100vw - 40px)",
        height: 200,
        display: "grid",
        placeItems: "center",
        background:
        "transparent"
      }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: 999,
          position: "relative",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(120px 90px at 30% 30%, rgba(255,0,170,0.16), transparent 60%)," +
            "radial-gradient(140px 100px at 70% 70%, rgba(0,255,255,0.12), transparent 60%)," +
            "rgba(16, 10, 38, 0.35)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(14px) saturate(130%)",
          WebkitBackdropFilter: "blur(14px) saturate(130%)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,0,170,0.06) inset",
          overflow: "hidden",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        {/* ring animé */}
        <div
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: 999,
            background:
              "conic-gradient(from 0deg, rgba(255,0,170,0.0), rgba(255,0,170,0.65), rgba(0,255,255,0.55), rgba(120,70,255,0.55), rgba(255,0,170,0.0))",
            filter: "blur(0.2px)",
            maskImage:
              "radial-gradient(circle, transparent 58%, #000 60%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 58%, #000 60%)",
            animation: "agSpin 1.2s linear infinite",
          }}
        />

        {/* glow soft */}
        <div
          style={{
            position: "absolute",
            inset: -60,
            background:
              "radial-gradient(420px 260px at 25% 30%, rgba(255,0,170,0.22), transparent 60%)," +
              "radial-gradient(420px 260px at 80% 70%, rgba(0,255,255,0.14), transparent 60%)",
            filter: "blur(18px)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />

        {/* texte */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(245,245,255,0.9)",
            }}
          >
            LOADING
          </div>
          {/* <div
            style={{
              marginTop: 10,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(200,255,255,0.55)",
            }}
          >
            Interactive Portfolio
          </div> */}
        </div>

        {/* keyframes inline */}
        <style>{`
          @keyframes agSpin { 
            to { transform: rotate(360deg); } 
          }
        `}</style>
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




// // src/main.jsx
// import React from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";
// import i18n from "./i18n";

// function BootSplash() {
//   return (
//     <div
//     >
//       <div
//         style={{
//           width: 300,
//           maxWidth: "calc(100vw - 40px)",
//           height: 200,
//           borderRadius: 18,
//           border: "1px solid rgba(255,255,255,0.12)",
//           background:
//             "radial-gradient(420px 240px at 20% 20%, rgba(255,0,170,0.12), transparent 60%), radial-gradient(420px 240px at 80% 70%, rgba(0,255,255,0.10), transparent 60%), rgba(255,255,255,0.03)",
//           backdropFilter: "blur(10px) saturate(130%)",
//           WebkitBackdropFilter: "blur(10px) saturate(130%)",
//           boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
//           display: "grid",
//           placeItems: "center",
//           padding: 16,
//           color: "rgba(245,245,255,0.88)",
//           fontFamily:
//             'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
//           letterSpacing: "0.12em",
//           textTransform: "uppercase",
//           position: "relative",
//           overflow: "hidden",
//         }}
//       >
//         {/* scanlines subtil */}
//         <div
//           style={{
//             position: "absolute",
//             inset: 0,
//             pointerEvents: "none",
//             background:
//               "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 6px)",
//             opacity: 0.12,
//             mixBlendMode: "overlay",
//           }}
//         />

//         <div style={{ display: "grid", gap: 10, justifyItems: "center", zIndex: 1 }}>
//           <div style={{ opacity: 0.9, fontSize: 12 }}>KASIA://INTERACTIVE_PORTFOLIO</div>
//           <div style={{ opacity: 0.75, fontSize: 11 }}>LOADING</div>
//           {/* <div style={{ opacity: 0.9, fontSize: 12 }}>ANGELS GANG</div>
//           <div style={{ opacity: 0.75, fontSize: 11 }}>BOOT</div> */}
//         </div>
//       </div>
//     </div>
//   );
// }

// const root = createRoot(document.getElementById("root"));

// root.render(
//   <React.StrictMode>
//     <BootSplash />
//   </React.StrictMode>
// );

// async function bootstrap() {
//   await i18n.loadNamespaces(["intro", "nav"]);
//   await i18n.loadLanguages(["en", "fr", "pl", "nl"]);

//   root.render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   );
// }

// bootstrap();


