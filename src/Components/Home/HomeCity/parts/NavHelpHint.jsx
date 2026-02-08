import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function NavHelpHint({ open, onClose }) {
  const { t } = useTranslation(["nav", "home"]); // ✅ fallback si jamais
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onClose?.(), 5000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [open, onClose]);

  // ✅ on lit d'abord nav, sinon home (au cas où)
  const title =
    t("navGameHelp.title", { ns: "nav", defaultValue: "" }) ||
    t("navGameHelp.title", { ns: "home", defaultValue: "Need a reference point?" });

  const content =
    t("navGameHelp.content", { ns: "nav", defaultValue: "" }) ||
    t("navGameHelp.content", { ns: "home", defaultValue: "Navigation stays available at any time." });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 16,
            right: 256, // ajuste si besoin
            zIndex: 99999,
            width: 320,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(12,10,22,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px) saturate(140%)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            color: "rgba(245,245,255,0.92)",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            pointerEvents: "none" // ✅ pas cliquable, pas de croix
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: "0.08em", opacity: 0.85 }}>
            NAV://HELP
          </div>

          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.35, opacity: 0.95 }}>
            <div
              style={{
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "rgba(0, 220, 255, 0.95)",
                textShadow: "0 0 12px rgba(0, 220, 255, 0.45)"
              }}
            >
              {title}
            </div>

            <div style={{ marginTop: 6, opacity: 0.82 }}>
              {content}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
