// src/Components/Home/Home.jsx
import React, { useRef } from "react";
import HomeOverlay from "./HomeOverlay";
import useOnboarding from "../../hooks/useOnboarding";
import "./Home.css";

export default function Home() {
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);

  const { shouldShowLanguageStep } = useOnboarding();

  const scrollTo = (ref) => {
    if (!ref?.current) return;
    const y = ref.current.getBoundingClientRect().top + window.scrollY - 50;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="homePage">
      {/* ✅ HomeOverlay toujours monté :
          Step1 si onboarding actif, sinon Step2 */}
      <HomeOverlay
        mode={shouldShowLanguageStep ? "step1" : "step2"}
        onGoAbout={() => scrollTo(aboutRef)}
        onGoProjects={() => scrollTo(projectsRef)}
        onGoContact={() => scrollTo(contactRef)}
      />


      {/* ✅ petit gap sous le header Step2 */}
      {!shouldShowLanguageStep && <div className="homePage__afterHeader" />}

      {/* SECTIONS */}
      <section ref={aboutRef} className="homeSection" id="about">
        <div className="homeSection__card">
          <h2>About</h2>
          <p>…</p>
        </div>
      </section>

      <section ref={projectsRef} className="homeSection" id="projects">
        <div className="homeSection__card">
          <h2>Projects</h2>
          <p>…</p>
        </div>
      </section>

      <section ref={contactRef} className="homeSection" id="contact">
        <div className="homeSection__card">
          <h2>Contact</h2>
          <p>…</p>
        </div>
      </section>
    </div>
  );
}

