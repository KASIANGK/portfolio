// src/Pages/About/About.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import "./About.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import Model from "./Model/Model";

export default function About() {
  const { t } = useTranslation("about");
  const [expExpanded, setExpExpanded] = useState(false);
  const [expCollapsedHeight, setExpCollapsedHeight] = useState(null);
  
  const expBoxRef = useRef(null);
  const stackBoxRef = useRef(null);
  
  const images = useMemo(() => ["/assets/s.jpg", "/assets/aura.jpg"], []);
  const [currentImage, setCurrentImage] = useState(images[0]);

  const canvasRef = useRef(null);

  const [isCanvasHover, setIsCanvasHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Glow cursor (orb)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, opacity: 0 });
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

    const fadeRaw = 1 - speed * 1.2;         // moins agressif que 1.8
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
  
  return (
    <div className="about-container-all">
      <header className="about-title">
        <h1 className="about-titleText">{t("title")}</h1>
      </header>

      <div className="about-container">
        <aside className="aboutEditorial">
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
                  <span className="aboutPlayHint__emoji" aria-hidden="true">😍</span>
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
                <a href="/skills">{t("skillsLink")}</a>
              </div>

              <div className="img-section-about__media">
                <motion.img
                  src={currentImage}
                  alt={t("aboutVisualAlt")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
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
                  <a className="aboutBio__seeAll" href="/skills">
                    {t("stack.seeAll")}
                  </a>
                </div>

                <div className="aboutBio__tags">
                  {["React", "Vite", "Three.js", "R3F", "Node", "Django", "SQL", "Figma", "Blender"].map((tag) => (
                    <span className="aboutBio__tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </section>

              <section className="aboutBio__box">
                <div className="aboutBio__boxTitle">{t("sections.highlights.title")}</div>
                <div className="aboutBio__highText">{t("sections.highlights.text")}</div>
              </section>
            </div>

            <footer className="aboutBio__footer">
              <a className="aboutBio__btn aboutBio__btn--primary" href="/portfolio">
                {t("buttons.portfolio")}
              </a>
              <a className="aboutBio__btn aboutBio__btn--ghost" href="/contact">
                {t("buttons.contact")}
              </a>
            </footer>
          </article>
        </section>
      </div>
    </div>
  );
}



// // src/Pages/About/About.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import "./About.css";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import Model from "./Model/Model";

// const About = () => {
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

//   const images = useMemo(() => ["/assets/s.jpg", "/assets/aura.jpg"], []);
//   const [currentImage, setCurrentImage] = useState(images[0]);

//   const canvasRef = useRef(null);

//   const handleMouseMove = (event) => {
//     const el = canvasRef.current;
//     if (!el) return;

//     const rect = el.getBoundingClientRect();
//     const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//     const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

//     setMousePosition({ x, y });
//   };

//   useEffect(() => {
//     const el = canvasRef.current;
//     if (!el) return;
//     el.addEventListener("mousemove", handleMouseMove);
//     return () => el.removeEventListener("mousemove", handleMouseMove);
//   }, []);

//   return (
//     <div className="about-container-all">
//       {/* TITLE (same vibe as PORTFOLIO, no animation) */}
//       <header className="about-title">
//         <h1 className="about-titleText">ABOUT</h1>
//       </header>

//       <div className="about-container">
//         {/* LEFT = EDITORIAL (canvas + image) */}
//         <aside className="aboutEditorial">
//           <div className="aboutEditorial__stack">
//             <div className="canvas-container" ref={canvasRef}>
//               <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
//                 <ambientLight intensity={0.55} />
//                 <spotLight position={[2, 2, 2]} intensity={1} angle={Math.PI / 4} penumbra={1} castShadow />
//                 <spotLight position={[10, 10, 10]} intensity={0.7} />
//                 <spotLight position={[2, 2, 2]} intensity={10} color="#78AD19" />
//                 <spotLight position={[1, 0, 2]} intensity={10} color="#F77600" />

//                 <Model mousePosition={mousePosition} />

//                 <OrbitControls
//                   enableDamping
//                   dampingFactor={0.12}
//                   rotateSpeed={0.35}
//                   enablePan={false}
//                   enableZoom={false}
//                   minPolarAngle={Math.PI / 2.6}
//                   maxPolarAngle={Math.PI / 2.05}
//                 />
//               </Canvas>
//             </div>

//             <div
//               className="img-section-about"
//               onMouseEnter={() => setCurrentImage(images[1])}
//               onMouseLeave={() => setCurrentImage(images[0])}
//             >
//               <motion.img
//                 src={currentImage}
//                 alt="About visual"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ duration: 0.35 }}
//               />

//               <div className="overlay-images">
//                 <img src="/assets/eyes.png" alt="Eyes overlay" className="lower-left" />
//               </div>

//               <div className="txt-img-section-about">
//                 <a href="/expertise">SKILLS</a>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* RIGHT = TEXT (bio) */}
//         <section className="aboutText">
//           <article className="aboutBio__card">
//             <div className="aboutBio__scan" aria-hidden="true" />

//             <header className="aboutBio__header">
//               <div className="aboutBio__kicker">Profile</div>

//               <h3 className="aboutBio__title">
//                 KASIA — FULLSTACK WEB DEV & 3D CREATOR
//               </h3>

//               {/* ✅ WRAP CONTROLLED TEXT NODE */}
//               <div className="aboutBio__leadText">
//                 I build interactive experiences that feel like a universe: clean engineering with a cinematic skin —
//                 UI systems, animations, and 3D worlds.
//               </div>

//               <div className="aboutBio__meta">
//                 <span className="aboutBio__pill">Brussels</span>
//                 <span className="aboutBio__pill">React / Three.js</span>
//                 <span className="aboutBio__pill">Blender</span>
//               </div>
//             </header>

//             <div className="aboutBio__grid">
//               <section className="aboutBio__box">
//                 <div className="aboutBio__boxTitle">Experience</div>
//                 <ul className="aboutBio__list">
//                   <li>
//                     <b>Urban Tech</b> — 5 months internship (2024), web projects & product delivery.
//                   </li>
//                   <li>
//                     <b>SideGeek / collaborations</b> — building features, UI, integrations.
//                   </li>
//                   <li>
//                     <b>Visual / 3D background</b> — design-first approach, strong visuals.
//                   </li>
//                 </ul>
//               </section>

//               <section className="aboutBio__box">
//                 <div className="aboutBio__boxTitle">Stack</div>
//                 <div className="aboutBio__tags">
//                   {["React", "Vite", "Three.js", "R3F", "Node", "Django", "SQL", "Figma", "Blender"].map((t) => (
//                     <span className="aboutBio__tag" key={t}>
//                       {t}
//                     </span>
//                   ))}
//                 </div>
//               </section>

//               <section className="aboutBio__box">
//                 <div className="aboutBio__boxTitle">Highlights</div>

//                 {/* ✅ WRAP CONTROLLED TEXT NODE */}
//                 <div className="aboutBio__highText">
//                   I like systems that feel premium: glass UI, neon accents, smooth motion, and interactions that make
//                   people want to explore.
//                 </div>
//               </section>
//             </div>

//             <footer className="aboutBio__footer">
//               <a className="aboutBio__btn aboutBio__btn--primary" href="/portfolio">
//                 View Portfolio
//               </a>
//               <a className="aboutBio__btn aboutBio__btn--ghost" href="/contact">
//                 Contact
//               </a>
//             </footer>
//           </article>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default About;



