// src/Components/Home/HomeOverlay/parts/MenuPreview.jsx
import React, { useMemo, useRef, useLayoutEffect, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaPhoneAlt, FaInstagram } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { whenImageReady } from "../../../../utils/projectsCache";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const PREVIEW = {
  explore: "/preview_city.png",
  about: "/preview_kasia.jpg",
  projectsFallback: ["/preview_project_1.png", "/preview_project_2.png", "/preview_project_3.png"],
};

function isDesktopFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: fine) and (hover: hover)")?.matches ?? false;
}

/**
 * Navigate to hash section on "/" and scroll smoothly.
 * Accepts "#projects" or "projects".
 */
function goHashNavigate(navigate, hash) {
  const targetHash = (hash || "").startsWith("#") ? hash : `#${hash}`;
  const targetUrl = `/${targetHash}`;

  const alreadyHome = window.location?.pathname === "/";

  if (alreadyHome) {
    if (window.location.hash !== targetHash) {
      window.history.pushState({}, "", targetUrl);
    }
  } else {
    navigate(targetUrl);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector(targetHash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* =========================
   Shared: "always-mounted" img
========================= */

function AlwaysMountedImg({
  src,
  alt,
  className,
  width,
  height,
  fetchPriority = "high",
  decoding = "sync",
  loading = "eager",
}) {
  const [broken, setBroken] = useState(false);

  return (
    <>
      {!broken ? (
        <img
          src={src}
          alt={alt}
          className={className}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          onError={() => setBroken(true)}
          draggable={false}
        />
      ) : (
        <div className="homeOverlay__previewImgFallback" aria-hidden="true" />
      )}
    </>
  );
}

/* =========================
   PREVIEWS
========================= */

function PreviewExplore() {
  const src = PREVIEW.explore;

  return (
    <div className="homeOverlay__previewMedia">
      <AlwaysMountedImg
        src={src}
        alt="City preview"
        className="homeOverlay__previewImg homeOverlay__previewImg--cover"
        width={560}
        height={320}
        fetchPriority="high"
        decoding="sync"
        loading="eager"
      />
      <div className="homeOverlay__previewCaption">MY INTERACTIVE 3D WORLD</div>
    </div>
  );
}

function PreviewAbout() {
  const src = PREVIEW.about;

  return (
    <div className="homeOverlay__previewMedia">
      <AlwaysMountedImg
        src={src}
        alt="About preview"
        className="homeOverlay__previewImg homeOverlay__previewImg--cover"
        width={560}
        height={320}
        fetchPriority="high"
        decoding="sync"
        loading="eager"
      />
      <div className="homeOverlay__previewCaption">KASIA — CREATIVE TECH</div>
    </div>
  );
}

function PreviewProjects({ active, onOpenPortfolio, slidesFromParent, menuAssetsReady }) {
  const baseSlides = useMemo(() => {
    return slidesFromParent?.length ? slidesFromParent : PREVIEW.projectsFallback;
  }, [slidesFromParent]);

  const loopSlides = useMemo(() => [...baseSlides, ...baseSlides], [baseSlides]);
  const baseCount = baseSlides.length;

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const quickX = useRef(null);
  const rafId = useRef(null);
  const baseX = useRef(0);

  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    );
  }, []);

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    quickX.current = gsap.quickTo(trackRef.current, "x", {
      duration: 0.24,
      ease: "power3.out",
    });
  }, []);

  const handleMove = (e) => {
    if (isTouch) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || !quickX.current) return;
    if (baseCount <= 1) return;

    const rect = viewport.getBoundingClientRect();
    const tpos = clamp01((e.clientX - rect.left) / rect.width);

    const vw = viewport.clientWidth;
    const loopWidth = baseCount * vw;
    const targetX = -tpos * loopWidth;

    baseX.current = targetX;
    quickX.current(targetX);
  };

  useLayoutEffect(() => {
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

      const vw = viewport.clientWidth;
      const loopWidth = baseCount * vw;

      const speed = 0.03;
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
  }, [active, isTouch, baseCount]);

  return (
    <div className="homeOverlay__previewSlider" onMouseMove={handleMove}>
      <div className="homeOverlay__previewScanlines" />
      <div className="homeOverlay__previewViewport" ref={viewportRef}>
        <div className="homeOverlay__previewTrack" ref={trackRef}>
          {loopSlides.map((src, idx) => (
            <button
              key={`${src}::${idx}`}
              type="button"
              className="homeOverlay__previewSlideBtn"
              onClick={onOpenPortfolio}
              aria-label="Open portfolio"
            >
              <img
                src={src}
                alt="Project preview"
                width="280"
                height="180"
                loading={idx < 2 ? "eager" : "lazy"}
                decoding={idx < 2 ? "sync" : "async"}
                fetchPriority={idx < 2 ? "high" : "auto"}
                draggable={false}
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
      {/* EMAIL */}
      <a className="homeOverlay__iconOnlyBtn" href="mailto:ngk.kasia@gmail.com" aria-label="Email">
        <FaEnvelope className="homeOverlay__iconOnlySvg" />
      </a>

      {/* PHONE */}
      <a className="homeOverlay__iconOnlyBtn" href="tel:+32472845612" aria-label="Phone">
        <FaPhoneAlt className="homeOverlay__iconOnlySvg" />
      </a>

      {/* INSTAGRAM */}
      <a
        className="homeOverlay__iconOnlyBtn"
        href="https://www.instagram.com/angels_gang_style/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
      >
        <FaInstagram className="homeOverlay__iconOnlySvg" />
      </a>

      {/* TIKTOK */}
      <a
        className="homeOverlay__iconOnlyBtn"
        href="https://www.tiktok.com/@kiss_my_fire"
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
      >
        <FaTiktok className="homeOverlay__iconOnlySvg" />
      </a>
    </div>
  );
}

export default function MenuPreview({ activeKey, projectSlides, menuAssetsReady }) {
  const navigate = useNavigate();
  const show = (key) => (activeKey === key ? "isShown" : "isHidden");

  // ✅ Prewarm once (non-blocking). Helps remove the "first swap" micro-blank.
  useEffect(() => {
    whenImageReady(PREVIEW.explore).catch(() => {});
    whenImageReady(PREVIEW.about).catch(() => {});
    PREVIEW.projectsFallback.forEach((u) => whenImageReady(u).catch(() => {}));
  }, []);

  const openProjects = useCallback(() => {
    goHashNavigate(navigate, "#projects");
  }, [navigate]);

  return (
    <div className="homeOverlay__previewStage" data-preview={activeKey}>
      <div className={`homeOverlay__previewLayer ${show("explore")}`}>
        <PreviewExplore />
      </div>

      <div className={`homeOverlay__previewLayer ${show("about")}`}>
        <PreviewAbout />
      </div>

      <div className={`homeOverlay__previewLayer ${show("projects")}`}>
        <PreviewProjects
          active={activeKey === "projects"}
          slidesFromParent={projectSlides}
          menuAssetsReady={menuAssetsReady}
          onOpenPortfolio={openProjects}
        />
      </div>

      <div className={`homeOverlay__previewLayer ${show("contact")}`}>
        <PreviewContact />
      </div>

      <div className="homeOverlay__previewGlow" aria-hidden="true" />
    </div>
  );
}
