// src/Pages/About/About.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./About.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Model from "./Model/Model";

const About = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const images = useMemo(() => ["/assets/s.jpg", "/assets/aura.jpg"], []);
  const [currentImage, setCurrentImage] = useState(images[0]);

  const canvasRef = useRef(null);

  const handleMouseMove = (event) => {
    const el = canvasRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    setMousePosition({ x, y });
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="about-container-all">
      {/* TITLE (same vibe as PORTFOLIO, no animation) */}
      <header className="about-title">
        <h1 className="about-titleText">ABOUT</h1>
      </header>

      <div className="about-container">
        {/* LEFT = EDITORIAL (canvas + image) */}
        <aside className="aboutEditorial">
          <div className="aboutEditorial__stack">
            <div className="canvas-container" ref={canvasRef}>
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.55} />
                <spotLight position={[2, 2, 2]} intensity={1} angle={Math.PI / 4} penumbra={1} castShadow />
                <spotLight position={[10, 10, 10]} intensity={0.7} />
                <spotLight position={[2, 2, 2]} intensity={10} color="#78AD19" />
                <spotLight position={[1, 0, 2]} intensity={10} color="#F77600" />

                <Model mousePosition={mousePosition} />

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
              className="img-section-about"
              onMouseEnter={() => setCurrentImage(images[1])}
              onMouseLeave={() => setCurrentImage(images[0])}
            >
              <motion.img
                src={currentImage}
                alt="About visual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              />

              <div className="overlay-images">
                <img src="/assets/eyes.png" alt="Eyes overlay" className="lower-left" />
              </div>

              <div className="txt-img-section-about">
                <a href="/expertise">SKILLS</a>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT = TEXT (bio) */}
        <section className="aboutText">
          <article className="aboutBio__card">
            <div className="aboutBio__scan" aria-hidden="true" />

            <header className="aboutBio__header">
              <div className="aboutBio__kicker">Profile</div>

              <h3 className="aboutBio__title">
                KASIA — FULLSTACK WEB DEV & 3D CREATOR
              </h3>

              {/* ✅ WRAP CONTROLLED TEXT NODE */}
              <div className="aboutBio__leadText">
                I build interactive experiences that feel like a universe: clean engineering with a cinematic skin —
                UI systems, animations, and 3D worlds.
              </div>

              <div className="aboutBio__meta">
                <span className="aboutBio__pill">Brussels</span>
                <span className="aboutBio__pill">React / Three.js</span>
                <span className="aboutBio__pill">Blender</span>
              </div>
            </header>

            <div className="aboutBio__grid">
              <section className="aboutBio__box">
                <div className="aboutBio__boxTitle">Experience</div>
                <ul className="aboutBio__list">
                  <li>
                    <b>Urban Tech</b> — 5 months internship (2024), web projects & product delivery.
                  </li>
                  <li>
                    <b>SideGeek / collaborations</b> — building features, UI, integrations.
                  </li>
                  <li>
                    <b>Visual / 3D background</b> — design-first approach, strong visuals.
                  </li>
                </ul>
              </section>

              <section className="aboutBio__box">
                <div className="aboutBio__boxTitle">Stack</div>
                <div className="aboutBio__tags">
                  {["React", "Vite", "Three.js", "R3F", "Node", "Django", "SQL", "Figma", "Blender"].map((t) => (
                    <span className="aboutBio__tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              <section className="aboutBio__box">
                <div className="aboutBio__boxTitle">Highlights</div>

                {/* ✅ WRAP CONTROLLED TEXT NODE */}
                <div className="aboutBio__highText">
                  I like systems that feel premium: glass UI, neon accents, smooth motion, and interactions that make
                  people want to explore.
                </div>
              </section>
            </div>

            <footer className="aboutBio__footer">
              <a className="aboutBio__btn" href="/portfolio">
                View Portfolio
              </a>
              <a className="aboutBio__btn aboutBio__btn--ghost" href="/contact">
                Contact
              </a>
            </footer>
          </article>
        </section>
      </div>
    </div>
  );
};

export default About;






// import React, { useState, useRef, useEffect, useMemo } from "react";
// import { motion } from "framer-motion";
// import "./About.css";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import Model from "./Model/Model";

// const About = () => {
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

//   const images = useMemo(() => ["/assets/s.jpg", "/assets/aura.jpg"], []);
//   const [currentImage, setCurrentImage] = useState(images[0]);

//   const title = "About";
//   const [titleAnimationKey, setTitleAnimationKey] = useState(0);

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

//   const letterAnimations = {
//     A: { scale: [1, 1.5, 1], transition: { duration: 1, repeatType: "loop" } },
//     B: { rotate: [0, 45, -45, 0], transition: { duration: 1, repeatType: "loop" } },
//     O: { rotate: [0, 360], transition: { duration: 2, repeatType: "loop" } },
//     T: { y: [0, -18, 0], transition: { duration: 0.55, repeatType: "loop" } },
//   };

//   const defaultLetterAnimation = {
//     scale: [1, 1.05, 1],
//     transition: { duration: 0.65, repeat: Infinity, repeatType: "loop" },
//   };

//   return (
//     <div className="about-container-all">
//       {/* TITLE */}
//       <div
//         className="about-title"
//         onMouseEnter={() => setTitleAnimationKey((k) => k + 1)}
//         onMouseLeave={() => setTitleAnimationKey((k) => k + 1)}
//       >
//         <h2>
//           {title.split("").map((letter, index) => {
//             const anim = letterAnimations[letter.toUpperCase()] || defaultLetterAnimation;
//             return (
//               <motion.span
//                 key={`${index}-${titleAnimationKey}`}
//                 style={{ display: "inline-block" }}
//                 animate={anim}
//               >
//                 {letter}
//               </motion.span>
//             );
//           })}
//         </h2>
//       </div>

//       <div className="about-container">
//         {/* LEFT = BIO */}
//         <section className="about-left-section aboutBio">
//           <article className="aboutBio__card">
//             <div className="aboutBio__scan" aria-hidden="true" />

//             <header className="aboutBio__header">
//               <div className="aboutBio__kicker">Profile</div>
//               <h3 className="aboutBio__title">Kasia — Fullstack Web Dev & 3D Creator</h3>

//               <p className="aboutBio__lead">
//                 I build interactive experiences that feel like a universe: clean engineering with a cinematic skin —
//                 UI systems, animations, and 3D worlds.
//               </p>

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
//                 <p className="aboutBio__p">
//                   I like systems that feel premium: glass UI, neon accents, smooth motion, and interactions that make
//                   people want to explore.
//                 </p>
//               </section>
//             </div>

//             <footer className="aboutBio__footer">
//               <a className="aboutBio__btn" href="/portfolio">
//                 View Portfolio
//               </a>
//               <a className="aboutBio__btn aboutBio__btn--ghost" href="/contact">
//                 Contact
//               </a>
//             </footer>
//           </article>
//         </section>

//         {/* RIGHT = CANVAS + IMAGE CTA (same structure as before) */}
//         <div className="about-right-section">
//           <div className="about-right-section-first">
//             {/* Canvas */}
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
//                   dampingFactor={0.08}
//                   rotateSpeed={0.55}
//                   enablePan={false}
//                   enableZoom={false}
//                   minPolarAngle={Math.PI / 2.6}
//                   maxPolarAngle={Math.PI / 2.05}
//                 />
//               </Canvas>
//             </div>

//             {/* Image + CTA */}
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
//                 {/* change label here */}
//                 <a href="/expertise">Skills</a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default About;
