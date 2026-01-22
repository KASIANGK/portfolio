// // src/Components/HomeCity/ui/IntroOverlay3Steps.jsx
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";


export default function IntroOverlay3Steps({
  step,
  setStep,
  dontShowAgain,
  setDontShowAgain,
  onEnterRequest,
  onGoPortfolio,
  onGoEssential,
}) {
  const { t, i18n } = useTranslation("intro");

  const isMobile =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(max-width: 640px)")?.matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  
  const isDesktop = !isMobile;

  const canHover =
    typeof window !== "undefined" && window.matchMedia?.("(hover: hover)")?.matches;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const totalSteps = 3;

  // Clamp step (safety)
  useEffect(() => {
    if (!step || step < 1) setStep(1);
    if (step > totalSteps) setStep(totalSteps);
  }, [step, setStep]);

  const uiFont = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const monoFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  const glow = (strength = 1) =>
    `0 0 0 1px rgba(255,0,170,${0.18 * strength}),
     0 0 26px rgba(255,0,170,${0.18 * strength}),
     0 0 70px rgba(124,58,237,${0.12 * strength}),
     0 18px 55px rgba(0,0,0,0.45)`;

  const cyberBtnBase = useMemo(
    () => ({
      height: isMobile ? 48 : 44,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.92)",
      fontWeight: 900,
      cursor: "pointer",
      letterSpacing: isMobile ? 0.08 : 0.18,
      textTransform: isMobile ? "none" : "uppercase",
      fontSize: isMobile ? 14 : 13,
      transition: prefersReducedMotion
        ? "none"
        : "transform 140ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease",
      WebkitTapHighlightColor: "transparent",
    }),
    [isMobile, prefersReducedMotion]
  );

  const cyberBtnHover = (el, mode = "fuchsia") => {
    if (!canHover || !el) return;
    el.style.transform = "translateY(-1px)";
    el.style.filter = "brightness(1.05)";
    el.style.borderColor =
      mode === "blue" ? "rgba(96,165,250,0.55)" : "rgba(255,0,170,0.55)";
    el.style.boxShadow =
      mode === "blue"
        ? "0 0 0 1px rgba(96,165,250,0.16), 0 0 22px rgba(96,165,250,0.14)"
        : "0 0 0 1px rgba(255,0,170,0.18), 0 0 28px rgba(255,0,170,0.16), 0 0 70px rgba(124,58,237,0.12)";
  };

  const cyberBtnLeave = (el) => {
    if (!canHover || !el) return;
    el.style.transform = "translateY(0)";
    el.style.filter = "none";
    el.style.borderColor = "rgba(255,255,255,0.14)";
    el.style.boxShadow = "none";
  };

  const primaryBtn = useMemo(
    () => ({
      ...cyberBtnBase,
      background: `linear-gradient(90deg, rgba(124,58,237,0.92), rgba(255,0,170,0.55))`,
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 10px 30px rgba(124,58,237,0.15)",
    }),
    [cyberBtnBase]
  );

  const neonBtn = useMemo(
    () => ({
      ...cyberBtnBase,
      border: "1px solid rgba(255,0,170,0.40)",
      background: "rgba(255,0,170,0.14)",
    }),
    [cyberBtnBase]
  );

  const wrap = {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(1000px 720px at 20% 20%, rgba(255,0,170,0.14), transparent 60%)," +
      "radial-gradient(950px 700px at 80% 30%, rgba(124,58,237,0.18), transparent 55%)," +
      "radial-gradient(900px 700px at 55% 80%, rgba(96,165,250,0.10), transparent 55%)," +
      "rgba(0,0,0,0.24)",
    color: "white",
    fontFamily: uiFont,
    padding: 16,
    overflow: "hidden", // ✅ prevent page scroll on mobile
    touchAction: "manipulation",
  };

  const card = {
    width: "min(620px, 94vw)",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: 22,
    background: "rgba(0,0,0,0.40)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    boxShadow: glow(1),
    position: "relative",
  };

  const scan = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
    opacity: 0.13,
    mixBlendMode: "overlay",
  };

  const header = {
    padding: isMobile ? 14 : 18,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(700px 360px at 18% 25%, rgba(255,0,170,0.10), transparent 60%)," +
      "radial-gradient(700px 360px at 78% 35%, rgba(124,58,237,0.14), transparent 55%)," +
      "rgba(255,255,255,0.02)",
    position: "relative",
  };

  const appleKicker = { fontSize: 12, letterSpacing: 1.2, opacity: 0.8 };
  const appleTitle = {
    marginTop: 6,
    fontSize: isMobile ? 20 : 22,
    fontWeight: 950,
    letterSpacing: 0.2,
    lineHeight: 1.05,
  };

  const badge = {
    fontSize: 11,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    height: "fit-content",
    whiteSpace: "nowrap",
  };

  const body = {
    padding: isMobile ? 14 : 18,
    display: "grid",
    gap: 12,
    position: "relative",
  };

  const microHint = {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    padding: 12,
    fontFamily: monoFont,
    fontSize: 12,
    opacity: 0.9,
  };

  const stepTitle =
    step === 1 ? t("language.title") : step === 2 ? t("title1") : t("title2");

  const stepSub =
    step === 1 ? t("language.subtitle") : step === 2 ? t("sub1") : t("sub2");

  const stepBadge = t("stepLabel", { current: step, total: totalSteps });

  const setLanguage = async (lng) => {
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem("angels_lang", lng);
    } catch (e) {
      console.warn("[i18n] changeLanguage failed:", e);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={scan} aria-hidden="true" />

        <div style={header}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={appleKicker}>{t("kicker")}</div>
              <div style={appleTitle}>{stepTitle}</div>
              <div style={{ marginTop: 8, opacity: 0.78, fontSize: 13, maxWidth: 540 }}>
                {stepSub}
              </div>
            </div>

            <div style={badge}>
              <span style={{ color: "rgba(255,0,170,1)", fontWeight: 900 }}>●</span>{" "}
              {stepBadge}
            </div>
          </div>
        </div>

        <div style={body}>
          {/* STEP 1: LANGUAGE (no repetition / no big terminal) */}
          {step === 1 && (
            <>
              {/* <div style={microHint}>
                <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>{" "}
                {t("language.microHint")}
              </div> */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                  gap: 10,
                }}
              >
                {[
                  ["fr", t("language.fr")],
                  ["nl", t("language.nl")],
                  ["en", t("language.en")],
                  ["pl", t("language.pl")],
                ].map(([code, label]) => {
                  const active = (i18n.language || "en").startsWith(code);
                  return (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      style={{
                        ...cyberBtnBase,
                        borderColor: active ? "rgba(255,0,170,0.60)" : "rgba(255,255,255,0.14)",
                        background: active ? "rgba(255,0,170,0.12)" : "rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "fuchsia")}
                      onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                    >
                      {label}
                    </button>
                  );
                })}

                <button
                  onClick={() => setStep(2)}
                  style={{ gridColumn: "1 / -1", ...neonBtn }}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "fuchsia")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("language.confirm")}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: INTRO (add BACK to step 1 + reorganize buttons) */}
          {step === 2 && (
            <>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.28)",
                  padding: 14,
                  fontFamily: monoFont,
                  fontSize: 12,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.86)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    top: 10,
                    height: 1,
                    background:
                      "linear-gradient(90deg, transparent, rgba(96,165,250,0.45), rgba(255,0,170,0.45), transparent)",
                    opacity: 0.7,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.boot")}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.mode")}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.hint")}</span>
                </div>
                {/* <div style={{ marginTop: 10, opacity: 0.85 }}>{t("cmd.continue")}</div> */}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={cyberBtnBase}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "blue")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.back")}
                </button>

                <button
                  onClick={() => setStep(3)}
                  style={neonBtn}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "fuchsia")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.nextControls")}
                </button>

                <button
                  onClick={onGoPortfolio}
                  style={{ gridColumn: "1 / -1", ...primaryBtn }}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "fuchsia")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.goPortfolio")}
                </button>

                <button
                  onClick={onGoEssential}
                  style={{ gridColumn: "1 / -1", ...cyberBtnBase }}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "blue")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.goEssential")}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: CONTROLS (unchanged) */}
          {step === 3 && (
            <>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.28)",
                  padding: 14,
                  fontFamily: monoFont,
                  fontSize: 12,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.86)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    top: 10,
                    height: 1,
                    background:
                      "linear-gradient(90deg, transparent, rgba(96,165,250,0.45), rgba(255,0,170,0.45), transparent)",
                    opacity: 0.7,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.move")}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.look")}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                  <span>{t("cmd.esc")}</span>
                </div>
                {isDesktop && (
                  <div style={{ display: "flex", gap: 10, marginTop: 10, opacity: 0.85 }}>
                    <span style={{ color: "rgba(255,0,170,0.95)", fontWeight: 900 }}>›</span>
                    <span>{t("cmd.clickToLock")}</span>
                  </div>
                )}
                {/* <div style={{ marginTop: 10, opacity: 0.85 }}>{t("cmd.enter")}</div> */}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={() => setStep(2)}
                  style={cyberBtnBase}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "blue")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.back")}
                </button>

                <button
                  onClick={onEnterRequest}
                  style={neonBtn}
                  onMouseEnter={(e) => cyberBtnHover(e.currentTarget, "fuchsia")}
                  onMouseLeave={(e) => cyberBtnLeave(e.currentTarget)}
                >
                  {t("buttons.enter")}
                </button>
              </div>
            </>
          )}

          {/* footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 0.92,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "rgb(255,0,170)" }}
              />
              <span style={{ fontSize: 12 }}>{t("footer.dontShowAgain")}</span>
            </label>

            {/* <div style={{ fontSize: 11, opacity: 0.75, textAlign: "right", fontFamily: monoFont }}>
              {t("footer.tip")}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}


