// src/Pages/ProjectPage/ProjectPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ProjectPage.css";

const EMPTY = Object.freeze({ web: [], threeD: [] });

function normalizeImages(images) {
  return {
    laptop: Array.isArray(images?.laptop) ? images.laptop.filter(Boolean) : [],
    tablet: Array.isArray(images?.tablet) ? images.tablet.filter(Boolean) : [],
    mobile: Array.isArray(images?.mobile) ? images.mobile.filter(Boolean) : [],
    video: Array.isArray(images?.video) ? images.video.filter(Boolean) : [],
  };
}

function isVideoSrc(src = "") {
  const s = String(src).toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm") || s.endsWith(".mov");
}

function normalizeProject(p) {
  const images = normalizeImages(p?.images || {});
  // ✅ PRIORITY: video → laptop → mobile
  const hero = images.video?.[0] || images.laptop?.[0] || images.mobile?.[0] || "";
  const isVideo = isVideoSrc(hero);

  return {
    ...p,
    slug: String(p?.slug || "").trim(),
    images,
    hero,
    isVideo,
  };
}

function buildMap(json) {
  const map = new Map();
  [...(json?.web || []), ...(json?.threeD || [])].forEach((p) => {
    const n = normalizeProject(p);
    if (n.slug) map.set(n.slug, n);
  });
  return map;
}

export default function ProjectPage({ jsonUrl }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const location = useLocation();

  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const base = import.meta.env.BASE_URL || "/";
  const url = jsonUrl || `${base}locales/${lang}/projects_home.json`;

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  // ✅ Pagination
  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(0);

  // ✅ Lightbox (MUST be before returns)
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        const json = await r.json();
        if (!alive) return;
        setData(json);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setData(EMPTY);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [url]);

  const project = useMemo(() => {
    const map = buildMap(data);
    return slug ? map.get(String(slug).trim()) : null;
  }, [data, slug]);

  const allImages = useMemo(() => {
    if (!project) return [];
    const list = [
      ...project.images.laptop,
      ...project.images.mobile,
      ...project.images.tablet,
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [project]);

  const totalPages = Math.max(1, Math.ceil(allImages.length / ITEMS_PER_PAGE));

  const paginatedImages = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allImages.slice(start, end);
  }, [allImages, page]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  useEffect(() => {
    // reset page + lightbox when project changes
    setPage(0);
    setLightboxIndex(null);
  }, [project?.slug]);

  // Lightbox open index should be absolute index in allImages
  const openLightbox = useCallback(
    (pageLocalIndex) => {
      const abs = page * ITEMS_PER_PAGE + pageLocalIndex;
      if (abs >= 0 && abs < allImages.length) setLightboxIndex(abs);
    },
    [page, ITEMS_PER_PAGE, allImages.length]
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const lbCanNav = allImages.length > 1 && lightboxIndex !== null;

  const lbPrev = useCallback(() => {
    if (!lbCanNav) return;
    setLightboxIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  }, [lbCanNav, allImages.length]);

  const lbNext = useCallback(() => {
    if (!lbCanNav) return;
    setLightboxIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
  }, [lbCanNav, allImages.length]);

  // ✅ Keyboard: ESC + arrows
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lbPrev();
      if (e.key === "ArrowRight") lbNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, closeLightbox, lbPrev, lbNext]);

  // ✅ Lock scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxIndex]);

  if (loading) return <main className="ppage">Loading...</main>;
  if (!project) return <main className="ppage">Not found</main>;

  return (
    <main className="ppage">
      <div className="ppage__shell">
        {/* TOP */}
        <section className="ppage__top">
          {/* LEFT META */}
          <article className="ppage__card ppage__meta">
            <div className="ppage__backRow">
              <button
                className="ppage__backBtn"
                onClick={() => {
                  const filter = location.state?.filter || "all";
                  navigate(`/portfolio?filter=${filter}`, { replace: false });
                }}
              >
                Back
              </button>

            </div>

            <div className="ppage__cat">{project.function}</div>
            <h1 className="ppage__title">{project.title}</h1>

            {project.description ? (
              <p className="ppage__desc">{project.description}</p>
            ) : null}

            {/* STACK */}
            {!!project.stack?.length && (
              <div className="ppage__block">
                <h3 className="ppage__h3">Stack</h3>
                <div className="ppage__chips">
                  {project.stack.map((s) => (
                    <span className="ppage__chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ROLE */}
            {!!project.role?.length && (
              <div className="ppage__block">
                <h3 className="ppage__h3">Role</h3>
                <ul className="ppage__roleList">
                  {project.role.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* RIGHT HERO */}
          <article className="ppage__card ppage__visual">
            <div className="ppage__heroBox" aria-label="Hero media">
              {project.hero ? (
                project.isVideo ? (
                  <video
                    className="ppage__heroEl"
                    src={project.hero}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    controls
                    controlsList="nodownload noplaybackrate"
                    onLoadedMetadata={(e) => {
                      try {
                        // some browsers need a nudge even if autoplay+muted
                        e.currentTarget.play();
                      } catch {}
                    }}
                  />
                ) : (
                  <img
                    className="ppage__heroEl"
                    src={project.hero}
                    alt={project.title}
                    loading="eager"
                    decoding="async"
                  />
                )
              ) : (
                <div className="ppage__heroFallback" aria-hidden="true" />
              )}

              <div className="ppage__scanlines" aria-hidden="true" />
              <div className="ppage__heroFx" aria-hidden="true" />
            </div>
          </article>
        </section>

        {/* GALLERY + PAGINATION */}
        {allImages.length > 0 && (
          <section className="ppage__galleryWrap" aria-label="Gallery">
            <div className="ppage__galleryGrid">
              {paginatedImages.map((src, i) => (
                <button
                  type="button"
                  key={`${src}_${i}`}
                  className="ppage__galleryItem"
                  onClick={() => openLightbox(i)}
                  aria-label={`Open image ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`${project.title} ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="ppage__scanlines" aria-hidden="true" />
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="ppage__pager" aria-label="Gallery pagination">
                <button
                  className="ppg__btn"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <span className="ppg__icon" aria-hidden="true">
                    ←
                  </span>
                  <span className="ppg__txt">Prev</span>
                </button>

                <div className="ppg__center">
                  <div className="ppg__meta">
                    <span className="ppg__count">
                      <b>{page + 1}</b>
                    </span>
                    <span className="ppg__sep">/</span>
                    <span className="ppg__count">
                      <b>{totalPages}</b>
                    </span>
                  </div>

                  <div className="ppg__dots" aria-label="Pages">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`ppg__dot ${idx === page ? "is-active" : ""}`}
                        onClick={() => setPage(idx)}
                        aria-label={`Go to page ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  className="ppg__btn"
                  disabled={!canNext}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  <span className="ppg__txt">Next</span>
                  <span className="ppg__icon" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ✅ LIGHTBOX */}
      {lightboxIndex !== null && (
        <div className="ppage__lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
          <div className="ppage__lightboxInner" onClick={(e) => e.stopPropagation()}>
            <button className="ppage__lbClose" onClick={closeLightbox} aria-label="Close">
              ✕
            </button>

            <img
              className="ppage__lbImg"
              src={allImages[lightboxIndex]}
              alt={`${project.title} preview`}
            />

            {allImages.length > 1 && (
              <>
                <button className="ppage__lbNav ppage__lbPrev" onClick={lbPrev} aria-label="Previous">
                  ←
                </button>
                <button className="ppage__lbNav ppage__lbNext" onClick={lbNext} aria-label="Next">
                  →
                </button>
              </>
            )}

            <div className="ppage__lbHint" aria-hidden="true">
              ESC to close · ← → to navigate
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
