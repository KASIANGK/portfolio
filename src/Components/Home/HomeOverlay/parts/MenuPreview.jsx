// src/Components/Home/HomeOverlay/parts/MenuPreview.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from "react-icons/fa";
import { getProjects, pickProjectImages } from "../../../../utils/projectsCache";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function isDesktopFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: fine) and (hover: hover)")?.matches ?? false;
}

function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

/* =========================
   PREVIEWS
========================= */

function PreviewExplore() {
  return (
    <div className="homeOverlay__previewMedia">
      <img
        src="/preview_city.png"
        alt="City preview"
        className="homeOverlay__previewImg homeOverlay__previewImg--cover"
        loading="eager"
        decoding="async"
      />
      <div className="homeOverlay__previewCaption">ANGELS CITY — 3D WORLD</div>
    </div>
  );
}

function PreviewAbout() {
  return (
    <div className="homeOverlay__previewMedia">
      <img
        src="/preview_kasia.jpg"
        alt="About preview"
        className="homeOverlay__previewImg homeOverlay__previewImg--cover"
        loading="eager"
        decoding="async"
      />
      <div className="homeOverlay__previewCaption">KASIA — CREATIVE TECH</div>
    </div>
  );
}

function PreviewProjects({ active, onOpenPortfolio, slidesFromParent, menuAssetsReady }) {

  
  // ✅ plus de fetch ici : c’est le parent qui warmup
  const finalSlides = (slidesFromParent?.length ? slidesFromParent : [
    "/preview_project_1.png",
    "/preview_project_2.png",
    "/preview_project_3.png",
  ]);

  const baseSlides = finalSlides;
  const loopSlides = useMemo(() => [...baseSlides, ...baseSlides], [baseSlides]);
  const baseCount = baseSlides.length;


  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    );
  }, []);

  const quickX = useRef(null);
  useLayoutEffect(() => {
    if (!trackRef.current) return;
    quickX.current = gsap.quickTo(trackRef.current, "x", {
      duration: 0.28,
      ease: "power3.out",
    });
  }, []);

  const baseX = useRef(0);
  const rafId = useRef(null);

  // const handleMove = (e) => {
  //   if (isTouch) return;
  //   const viewport = viewportRef.current;
  //   const track = trackRef.current;
  //   if (!viewport || !track || !quickX.current) return;

  //   const rect = viewport.getBoundingClientRect();
  //   const tpos = clamp01((e.clientX - rect.left) / rect.width);

  //   const slidesCount = track.children?.length || 0;
  //   if (slidesCount <= 1) return;

  //   const vw = viewport.clientWidth;
  //   const maxX = (slidesCount - 1) * vw;
  //   const targetX = -tpos * maxX;

  //   baseX.current = targetX;
  //   quickX.current(targetX);
  // };
  const handleMove = (e) => {
    if (isTouch) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || !quickX.current) return;
  
    if (baseCount <= 1) return;
  
    const rect = viewport.getBoundingClientRect();
    const tpos = clamp01((e.clientX - rect.left) / rect.width);
  
    const vw = viewport.clientWidth;
    const loopWidth = baseCount * vw;     // ✅ largeur d’un “tour”
    const targetX = -tpos * loopWidth;
  
    baseX.current = targetX;
    quickX.current(targetX);
  };
  

  // ✅ auto-swipe (seulement quand layer actif)
  useEffect(() => {
    const shouldRun = active && !isTouch && isDesktopFinePointer();
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!shouldRun || !viewport || !track || !quickX.current) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      return;
    }

    let last = performance.now();

    const loop = (now) => {
      const dt = now - last;
      last = now;

      const slidesCount = track.children?.length || 0;
      if (slidesCount <= 1) {
        rafId.current = requestAnimationFrame(loop);
        return;
      }

      const vw = viewport.clientWidth;
      const loopWidth = baseCount * vw;
      // const maxX = (slidesCount - 1) * vw;

      const speed = 0.03; // ~10px/s
      let next = baseX.current - dt * speed;

      if (next <= -loopWidth) next += loopWidth;
      if (next > 0) next -= loopWidth;

      baseX.current = next;
      quickX.current(next);

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [active, isTouch, finalSlides.length]);


  return (
    <div className="homeOverlay__previewSlider" onMouseMove={handleMove}>
      <div className="homeOverlay__previewScanlines" />
      <div className="homeOverlay__previewViewport" ref={viewportRef}>
        <div className="homeOverlay__previewTrack" ref={trackRef}>
          {loopSlides.map((src, idx) => (
            <button
              type="button"
              className="homeOverlay__previewSlideBtn"
              key={`${src}::${idx}`}   // key stable
              onClick={onOpenPortfolio}
              aria-label={`Open portfolio (project ${idx + 1})`}
            >
              <img
                src={src}
                alt={`Project ${idx + 1}`}
                loading="eager"        // ✅ important
                decoding="async"
                fetchpriority={idx < 2 ? "high" : "auto"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="homeOverlay__previewCaption">
        {menuAssetsReady ? "PROJECTS — CLICK ✦" : "LOADING…"}
      </div>
    </div>
  );
}


function PreviewContact() {
  return (
    <div className="homeOverlay__previewContacts">
      <a className="homeOverlay__iconOnlyBtn" href="mailto:ngk.kasia@gmail.com" aria-label="Email">
        <FaEnvelope className="homeOverlay__iconOnlySvg" />
      </a>

      <a className="homeOverlay__iconOnlyBtn" href="tel:123456789" aria-label="Phone">
        <FaPhoneAlt className="homeOverlay__iconOnlySvg" />
      </a>

      <a
        className="homeOverlay__iconOnlyBtn"
        href="https://www.instagram.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
      >
        <FaInstagram className="homeOverlay__iconOnlySvg" />
      </a>

      <a
        className="homeOverlay__iconOnlyBtn"
        href="https://www.twitter.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Twitter"
      >
        <FaTwitter className="homeOverlay__iconOnlySvg" />
      </a>

      {/* <div className="homeOverlay__previewCaption">CONTACT — CLICK ✦</div> */}
    </div>
  );
}

/* =========================
   MENU PREVIEW (crossfade propre)
========================= */

export default function MenuPreview({ activeKey, projectSlides, menuAssetsReady }) {
  const navigate = useNavigate();

  const [prevKey, setPrevKey] = useState(activeKey);

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const renderKey = useCallback(
    (key, isActiveLayer) => {
      if (key === "explore") return <PreviewExplore />;
      if (key === "about") return <PreviewAbout />;
      if (key === "projects")
      return (
        <PreviewProjects
          active={isActiveLayer}
          slidesFromParent={projectSlides}
          menuAssetsReady={menuAssetsReady}
          onOpenPortfolio={() => navigate("/portfolio")}
        />
      );    
      if (key === "contact") return <PreviewContact />;
      return null;
    },
    [navigate]
  );

  useLayoutEffect(() => {
    if (activeKey === prevKey) return;

    const prevEl = prevRef.current;
    const nextEl = nextRef.current;
    if (!prevEl || !nextEl) {
      setPrevKey(activeKey);
      return;
    }

    gsap.killTweensOf([prevEl, nextEl]);

    // état initial
    gsap.set(prevEl, { autoAlpha: 1, filter: "blur(0px)" });
    gsap.set(nextEl, { autoAlpha: 0, filter: "blur(10px)" });

    const tl = gsap.timeline({
      defaults: { duration: 0.22, ease: "power2.out" },
      onComplete: () => {
        setPrevKey(activeKey);
        gsap.set([prevEl, nextEl], { clearProps: "filter" });
      },
    });

    tl.to(nextEl, { autoAlpha: 1, filter: "blur(0px)" }, 0).to(
      prevEl,
      { autoAlpha: 0, filter: "blur(12px)" },
      0
    );

    return () => tl.kill();
  }, [activeKey, prevKey]);

  return (
    <div className="homeOverlay__previewStage" data-preview={activeKey}>
      {/* ✅ layer prev: contenu figé (prevKey) */}
      <div ref={prevRef} className="homeOverlay__previewLayer homeOverlay__previewLayer--prev">
        {renderKey(prevKey, false)}
      </div>

      {/* ✅ layer next: contenu actif */}
      <div ref={nextRef} className="homeOverlay__previewLayer homeOverlay__previewLayer--next">
        {renderKey(activeKey, true)}
      </div>

      <div className="homeOverlay__previewGlow" aria-hidden="true" />
    </div>
  );
}
