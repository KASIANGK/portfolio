// src/Components/Home/HomeOverlay/parts/MenuPreview.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import gsap from "gsap";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function isDesktopFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: fine) and (hover: hover)")?.matches ?? false;
}

function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.src = src;
}

/* =========================
   SVG ICONS (inline, no deps)
========================= */

const IconMail = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M6 7l6 5 6-5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const IconPhone = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7.5 4.8c.7-1 2.1-1.1 2.9-.3l2 2c.7.7.7 1.9 0 2.6l-1 1c-.2.2-.3.5-.2.8 1 2.7 3.1 4.9 5.9 5.9.3.1.6 0 .8-.2l1-1c.7-.7 1.9-.7 2.6 0l2 2c.8.8.7 2.2-.3 2.9-1.2.9-2.8 1.2-4.3.8-6.3-1.7-11.2-6.6-12.9-12.9-.4-1.5-.1-3.1.8-4.3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6.5 10v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.5 6.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" fill="currentColor" />
    <path
      d="M10.5 19v-5.2c0-2 1.1-3.3 2.9-3.3 1.6 0 2.5 1.1 2.5 3V19"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTikTok = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M14 5v9.2a3.8 3.8 0 1 1-3.2-3.7"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 5c.7 2.5 2.5 4.2 5 4.6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* =========================
   PREVIEWS (ta base, inchangée)
========================= */

function PreviewExplore() {
  return (
    <div className="homeOverlay__previewMedia">
      <img
        src="/preview_city.jpg"
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
        className="homeOverlay__previewImg"
        loading="eager"
        decoding="async"
      />
      <div className="homeOverlay__previewCaption">KASIA — CREATIVE TECH</div>
    </div>
  );
}

function PreviewProjects({ active }) {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    fetch("/projects.json")
      .then((r) => r.json())
      .then((data) => {
        const picks = (Array.isArray(data) ? data : [])
          .slice(0, 5)
          .flatMap((p) => {
            const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
            const cover = p.cover || images[0];
            const all = [...(cover ? [cover] : []), ...images.filter((s) => s !== cover)];
            return all.slice(0, 2);
          })
          .slice(0, 6);

        setSlides(picks);

        // preload the fetched slides
        picks.forEach(preloadImage);
      })
      .catch(() => setSlides([]));
  }, []);

  // fallback previews preload too
  useEffect(() => {
    ["/preview_project_1.jpg", "/preview_project_2.jpg", "/preview_project_3.jpg"].forEach(preloadImage);
  }, []);

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

  // quickTo cached
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

  const handleMove = (e) => {
    if (isTouch) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || !quickX.current) return;

    const rect = viewport.getBoundingClientRect();
    const tpos = clamp01((e.clientX - rect.left) / rect.width);

    const slidesCount = track.children?.length || 0;
    if (slidesCount <= 1) return;

    const vw = viewport.clientWidth;
    const maxX = (slidesCount - 1) * vw;
    const targetX = -tpos * maxX;

    baseX.current = targetX; // sync base with hover
    quickX.current(targetX);
  };

  // ✅ auto-swipe ultra lent (desktop only), stop dès qu’on quitte
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
      const maxX = (slidesCount - 1) * vw;

      // vitesse très lente: ~6px/s
      const speed = 0.006; // px/ms
      let next = baseX.current - dt * speed;

      // boucle douce
      if (next < -maxX) next = 0;

      baseX.current = next;
      quickX.current(next);

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [active, isTouch]);

  const finalSlides = slides.length ? slides : ["/preview_project_1.jpg", "/preview_project_2.jpg", "/preview_project_3.jpg"];

  return (
    <div className="homeOverlay__previewSlider" onMouseMove={handleMove}>
      <div className="homeOverlay__previewScanlines" />
      <div className="homeOverlay__previewViewport" ref={viewportRef}>
        <div className="homeOverlay__previewTrack" ref={trackRef}>
          {finalSlides.map((src, idx) => (
            <div className="homeOverlay__previewSlide" key={`${src}-${idx}`}>
              <img src={src} alt={`Project ${idx + 1}`} loading="eager" decoding="async" />
            </div>
          ))}
        </div>
      </div>

      <div className="homeOverlay__previewCaption">PROJECTS — HOVER TO SWIPE ✦</div>
    </div>
  );
}

function PreviewContact() {
  const CONTACT = {
    mail: "mailto:hello@angelsgang.com",
    tel: "tel:+32400000000",
    linkedin: "https://www.linkedin.com/in/your-profile/",
    tiktok: "https://www.tiktok.com/@yourhandle",
  };

  return (
    <div className="homeOverlay__previewContacts">
      <a className="homeOverlay__iconBtn" href={CONTACT.mail} aria-label="Email">
        <IconMail className="homeOverlay__iconSvg" />
        <span className="homeOverlay__iconLbl">MAIL</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.tel} aria-label="Phone">
        <IconPhone className="homeOverlay__iconSvg" />
        <span className="homeOverlay__iconLbl">PHONE</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
        <IconLinkedIn className="homeOverlay__iconSvg" />
        <span className="homeOverlay__iconLbl">LINKEDIN</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
        <IconTikTok className="homeOverlay__iconSvg" />
        <span className="homeOverlay__iconLbl">TIKTOK</span>
      </a>

      <div className="homeOverlay__previewCaption">CONTACT — CLICK ✦</div>
    </div>
  );
}

/* =========================
   MENU PREVIEW (crossfade pro)
========================= */

export default function MenuPreview({ activeKey }) {
  // Preload static preview images
  useEffect(() => {
    preloadImage("/preview_city.jpg");
    preloadImage("/preview_kasia.jpg");
    preloadImage("/preview_project_1.jpg");
    preloadImage("/preview_project_2.jpg");
    preloadImage("/preview_project_3.jpg");
  }, []);

  // crossfade layer system
  const [prevKey, setPrevKey] = useState(activeKey);

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const renderKey = useCallback((key, isActiveLayer) => {
    if (key === "explore") return <PreviewExplore />;
    if (key === "about") return <PreviewAbout />;
    if (key === "projects") return <PreviewProjects active={isActiveLayer} />;
    if (key === "contact") return <PreviewContact />;
    return null;
  }, []);

  useLayoutEffect(() => {
    if (activeKey === prevKey) return;

    const prevEl = prevRef.current;
    const nextEl = nextRef.current;
    if (!prevEl || !nextEl) {
      setPrevKey(activeKey);
      return;
    }

    gsap.killTweensOf([prevEl, nextEl]);

    // init states
    gsap.set(prevEl, { autoAlpha: 1, filter: "blur(0px)" });
    gsap.set(nextEl, { autoAlpha: 0, filter: "blur(10px)" });

    const tl = gsap.timeline({
      defaults: { duration: 0.22, ease: "power2.out" }, // 180–260ms
      onComplete: () => {
        setPrevKey(activeKey);
        gsap.set([prevEl, nextEl], { clearProps: "filter" });
      },
    });

    // crossfade + deblur + slight blur-out old
    tl.to(nextEl, { autoAlpha: 1, filter: "blur(0px)" }, 0)
      .to(prevEl, { autoAlpha: 0, filter: "blur(12px)" }, 0);

    return () => tl.kill();
  }, [activeKey, prevKey]);

  return (
    <div className="homeOverlay__previewStage" data-preview={activeKey}>
      {/* <div ref={prevRef} className="homeOverlay__previewLayer homeOverlay__previewLayer--prev">
        {renderKey(prevKey, false)}
      </div> */}

      <div ref={nextRef} className="homeOverlay__previewLayer homeOverlay__previewLayer--next">
        {renderKey(activeKey, true)}
      </div>

      {/* glow overlay (léger, sans toucher layout) */}
      <div className="homeOverlay__previewGlow" aria-hidden="true" />
    </div>
  );
}


// import React, { useEffect, useMemo, useRef, useState } from "react";
// import gsap from "gsap";

// const clamp01 = (n) => Math.max(0, Math.min(1, n));

// function PreviewExplore() {
//   // 👉 met une image "city" (screenshot de ta scène 3D)
//   return (
//     <div className="homeOverlay__previewMedia">
//       <img
//         src="/preview_city.jpg"
//         alt="City preview"
//         className="homeOverlay__previewImg homeOverlay__previewImg--cover"
//         loading="eager"
//       />
//       <div className="homeOverlay__previewCaption">ANGELS CITY — 3D WORLD</div>
//     </div>
//   );
// }

// function PreviewAbout() {
//   // 👉 met ton portrait / render
//   return (
//     <div className="homeOverlay__previewMedia">
//       <img
//         src="/preview_kasia.jpg"
//         alt="About preview"
//         className="homeOverlay__previewImg"
//         loading="lazy"
//       />
//       <div className="homeOverlay__previewCaption">KASIA — CREATIVE TECH</div>
//     </div>
//   );
// }

// function PreviewProjects() {
//   // Mini carousel “Portfolio-like” dans la preview
//   // 👉 soit tu hardcode 3-5 images, soit tu les prends depuis /projects.json
//   const [slides, setSlides] = useState([]);

//   // mini fetch (léger)
//   useEffect(() => {
//     fetch("/projects.json")
//       .then((r) => r.json())
//       .then((data) => {
//         const picks = (Array.isArray(data) ? data : [])
//           .slice(0, 5)
//           .flatMap((p) => {
//             const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
//             const cover = p.cover || images[0];
//             const all = [...(cover ? [cover] : []), ...images.filter((s) => s !== cover)];
//             return all.slice(0, 2); // 1-2 images par projet pour rester light
//           })
//           .slice(0, 6);
//         setSlides(picks);
//       })
//       .catch(() => setSlides([]));
//   }, []);

//   const viewportRef = useRef(null);
//   const trackRef = useRef(null);

//   const isTouch = useMemo(() => {
//     if (typeof window === "undefined") return false;
//     return (
//       "ontouchstart" in window ||
//       navigator.maxTouchPoints > 0 ||
//       /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
//     );
//   }, []);

//   const handleMove = (e) => {
//     if (isTouch) return;
//     const viewport = viewportRef.current;
//     const track = trackRef.current;
//     if (!viewport || !track) return;

//     const rect = viewport.getBoundingClientRect();
//     const tpos = clamp01((e.clientX - rect.left) / rect.width);

//     const slidesCount = track.children?.length || 0;
//     if (slidesCount <= 1) return;

//     const vw = viewport.clientWidth;
//     const maxX = (slidesCount - 1) * vw;
//     const targetX = -tpos * maxX;

//     if (!track._quickX) {
//       track._quickX = gsap.quickTo(track, "x", { duration: 0.28, ease: "power3.out" });
//     }
//     track._quickX(targetX);
//   };

//   return (
//     <div className="homeOverlay__previewSlider" onMouseMove={handleMove}>
//       <div className="homeOverlay__previewScanlines" />
//       <div className="homeOverlay__previewViewport" ref={viewportRef}>
//         <div className="homeOverlay__previewTrack" ref={trackRef}>
//           {(slides.length ? slides : ["/preview_project_1.jpg", "/preview_project_2.jpg", "/preview_project_3.jpg"]).map(
//             (src, idx) => (
//               <div className="homeOverlay__previewSlide" key={`${src}-${idx}`}>
//                 <img src={src} alt={`Project ${idx + 1}`} loading="lazy" />
//               </div>
//             )
//           )}
//         </div>
//       </div>

//       <div className="homeOverlay__previewCaption">PROJECTS — HOVER TO SWIPE ✦</div>
//     </div>
//   );
// }

// function PreviewContact() {
//   // 👉 remplace par tes vrais liens
//   const CONTACT = {
//     mail: "mailto:hello@angelsgang.com",
//     tel: "tel:+32400000000",
//     linkedin: "https://www.linkedin.com/in/your-profile/",
//     tiktok: "https://www.tiktok.com/@yourhandle",
//   };

//   return (
//     <div className="homeOverlay__previewContacts">
//       <a className="homeOverlay__iconBtn" href={CONTACT.mail} aria-label="Email">
//         <span aria-hidden="true">✉️</span>
//         <span className="homeOverlay__iconLbl">MAIL</span>
//       </a>

//       <a className="homeOverlay__iconBtn" href={CONTACT.tel} aria-label="Phone">
//         <span aria-hidden="true">📞</span>
//         <span className="homeOverlay__iconLbl">PHONE</span>
//       </a>

//       <a className="homeOverlay__iconBtn" href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
//         <span aria-hidden="true">💼</span>
//         <span className="homeOverlay__iconLbl">LINKEDIN</span>
//       </a>

//       <a className="homeOverlay__iconBtn" href={CONTACT.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
//         <span aria-hidden="true">🎵</span>
//         <span className="homeOverlay__iconLbl">TIKTOK</span>
//       </a>

//       <div className="homeOverlay__previewCaption">CONTACT — CLICK ✦</div>
//     </div>
//   );
// }

// export default function MenuPreview({ activeKey }) {
//   if (activeKey === "explore") return <PreviewExplore />;
//   if (activeKey === "about") return <PreviewAbout />;
//   if (activeKey === "projects") return <PreviewProjects />;
//   if (activeKey === "contact") return <PreviewContact />;
//   return null;
// }
