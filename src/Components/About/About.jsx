// src/Pages/About/About.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { motion } from "framer-motion";
import "./About.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Model from "./Model/Model";

export default function About() {
  const { t } = useTranslation("about");
  const [expExpanded, setExpExpanded] = useState(false);
  const [expCollapsedHeight, setExpCollapsedHeight] = useState(null);
  const bioRef = useRef(null);
  const [leftFreezeH, setLeftFreezeH] = useState(null);
  const canvasPanelRef = useRef(null);

  const [closedBioH, setClosedBioH] = useState(null);
  const [canvasH, setCanvasH] = useState(null);

  // freeze height only when experience is collapsed
  useLayoutEffect(() => {
    const bio = bioRef.current;
    const canvasPanel = canvasPanelRef.current;
    if (!bio || !canvasPanel) return;

    if (expExpanded) return; // ✅ ne pas recalculer quand on ouvre

    const update = () => {
      setClosedBioH(bio.getBoundingClientRect().height);
      setCanvasH(canvasPanel.getBoundingClientRect().height);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(bio);
    ro.observe(canvasPanel);

    return () => ro.disconnect();
  }, [expExpanded]);

  const expBoxRef = useRef(null);
  const stackBoxRef = useRef(null);

  const images = useMemo(() => ["/assets/s.jpg", "/assets/aura.jpg"], []);
  const [currentImage, setCurrentImage] = useState(images[0]);
  
  useEffect(() => {
    ["/assets/s.jpg", "/assets/aura.jpg", "/assets/eyes.png"].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);
  
  const canvasRef = useRef(null);

  const [isCanvasHover, setIsCanvasHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Glow cursor (orb)
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    visible: false,
    opacity: 0,
  });
  const lastPosRef = useRef({ x: 0, y: 0, t: performance.now() });

  // Play hint -> ne disparaît QUE quand on entre sur le canvas
  const [showPlayHint, setShowPlayHint] = useState(true);

  const handlePointerMove = useCallback((event) => {
    const el = canvasRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // R3F normalized coords [-1..1]
    const nx = (x / rect.width) * 2 - 1;
    const ny = -((y / rect.height) * 2 - 1);
    setMousePosition({ x: nx, y: ny });

    // Speed-based fade (faster = more transparent)
    const now = performance.now();
    const lp = lastPosRef.current;
    const dx = x - lp.x;
    const dy = y - lp.y;
    const dt = Math.max(16, now - lp.t);
    const speed = Math.hypot(dx, dy) / dt; // px per ms

    const fadeRaw = 1 - speed * 1.2; // moins agressif que 1.8
    const fade = Math.max(0.55, Math.min(1, fadeRaw)); // ✅ floor à 0.55

    lastPosRef.current = { x, y, t: now };

    setCursor({
      x,
      y,
      visible: true,
      opacity: fade,
    });
  }, []);

  // Pointer move seulement quand hover canvas
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onMove = (e) => {
      if (!isCanvasHover) return;
      handlePointerMove(e);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [handlePointerMove, isCanvasHover]);

  useEffect(() => {
    const compute = () => {
      const stackEl = stackBoxRef.current;
      if (!stackEl) return;

      // hauteur totale de la box "Stack"
      const h = Math.ceil(stackEl.getBoundingClientRect().height);
      setExpCollapsedHeight(h);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    console.log("MOUNT About");
    return () => console.log("UNMOUNT About");
  }, []);

  return (
    <div className="about-container-all">
      <header className="about-title">
        <h1 className="about-titleText">{t("title")}</h1>
      </header>

      <div className="about-container">
        <aside
          className="aboutEditorial"
          style={
            closedBioH && canvasH
              ? {
                  "--aboutBioClosedH": `${closedBioH}px`,
                  "--aboutCanvasH": `${canvasH}px`,
                }
              : undefined
          }
        >
          <div className="aboutEditorial__stack">
            <div
              className="canvas-container"
              ref={canvasRef}
              onPointerEnter={() => {
                setIsCanvasHover(true);
                setShowPlayHint(false); // ✅ uniquement quand on entre dans le canvas
                setCursor((c) => ({ ...c, visible: true }));
              }}
              onPointerLeave={() => {
                setIsCanvasHover(false);
                setCursor((c) => ({ ...c, visible: false }));
                // reset mouse => le modèle revient au centre (avec retour lent dans Model.jsx)
                setMousePosition({ x: 0, y: 0 });
              }}
            >
              {showPlayHint && (
                <motion.div
                  className="aboutPlayHint"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <span className="aboutPlayHint__emoji" aria-hidden="true">
                    😍
                  </span>
                  <span className="aboutPlayHint__text">{t("playHint")}</span>
                </motion.div>
              )}

              <div
                className="canvasGlowCursor"
                style={{
                  opacity: cursor.visible ? cursor.opacity : 0,
                  transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`,
                }}
                aria-hidden="true"
              />

              <Canvas
                className="aboutR3FCanvas"
                camera={{ position: [0, 0, 5], fov: 50 }}
                shadows={false}
                gl={{ antialias: true }}
                onCreated={({ gl }) => {
                  gl.toneMappingExposure = 1.28;
                }}
              >
                <ambientLight intensity={0.72} />
                <directionalLight position={[2.5, 3.2, 6]} intensity={0.95} />
                <directionalLight position={[-3.5, 1.5, 3]} intensity={0.45} />
                <pointLight position={[2.2, 1.2, 2.5]} intensity={0.55} color="#ff00aa" />
                <pointLight position={[-2.2, -0.3, 2.8]} intensity={0.35} color="#7c3aed" />

                {/* ✅ on passe isActive pour gérer le retour lent */}
                <Model mousePosition={mousePosition} isActive={isCanvasHover} />

                <OrbitControls
                  enableDamping
                  dampingFactor={0.12}
                  rotateSpeed={0.35}
                  enablePan={false}
                  enableZoom={false}
                  minPolarAngle={Math.PI / 2.6}
                  maxPolarAngle={Math.PI / 2.05}
                />
              </Canvas>
            </div>

            <div
              className="img-section-about img-section-about--swapped"
              onMouseEnter={() => setCurrentImage(images[1])}
              onMouseLeave={() => setCurrentImage(images[0])}
            >
              <div className="txt-img-section-about txt-img-section-about--left">
                {/* ✅ SPA navigation (no reload) */}
                <Link to="/skills">{t("skillsLink")}</Link>
              </div>

              <div className="img-section-about__media">
                <motion.img
                  src={currentImage}
                  alt={t("aboutVisualAlt")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  decoding="async"
                  loading="eager"
                />

                <div className="overlay-images">
                  <img src="/assets/eyes.png" alt="" className="lower-left" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="aboutText">
          <article className="aboutBio__card">
            <div className="aboutBio__scan" aria-hidden="true" />

            <header className="aboutBio__header">
              <div className="aboutBio__kicker">{t("bio.kicker")}</div>
              <h1 className="aboutBio__title">{t("bio.title")}</h1>

              <div className="aboutBio__leadText">{t("bio.lead")}</div>

              <div className="aboutBio__meta">
                <span className="aboutBio__pill">{t("bio.pills.location")}</span>
                <span className="aboutBio__pill">{t("bio.pills.stack")}</span>
                <span className="aboutBio__pill">{t("bio.pills.tool")}</span>
              </div>
            </header>

            <div className="aboutBio__grid">
              {/* Experience */}
              <section className="aboutBio__box aboutBio__box--exp" ref={expBoxRef}>
                <div className="aboutBio__boxTitle">{t("sections.exp.title")}</div>

                <div
                  className={`aboutBio__expBody ${expExpanded ? "isExpanded" : "isCollapsed"}`}
                  style={{
                    maxHeight: expExpanded ? 999 : expCollapsedHeight ?? 180,
                  }}
                >
                  <ul className="aboutBio__list">
                    <li>
                      <b>{t("sections.exp.items.urbanTech.bold")}</b>{" "}
                      {t("sections.exp.items.urbanTech.text")}
                    </li>
                    <li>
                      <b>{t("sections.exp.items.sideGeek.bold")}</b>{" "}
                      {t("sections.exp.items.sideGeek.text")}
                    </li>
                    <li>
                      <b>{t("sections.exp.items.visual.bold")}</b>{" "}
                      {t("sections.exp.items.visual.text")}
                    </li>
                    <li>
                      <b>{t("sections.exp.items.urbanTech.bold")}</b>{" "}
                      {t("sections.exp.items.urbanTech.text")}
                    </li>
                    <li>
                      <b>{t("sections.exp.items.sideGeek.bold")}</b>{" "}
                      {t("sections.exp.items.sideGeek.text")}
                    </li>
                    <li>
                      <b>{t("sections.exp.items.visual.bold")}</b>{" "}
                      {t("sections.exp.items.visual.text")}
                    </li>
                  </ul>
                </div>

                {/* Footer button */}
                <button
                  type="button"
                  className="aboutBio__toggle"
                  onClick={() => setExpExpanded((v) => !v)}
                >
                  {expExpanded ? t("sections.seeLess") : t("sections.seeMore")}
                </button>
              </section>

              <section className="aboutBio__box">
                <div className="aboutBio__boxRow">
                  <div className="aboutBio__boxTitle">{t("sections.stack.title")}</div>

                  {/* ✅ SPA navigation (no reload) */}
                  <Link className="aboutBio__seeAll" to="/skills">
                    {t("stack.seeAll")}
                  </Link>
                </div>

                <div className="aboutBio__tags">
                  {["React", "Vite", "Three.js", "R3F", "Node", "Django", "SQL", "Figma", "Blender"].map(
                    (tag) => (
                      <span className="aboutBio__tag" key={tag}>
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </section>

              <section className="aboutBio__box">
                <div className="aboutBio__boxTitle">{t("sections.highlights.title")}</div>
                <div className="aboutBio__highText">{t("sections.highlights.text")}</div>
              </section>
            </div>

            <footer className="aboutBio__footer">
              {/* ✅ One-page routing via hash (no reload) */}
              <Link className="aboutBio__btn aboutBio__btn--primary" to="/#projects">
                {t("buttons.portfolio")}
              </Link>
              <Link className="aboutBio__btn aboutBio__btn--ghost" to="/#contact">
                {t("buttons.contact")}
              </Link>
            </footer>
          </article>
        </section>
      </div>
    </div>
  );
}


