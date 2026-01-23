// src/Components/HomeCity/HomeCity/parts/NavHelpHint.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavHelpHint({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 8000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            top: 16,
            right: 16,      // 👈 adapte selon ta Navbar
            zIndex: 99999,
            width: 280,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(12,10,22,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px) saturate(140%)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            color: "rgba(245,245,255,0.92)",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", opacity: 0.9 }}>
              NAV://HELP
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(245,245,255,0.75)",
                cursor: "pointer",
                fontSize: 14,
              }}
              aria-label="Close help"
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.35 }}>
            <div><b>ESC</b> : quitter le contrôle tête</div>
            <div><b>Click</b> : reprendre le contrôle tête</div>
            <div><b>Flèches</b> : bouger</div>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, opacity: 0.78 }}>
            (Tu peux rouvrir via la Navbar)
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
