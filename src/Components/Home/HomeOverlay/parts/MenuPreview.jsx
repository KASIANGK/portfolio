import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function PreviewExplore() {
  // 👉 met une image "city" (screenshot de ta scène 3D)
  return (
    <div className="homeOverlay__previewMedia">
      <img
        src="/preview_city.jpg"
        alt="City preview"
        className="homeOverlay__previewImg homeOverlay__previewImg--cover"
        loading="eager"
      />
      <div className="homeOverlay__previewCaption">ANGELS CITY — 3D WORLD</div>
    </div>
  );
}

function PreviewAbout() {
  // 👉 met ton portrait / render
  return (
    <div className="homeOverlay__previewMedia">
      <img
        src="/preview_kasia.jpg"
        alt="About preview"
        className="homeOverlay__previewImg"
        loading="lazy"
      />
      <div className="homeOverlay__previewCaption">KASIA — CREATIVE TECH</div>
    </div>
  );
}

function PreviewProjects() {
  // Mini carousel “Portfolio-like” dans la preview
  // 👉 soit tu hardcode 3-5 images, soit tu les prends depuis /projects.json
  const [slides, setSlides] = useState([]);

  // mini fetch (léger)
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
            return all.slice(0, 2); // 1-2 images par projet pour rester light
          })
          .slice(0, 6);
        setSlides(picks);
      })
      .catch(() => setSlides([]));
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

  const handleMove = (e) => {
    if (isTouch) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const rect = viewport.getBoundingClientRect();
    const tpos = clamp01((e.clientX - rect.left) / rect.width);

    const slidesCount = track.children?.length || 0;
    if (slidesCount <= 1) return;

    const vw = viewport.clientWidth;
    const maxX = (slidesCount - 1) * vw;
    const targetX = -tpos * maxX;

    if (!track._quickX) {
      track._quickX = gsap.quickTo(track, "x", { duration: 0.28, ease: "power3.out" });
    }
    track._quickX(targetX);
  };

  return (
    <div className="homeOverlay__previewSlider" onMouseMove={handleMove}>
      <div className="homeOverlay__previewScanlines" />
      <div className="homeOverlay__previewViewport" ref={viewportRef}>
        <div className="homeOverlay__previewTrack" ref={trackRef}>
          {(slides.length ? slides : ["/preview_project_1.jpg", "/preview_project_2.jpg", "/preview_project_3.jpg"]).map(
            (src, idx) => (
              <div className="homeOverlay__previewSlide" key={`${src}-${idx}`}>
                <img src={src} alt={`Project ${idx + 1}`} loading="lazy" />
              </div>
            )
          )}
        </div>
      </div>

      <div className="homeOverlay__previewCaption">PROJECTS — HOVER TO SWIPE ✦</div>
    </div>
  );
}

function PreviewContact() {
  // 👉 remplace par tes vrais liens
  const CONTACT = {
    mail: "mailto:hello@angelsgang.com",
    tel: "tel:+32400000000",
    linkedin: "https://www.linkedin.com/in/your-profile/",
    tiktok: "https://www.tiktok.com/@yourhandle",
  };

  return (
    <div className="homeOverlay__previewContacts">
      <a className="homeOverlay__iconBtn" href={CONTACT.mail} aria-label="Email">
        <span aria-hidden="true">✉️</span>
        <span className="homeOverlay__iconLbl">MAIL</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.tel} aria-label="Phone">
        <span aria-hidden="true">📞</span>
        <span className="homeOverlay__iconLbl">PHONE</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
        <span aria-hidden="true">💼</span>
        <span className="homeOverlay__iconLbl">LINKEDIN</span>
      </a>

      <a className="homeOverlay__iconBtn" href={CONTACT.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
        <span aria-hidden="true">🎵</span>
        <span className="homeOverlay__iconLbl">TIKTOK</span>
      </a>

      <div className="homeOverlay__previewCaption">CONTACT — CLICK ✦</div>
    </div>
  );
}

export default function MenuPreview({ activeKey }) {
  if (activeKey === "explore") return <PreviewExplore />;
  if (activeKey === "about") return <PreviewAbout />;
  if (activeKey === "projects") return <PreviewProjects />;
  if (activeKey === "contact") return <PreviewContact />;
  return null;
}
