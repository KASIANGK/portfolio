import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./Portfolio.css";
import gsap from "gsap";
import { useTranslation, Trans } from "react-i18next";
import { preloadImagesOnce } from "../../utils/projectsCache";

const clamp01 = (n) => Math.max(0, Math.min(1, n));

function getSlides(project) {
  const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
  const cover = project.cover || images[0];
  return [...(cover ? [cover] : []), ...images.filter((src) => src !== cover)];
}

export default function Portfolio({ initialProjects = null }) {
  const { t } = useTranslation("portfolio");

  const [projects, setProjects] = useState(() =>
    Array.isArray(initialProjects) ? initialProjects : []
  );
  const [hovered, setHovered] = useState(null);

  // Filters
  const [filters, setFilters] = useState({ all: true, web: true, d3: true });

  // Pagination
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const gridRef = useRef(null);

  const viewportRefs = useRef(new Map());
  const trackRefs = useRef(new Map());

  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    );
  }, []);

  // Fetch only if Home didn’t provide data
  useEffect(() => {
    if (Array.isArray(initialProjects) && initialProjects.length) return;

    fetch("/projects.json", { cache: "force-cache" })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error:", err));
  }, [initialProjects]);

  const setViewportRef = (id) => (el) => {
    if (!el) return;
    viewportRefs.current.set(id, el);
  };

  const setTrackRef = (id) => (el) => {
    if (!el) return;
    trackRefs.current.set(id, el);
  };

  const animateOverlayIn = (id) => {
    gsap.to(`.pcard__overlay--${id}`, { opacity: 1, duration: 0.22, ease: "power2.out" });
    gsap.to(`.pcard__cta--${id}`, { y: 0, opacity: 1, duration: 0.26, ease: "power3.out" });
  };

  const animateOverlayOut = (id) => {
    gsap.to(`.pcard__overlay--${id}`, { opacity: 0, duration: 0.18, ease: "power2.out" });
    gsap.to(`.pcard__cta--${id}`, { y: 8, opacity: 0, duration: 0.18, ease: "power2.out" });
  };

  const handleMove = (e, id) => {
    if (isTouch) return;

    const viewport = viewportRefs.current.get(id);
    const track = trackRefs.current.get(id);
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

  // --- filters logic
  const toggleAll = () => setFilters({ all: true, web: true, d3: true });

  const toggleWeb = () => {
    setFilters((prev) => {
      const web = !prev.web;
      const d3 = prev.d3;
      const all = web && d3;
      return { all, web, d3 };
    });
  };

  const toggle3D = () => {
    setFilters((prev) => {
      const d3 = !prev.d3;
      const web = prev.web;
      const all = web && d3;
      return { all, web, d3 };
    });
  };

  const filteredProjects = useMemo(() => {
    const norm = (v) => String(v || "").toLowerCase().trim();
    return projects.filter((p) => {
      if (filters.all) return true;
      const f = norm(p.function);
      const isWeb = f === "web dev" || f === "web" || f.includes("web");
      const is3D = f === "3d" || f.includes("3d");
      return (filters.web && isWeb) || (filters.d3 && is3D);
    });
  }, [projects, filters]);

  const totalPages = useMemo(() => {
    const tp = Math.ceil(filteredProjects.length / PAGE_SIZE);
    return Math.max(1, tp);
  }, [filteredProjects.length]);

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedProjects = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, page]);

  const startIndex = filteredProjects.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, filteredProjects.length);

  const scrollGridIntoView = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToPage = useCallback(
    (nextPage) => {
      setPage(() => Math.min(Math.max(1, nextPage), totalPages));
      requestAnimationFrame(scrollGridIntoView);
    },
    [totalPages, scrollGridIntoView]
  );

  const goPrev = () => goToPage(page - 1);
  const goNext = () => goToPage(page + 1);

  const pageDots = useMemo(() => {
    const maxDots = 7;
    if (totalPages <= maxDots) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - windowSize + 1;
    }

    const dots = [];
    dots.push(1);
    if (start > 2) dots.push("…");

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) dots.push(i);
    }

    if (end < totalPages - 1) dots.push("…");
    dots.push(totalPages);

    return dots.filter((v, idx, arr) => !(v === arr[idx - 1]));
  }, [page, totalPages]);

  // ✅ Preload page images ONCE per (filters+page) key
  const preloadedPageKeys = useRef(new Set());

  useEffect(() => {
    if (!pagedProjects.length) return;

    const key = `${filters.all}-${filters.web}-${filters.d3}__${page}`;
    if (preloadedPageKeys.current.has(key)) return;
    preloadedPageKeys.current.add(key);

    const urls = [];
    pagedProjects.forEach((p) => {
      getSlides(p).slice(0, 3).forEach((u) => urls.push(u));
    });

    preloadImagesOnce((urls));
  }, [pagedProjects, page, filters]);

  // ✅ Preload slides for a given card when user is about to interact
  const warmCard = useCallback((project) => {
    if (!project) return;
    const urls = getSlides(project); // all slides
    preloadImagesOnce(urls);
  }, []);

  const handleEnter = (project) => {
    if (isTouch) return;
    setHovered(project.id);
    animateOverlayIn(project.id);
    warmCard(project);
  };

  const handleLeave = (project) => {
    if (isTouch) return;
    setHovered(null);
    animateOverlayOut(project.id);
  };

  return (
    <div className="portfolio">
      <header className="portfolio__header">
        <div className="portfolio__headerInner">
          <div className="portfolio__titleWrap">
            <h1 className="portfolio__title">PORTFOLIO</h1>
            <p className="portfolio__subtitle">{t("subtitle")}</p>

            <div className="portfolio__filters" role="group" aria-label={t("filters.aria")}>
              <label className="pf">
                <input type="checkbox" checked={filters.all} onChange={toggleAll} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">{t("filters.all")}</span>
              </label>

              <label className="pf">
                <input type="checkbox" checked={filters.web} onChange={toggleWeb} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">{t("filters.web")}</span>
              </label>

              <label className="pf">
                <input type="checkbox" checked={filters.d3} onChange={toggle3D} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">{t("filters.d3")}</span>
              </label>
            </div>
          </div>

          <div className="portfolio__chip">{t("chip")}</div>
        </div>
      </header>

      <section className="portfolio__grid" ref={gridRef}>
        {pagedProjects.map((project) => {
          const id = project.id;
          const slides = getSlides(project);

          return (
            <article
              key={id}
              className={`pcard ${hovered === id ? "is-hover" : ""}`}
              onMouseEnter={() => handleEnter(project)}
              onMouseLeave={() => handleLeave(project)}
              onMouseMove={(e) => handleMove(e, id)}
              onFocus={() => warmCard(project)}
            >
              <div className="pcard__media">
                <div className="pcard__scanlines" />
                <div className="pcard__slider" ref={setViewportRef(id)}>
                  <div className="pcard__track" ref={setTrackRef(id)}>
                    {slides.map((src, idx) => (
                      <div
                        className={`pcard__imgWrap ${idx === 0 ? "pcard__imgWrap--cover" : ""}`}
                        key={`${id}-${idx}`}
                      >
                        {/* <img
                          src={src}
                          alt={`${project.title} ${idx + 1}`}
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding="async"
                          fetchpriority={idx === 0 ? "high" : "auto"}
                        /> */}
                        <img
                          src={src}
                          alt={`${project.title} ${idx + 1}`}
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding={idx === 0 ? "sync" : "async"}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                        />

                      </div>
                    ))}
                  </div>
                </div>

                <div className={`pcard__overlay pcard__overlay--${id}`} />
              </div>

              <div className="pcard__content">
                <div className="pcard__top">
                  <h3 className="pcard__title">{project.title}</h3>
                  <div className="pcard__tags">
                    <span className="pcard__tag">{project.function}</span>
                    {project.tags?.slice?.(0, 2)?.map((tg) => (
                      <span className="pcard__tag" key={tg}>
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="pcard__desc">{project.description}</p>

                <div className={`pcard__cta pcard__cta--${id}`}>
                  <a className="pcard__btn" href={project.link} target="_blank" rel="noreferrer">
                    {t("buttons.view")}
                  </a>

                  {project.repo ? (
                    <a className="pcard__btn pcard__btn--ghost" href={project.repo} target="_blank" rel="noreferrer">
                      {t("buttons.repo")}
                    </a>
                  ) : null}
                </div>

                {isTouch ? <div className="pcard__hint">{t("hintSwipe")}</div> : null}
              </div>
            </article>
          );
        })}
      </section>

      <nav className="portfolio__pager" aria-label={t("pager.aria")}>
        <button className="ppg__btn" onClick={goPrev} disabled={page <= 1} aria-label={t("pager.prevAria")}>
          <span className="ppg__icon" aria-hidden="true">←</span>
          <span className="ppg__txt">{t("pager.prev")}</span>
        </button>

        <div className="ppg__center">
          <div className="ppg__dots" role="list" aria-label={t("pager.pagesAria")}>
            {pageDots.map((d, idx) => {
              if (d === "…") {
                return (
                  <span className="ppg__ellipsis" key={`e-${idx}`} aria-hidden="true">
                    …
                  </span>
                );
              }
              const p = d;
              const active = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  className={`ppg__dot ${active ? "is-active" : ""}`}
                  onClick={() => goToPage(p)}
                  aria-current={active ? "page" : undefined}
                  aria-label={t("pager.goToPage", { page: p })}
                />
              );
            })}
          </div>

          <div className="ppg__meta" aria-label={t("pager.metaAria")}>
            <span className="ppg__showing">
              <Trans
                i18nKey="pager.showing"
                ns="portfolio"
                values={{ start: startIndex, end: endIndex, total: filteredProjects.length }}
                components={{ b: <b /> }}
              />
            </span>
            <span className="ppg__sep" aria-hidden="true">•</span>
            <span className="ppg__count">
              <Trans
                i18nKey="pager.pageOf"
                ns="portfolio"
                values={{ page, total: totalPages }}
                components={{ b: <b /> }}
              />
            </span>
          </div>
        </div>

        <button className="ppg__btn" onClick={goNext} disabled={page >= totalPages} aria-label={t("pager.nextAria")}>
          <span className="ppg__txt">{t("pager.next")}</span>
          <span className="ppg__icon" aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  );
}





// // src/Pages/Portfolio/Portfolio.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import "./Portfolio.css";
// import gsap from "gsap";
// import { useTranslation, Trans } from "react-i18next";

// const clamp01 = (n) => Math.max(0, Math.min(1, n));

// function preloadImages(urls = []) {
//   urls
//     .filter(Boolean)
//     .forEach((src) => {
//       const img = new Image();
//       img.decoding = "async";
//       img.src = src;
//     });
// }

// export default function Portfolio({ initialProjects = null }) {
//   const { t } = useTranslation("portfolio");

//   const [projects, setProjects] = useState(() => (Array.isArray(initialProjects) ? initialProjects : []));
//   const [hovered, setHovered] = useState(null);

//   // ✅ Filters
//   const [filters, setFilters] = useState({ all: true, web: true, d3: true });

//   // ✅ Pagination
//   const PAGE_SIZE = 6;
//   const [page, setPage] = useState(1);
//   const gridRef = useRef(null);

//   const viewportRefs = useRef(new Map());
//   const trackRefs = useRef(new Map());

//   const isTouch = useMemo(() => {
//     if (typeof window === "undefined") return false;
//     return (
//       "ontouchstart" in window ||
//       navigator.maxTouchPoints > 0 ||
//       /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
//     );
//   }, []);

//   // ✅ Fetch only if Home didn’t provide data
//   useEffect(() => {
//     if (Array.isArray(initialProjects) && initialProjects.length) return;

//     fetch("/projects.json")
//       .then((r) => r.json())
//       .then((data) => setProjects(Array.isArray(data) ? data : []))
//       .catch((err) => console.error("Error:", err));
//   }, [initialProjects]);

//   // ✅ Warm cover images once projects are known (reduces “pop-in”)
//   useEffect(() => {
//     if (!projects.length) return;

//     const covers = projects
//       .map((p) => p.cover || (Array.isArray(p.images) ? p.images[0] : null))
//       .filter(Boolean)
//       .slice(0, 18);

//     preloadImages(covers);
//   }, [projects]);

//   const setViewportRef = (id) => (el) => {
//     if (!el) return;
//     viewportRefs.current.set(id, el);
//   };

//   const setTrackRef = (id) => (el) => {
//     if (!el) return;
//     trackRefs.current.set(id, el);
//   };

//   const animateOverlayIn = (id) => {
//     gsap.to(`.pcard__overlay--${id}`, { opacity: 1, duration: 0.22, ease: "power2.out" });
//     gsap.to(`.pcard__cta--${id}`, { y: 0, opacity: 1, duration: 0.26, ease: "power3.out" });
//   };

//   const animateOverlayOut = (id) => {
//     gsap.to(`.pcard__overlay--${id}`, { opacity: 0, duration: 0.18, ease: "power2.out" });
//     gsap.to(`.pcard__cta--${id}`, { y: 8, opacity: 0, duration: 0.18, ease: "power2.out" });
//   };

//   const handleMove = (e, id) => {
//     if (isTouch) return;

//     const viewport = viewportRefs.current.get(id);
//     const track = trackRefs.current.get(id);
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

//   const handleEnter = (id) => {
//     if (isTouch) return;
//     setHovered(id);
//     animateOverlayIn(id);
//   };

//   const handleLeave = (id) => {
//     if (isTouch) return;
//     setHovered(null);
//     animateOverlayOut(id);
//   };

//   // --- filters logic
//   const toggleAll = () => setFilters({ all: true, web: true, d3: true });

//   const toggleWeb = () => {
//     setFilters((prev) => {
//       const web = !prev.web;
//       const d3 = prev.d3;
//       const all = web && d3;
//       return { all, web, d3 };
//     });
//   };

//   const toggle3D = () => {
//     setFilters((prev) => {
//       const d3 = !prev.d3;
//       const web = prev.web;
//       const all = web && d3;
//       return { all, web, d3 };
//     });
//   };

//   const filteredProjects = useMemo(() => {
//     const norm = (v) => String(v || "").toLowerCase().trim();
//     return projects.filter((p) => {
//       if (filters.all) return true;
//       const f = norm(p.function);
//       const isWeb = f === "web dev" || f === "web" || f.includes("web");
//       const is3D = f === "3d" || f.includes("3d");
//       return (filters.web && isWeb) || (filters.d3 && is3D);
//     });
//   }, [projects, filters]);

//   const totalPages = useMemo(() => {
//     const tp = Math.ceil(filteredProjects.length / PAGE_SIZE);
//     return Math.max(1, tp);
//   }, [filteredProjects.length]);

//   useEffect(() => setPage(1), [filters]);

//   useEffect(() => {
//     setPage((p) => Math.min(Math.max(1, p), totalPages));
//   }, [totalPages]);

//   const pagedProjects = useMemo(() => {
//     const start = (page - 1) * PAGE_SIZE;
//     return filteredProjects.slice(start, start + PAGE_SIZE);
//   }, [filteredProjects, page]);

//   const startIndex = filteredProjects.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
//   const endIndex = Math.min(page * PAGE_SIZE, filteredProjects.length);

//   const scrollGridIntoView = useCallback(() => {
//     const el = gridRef.current;
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "start" });
//   }, []);

//   const goToPage = useCallback(
//     (nextPage) => {
//       setPage(() => Math.min(Math.max(1, nextPage), totalPages));
//       requestAnimationFrame(scrollGridIntoView);
//     },
//     [totalPages, scrollGridIntoView]
//   );

//   const goPrev = () => goToPage(page - 1);
//   const goNext = () => goToPage(page + 1);

//   const pageDots = useMemo(() => {
//     const maxDots = 7;
//     if (totalPages <= maxDots) return Array.from({ length: totalPages }, (_, i) => i + 1);

//     const windowSize = 5;
//     let start = Math.max(1, page - Math.floor(windowSize / 2));
//     let end = start + windowSize - 1;

//     if (end > totalPages) {
//       end = totalPages;
//       start = end - windowSize + 1;
//     }

//     const dots = [];
//     dots.push(1);
//     if (start > 2) dots.push("…");

//     for (let i = start; i <= end; i++) {
//       if (i !== 1 && i !== totalPages) dots.push(i);
//     }

//     if (end < totalPages - 1) dots.push("…");
//     dots.push(totalPages);

//     return dots.filter((v, idx, arr) => !(v === arr[idx - 1]));
//   }, [page, totalPages]);

//   // ✅ optional: preload slides for visible cards (reduce swipe delay)
//   useEffect(() => {
//     if (!pagedProjects.length) return;
//     const urls = [];
//     pagedProjects.forEach((p) => {
//       const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
//       const cover = p.cover || images[0];
//       const slides = [...(cover ? [cover] : []), ...images.filter((src) => src !== cover)];
//       slides.slice(0, 3).forEach((u) => urls.push(u));
//     });
//     preloadImages(urls);
//   }, [pagedProjects]);

//   return (
//     <div className="portfolio">
//       <header className="portfolio__header">
//         <div className="portfolio__headerInner">
//           <div className="portfolio__titleWrap">
//             <h1 className="portfolio__title">PORTFOLIO</h1>
//             <p className="portfolio__subtitle">{t("subtitle")}</p>

//             <div className="portfolio__filters" role="group" aria-label={t("filters.aria")}>
//               <label className="pf">
//                 <input type="checkbox" checked={filters.all} onChange={toggleAll} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.all")}</span>
//               </label>

//               <label className="pf">
//                 <input type="checkbox" checked={filters.web} onChange={toggleWeb} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.web")}</span>
//               </label>

//               <label className="pf">
//                 <input type="checkbox" checked={filters.d3} onChange={toggle3D} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.d3")}</span>
//               </label>
//             </div>
//           </div>

//           <div className="portfolio__chip">{t("chip")}</div>
//         </div>
//       </header>

//       <section className="portfolio__grid" ref={gridRef}>
//         {pagedProjects.map((project) => {
//           const id = project.id;
//           const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
//           const cover = project.cover || images[0];
//           const slides = [...(cover ? [cover] : []), ...images.filter((src) => src !== cover)];

//           return (
//             <article
//               key={id}
//               className={`pcard ${hovered === id ? "is-hover" : ""}`}
//               onMouseEnter={() => handleEnter(id)}
//               onMouseLeave={() => handleLeave(id)}
//               onMouseMove={(e) => handleMove(e, id)}
//             >
//               <div className="pcard__media">
//                 <div className="pcard__scanlines" />
//                 <div className="pcard__slider" ref={setViewportRef(id)}>
//                   <div className="pcard__track" ref={setTrackRef(id)}>
//                     {slides.map((src, idx) => (
//                       <div
//                         className={`pcard__imgWrap ${idx === 0 ? "pcard__imgWrap--cover" : ""}`}
//                         key={`${id}-${idx}`}
//                       >
//                         <img
//                           src={src}
//                           alt={`${project.title} ${idx + 1}`}
//                           loading={idx === 0 ? "eager" : "lazy"}
//                           decoding="async"
//                           fetchpriority={idx === 0 ? "high" : "auto"}
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className={`pcard__overlay pcard__overlay--${id}`} />
//               </div>

//               <div className="pcard__content">
//                 <div className="pcard__top">
//                   <h3 className="pcard__title">{project.title}</h3>
//                   <div className="pcard__tags">
//                     <span className="pcard__tag">{project.function}</span>
//                     {project.tags?.slice?.(0, 2)?.map((tg) => (
//                       <span className="pcard__tag" key={tg}>
//                         {tg}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 <p className="pcard__desc">{project.description}</p>

//                 <div className={`pcard__cta pcard__cta--${id}`}>
//                   <a className="pcard__btn" href={project.link} target="_blank" rel="noreferrer">
//                     {t("buttons.view")}
//                   </a>

//                   {project.repo ? (
//                     <a className="pcard__btn pcard__btn--ghost" href={project.repo} target="_blank" rel="noreferrer">
//                       {t("buttons.repo")}
//                     </a>
//                   ) : null}
//                 </div>

//                 {isTouch ? <div className="pcard__hint">{t("hintSwipe")}</div> : null}
//               </div>
//             </article>
//           );
//         })}
//       </section>

//       <nav className="portfolio__pager" aria-label={t("pager.aria")}>
//         <button
//           className="ppg__btn"
//           onClick={goPrev}
//           disabled={page <= 1}
//           aria-label={t("pager.prevAria")}
//         >
//           <span className="ppg__icon" aria-hidden="true">←</span>
//           <span className="ppg__txt">{t("pager.prev")}</span>
//         </button>

//         <div className="ppg__center">
//           <div className="ppg__dots" role="list" aria-label={t("pager.pagesAria")}>
//             {pageDots.map((d, idx) => {
//               if (d === "…") {
//                 return (
//                   <span className="ppg__ellipsis" key={`e-${idx}`} aria-hidden="true">
//                     …
//                   </span>
//                 );
//               }
//               const p = d;
//               const active = p === page;
//               return (
//                 <button
//                   key={p}
//                   type="button"
//                   className={`ppg__dot ${active ? "is-active" : ""}`}
//                   onClick={() => goToPage(p)}
//                   aria-current={active ? "page" : undefined}
//                   aria-label={t("pager.goToPage", { page: p })}
//                 />
//               );
//             })}
//           </div>

//           <div className="ppg__meta" aria-label={t("pager.metaAria")}>
//             <span className="ppg__showing">
//               <Trans
//                 i18nKey="pager.showing"
//                 ns="portfolio"
//                 values={{ start: startIndex, end: endIndex, total: filteredProjects.length }}
//                 components={{ b: <b /> }}
//               />
//             </span>
//             <span className="ppg__sep" aria-hidden="true">•</span>
//             <span className="ppg__count">
//               <Trans
//                 i18nKey="pager.pageOf"
//                 ns="portfolio"
//                 values={{ page, total: totalPages }}
//                 components={{ b: <b /> }}
//               />
//             </span>
//           </div>
//         </div>

//         <button
//           className="ppg__btn"
//           onClick={goNext}
//           disabled={page >= totalPages}
//           aria-label={t("pager.nextAria")}
//         >
//           <span className="ppg__txt">{t("pager.next")}</span>
//           <span className="ppg__icon" aria-hidden="true">→</span>
//         </button>
//       </nav>
//     </div>
//   );
// }






// // src/Pages/Portfolio/Portfolio.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import "./Portfolio.css";
// import gsap from "gsap";
// import { useTranslation, Trans } from "react-i18next";


// const clamp01 = (n) => Math.max(0, Math.min(1, n));

// export default function Portfolio() {
//   const { t } = useTranslation("portfolio"); // ✅ namespace portfolio

//   const [projects, setProjects] = useState([]);
//   const [hovered, setHovered] = useState(null);

//   // ✅ Filters
//   const [filters, setFilters] = useState({ all: true, web: true, d3: true });

//   // ✅ Pagination
//   const PAGE_SIZE = 6;
//   const [page, setPage] = useState(1);
//   const gridRef = useRef(null);

//   const viewportRefs = useRef(new Map());
//   const trackRefs = useRef(new Map());

//   const isTouch = useMemo(() => {
//     if (typeof window === "undefined") return false;
//     return (
//       "ontouchstart" in window ||
//       navigator.maxTouchPoints > 0 ||
//       /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
//     );
//   }, []);

//   useEffect(() => {
//     fetch("/projects.json")
//       .then((r) => r.json())
//       .then(setProjects)
//       .catch((err) => console.error("Error:", err));
//   }, []);

//   const setViewportRef = (id) => (el) => {
//     if (!el) return;
//     viewportRefs.current.set(id, el);
//   };

//   const setTrackRef = (id) => (el) => {
//     if (!el) return;
//     trackRefs.current.set(id, el);
//   };

//   const animateOverlayIn = (id) => {
//     gsap.to(`.pcard__overlay--${id}`, { opacity: 1, duration: 0.22, ease: "power2.out" });
//     gsap.to(`.pcard__cta--${id}`, { y: 0, opacity: 1, duration: 0.26, ease: "power3.out" });
//   };

//   const animateOverlayOut = (id) => {
//     gsap.to(`.pcard__overlay--${id}`, { opacity: 0, duration: 0.18, ease: "power2.out" });
//     gsap.to(`.pcard__cta--${id}`, { y: 8, opacity: 0, duration: 0.18, ease: "power2.out" });
//   };

//   const handleMove = (e, id) => {
//     if (isTouch) return;

//     const viewport = viewportRefs.current.get(id);
//     const track = trackRefs.current.get(id);
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

//   const startAutoSwipe = (id) => {
//     if (isTouch) return;

//     const viewport = viewportRefs.current.get(id);
//     const track = trackRefs.current.get(id);
//     if (!viewport || !track) return;

//     const slidesCount = track.children?.length || 0;
//     if (slidesCount <= 1) return;

//     if (track._tl) {
//       track._tl.kill();
//       track._tl = null;
//     }

//     const vw = viewport.clientWidth;

//     const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut" } });
//     tl.set(track, { x: 0 });

//     for (let i = 1; i < slidesCount; i++) {
//       tl.to(track, { x: -i * vw, duration: 0.6 }, "+=0.55");
//     }
//     tl.to(track, { x: 0, duration: 0.7 }, "+=0.65");

//     track._tl = tl;
//   };

//   const stopAutoSwipe = (id) => {
//     const track = trackRefs.current.get(id);
//     if (!track) return;

//     if (track._tl) {
//       track._tl.kill();
//       track._tl = null;
//     }
//   };

//   const handleEnter = (id) => {
//     if (isTouch) return;
//     setHovered(id);
//     animateOverlayIn(id);
//     // startAutoSwipe(id);
//   };

//   const handleLeave = (id) => {
//     if (isTouch) return;
//     setHovered(null);
//     animateOverlayOut(id);
//     // stopAutoSwipe(id);
//   };

//   // --- filters logic
//   const toggleAll = () => setFilters({ all: true, web: true, d3: true });

//   const toggleWeb = () => {
//     setFilters((prev) => {
//       const web = !prev.web;
//       const d3 = prev.d3;
//       const all = web && d3;
//       return { all, web, d3 };
//     });
//   };

//   const toggle3D = () => {
//     setFilters((prev) => {
//       const d3 = !prev.d3;
//       const web = prev.web;
//       const all = web && d3;
//       return { all, web, d3 };
//     });
//   };

//   const filteredProjects = useMemo(() => {
//     const norm = (v) => String(v || "").toLowerCase().trim();
//     return projects.filter((p) => {
//       if (filters.all) return true;
//       const f = norm(p.function);
//       const isWeb = f === "web dev" || f === "web" || f.includes("web");
//       const is3D = f === "3d" || f.includes("3d");
//       return (filters.web && isWeb) || (filters.d3 && is3D);
//     });
//   }, [projects, filters]);

//   const totalPages = useMemo(() => {
//     const tp = Math.ceil(filteredProjects.length / PAGE_SIZE);
//     return Math.max(1, tp);
//   }, [filteredProjects.length]);

//   useEffect(() => setPage(1), [filters]);

//   useEffect(() => {
//     setPage((p) => Math.min(Math.max(1, p), totalPages));
//   }, [totalPages]);

//   const pagedProjects = useMemo(() => {
//     const start = (page - 1) * PAGE_SIZE;
//     return filteredProjects.slice(start, start + PAGE_SIZE);
//   }, [filteredProjects, page]);

//   const startIndex = filteredProjects.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
//   const endIndex = Math.min(page * PAGE_SIZE, filteredProjects.length);

//   const scrollGridIntoView = useCallback(() => {
//     const el = gridRef.current;
//     if (!el) return;
//     el.scrollIntoView({ behavior: "smooth", block: "start" });
//   }, []);

//   const goToPage = useCallback(
//     (nextPage) => {
//       setPage(() => Math.min(Math.max(1, nextPage), totalPages));
//       requestAnimationFrame(scrollGridIntoView);
//     },
//     [totalPages, scrollGridIntoView]
//   );

//   const goPrev = () => goToPage(page - 1);
//   const goNext = () => goToPage(page + 1);

//   const pageDots = useMemo(() => {
//     const maxDots = 7;
//     if (totalPages <= maxDots) return Array.from({ length: totalPages }, (_, i) => i + 1);

//     const windowSize = 5;
//     let start = Math.max(1, page - Math.floor(windowSize / 2));
//     let end = start + windowSize - 1;

//     if (end > totalPages) {
//       end = totalPages;
//       start = end - windowSize + 1;
//     }

//     const dots = [];
//     dots.push(1);
//     if (start > 2) dots.push("…");

//     for (let i = start; i <= end; i++) {
//       if (i !== 1 && i !== totalPages) dots.push(i);
//     }

//     if (end < totalPages - 1) dots.push("…");
//     dots.push(totalPages);

//     return dots.filter((v, idx, arr) => !(v === arr[idx - 1]));
//   }, [page, totalPages]);

//   useEffect(() => {
//     console.log("MOUNT About");
//     return () => console.log("UNMOUNT About");
//   }, []);
  

//   return (
//     <div className="portfolio">
//       <header className="portfolio__header">
//         <div className="portfolio__headerInner">
//           <div className="portfolio__titleWrap">
//             {/* ✅ H1 intact */}
//             <h1 className="portfolio__title">PORTFOLIO</h1>

//             {/* ✅ i18n */}
//             <p className="portfolio__subtitle">{t("subtitle")}</p>

//             <div className="portfolio__filters" role="group" aria-label={t("filters.aria")}>
//               <label className="pf">
//                 <input type="checkbox" checked={filters.all} onChange={toggleAll} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.all")}</span>
//               </label>

//               <label className="pf">
//                 <input type="checkbox" checked={filters.web} onChange={toggleWeb} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.web")}</span>
//               </label>

//               <label className="pf">
//                 <input type="checkbox" checked={filters.d3} onChange={toggle3D} />
//                 <span className="pf__box" aria-hidden="true" />
//                 <span className="pf__label">{t("filters.d3")}</span>
//               </label>
//             </div>
//           </div>

//           <div className="portfolio__chip">{t("chip")}</div>
//         </div>
//       </header>

//       {/* ✅ GRID */}
//       <section className="portfolio__grid" ref={gridRef}>
//         {pagedProjects.map((project) => {
//           const id = project.id;
//           const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
//           const cover = project.cover || images[0];
//           const slides = [...(cover ? [cover] : []), ...images.filter((src) => src !== cover)];

//           return (
//             <article
//               key={id}
//               className={`pcard ${hovered === id ? "is-hover" : ""}`}
//               onMouseEnter={() => handleEnter(id)}
//               onMouseLeave={() => handleLeave(id)}
//               onMouseMove={(e) => handleMove(e, id)}
//             >
//               <div className="pcard__media">
//                 <div className="pcard__scanlines" />
//                 <div className="pcard__slider" ref={setViewportRef(id)}>
//                   <div className="pcard__track" ref={setTrackRef(id)}>
//                     {slides.map((src, idx) => (
//                       <div
//                         className={`pcard__imgWrap ${idx === 0 ? "pcard__imgWrap--cover" : ""}`}
//                         key={`${id}-${idx}`}
//                       >
//                         <img src={src} alt={`${project.title} ${idx + 1}`} loading="lazy" />
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className={`pcard__overlay pcard__overlay--${id}`} />
//               </div>

//               <div className="pcard__content">
//                 <div className="pcard__top">
//                   <h3 className="pcard__title">{project.title}</h3>
//                   <div className="pcard__tags">
//                     <span className="pcard__tag">{project.function}</span>
//                     {project.tags?.slice?.(0, 2)?.map((tg) => (
//                       <span className="pcard__tag" key={tg}>
//                         {tg}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 <p className="pcard__desc">{project.description}</p>

//                 <div className={`pcard__cta pcard__cta--${id}`}>
//                   <a className="pcard__btn" href={project.link} target="_blank" rel="noreferrer">
//                     {t("buttons.view")}
//                   </a>
//                   {project.repo ? (
//                     <a className="pcard__btn pcard__btn--ghost" href={project.repo} target="_blank" rel="noreferrer">
//                       {t("buttons.repo")}
//                     </a>
//                   ) : null}
//                 </div>

//                 {isTouch ? <div className="pcard__hint">{t("hintSwipe")}</div> : null}
//               </div>
//             </article>
//           );
//         })}
//       </section>

//       {/* ✅ PAGINATION */}
//       <nav className="portfolio__pager" aria-label={t("pager.aria")}>
//         <button
//           className="ppg__btn"
//           onClick={goPrev}
//           disabled={page <= 1}
//           aria-label={t("pager.prevAria")}
//         >
//           <span className="ppg__icon" aria-hidden="true">←</span>
//           <span className="ppg__txt">{t("pager.prev")}</span>
//         </button>

//         <div className="ppg__center">
//           <div className="ppg__dots" role="list" aria-label={t("pager.pagesAria")}>
//             {pageDots.map((d, idx) => {
//               if (d === "…") {
//                 return (
//                   <span className="ppg__ellipsis" key={`e-${idx}`} aria-hidden="true">
//                     …
//                   </span>
//                 );
//               }
//               const p = d;
//               const active = p === page;
//               return (
//                 <button
//                   key={p}
//                   type="button"
//                   className={`ppg__dot ${active ? "is-active" : ""}`}
//                   onClick={() => goToPage(p)}
//                   aria-current={active ? "page" : undefined}
//                   aria-label={t("pager.goToPage", { page: p })}
//                 />
//               );
//             })}
//           </div>

//           <div className="ppg__meta" aria-label={t("pager.metaAria")}>
//             <span className="ppg__showing">
//               <Trans
//                 i18nKey="pager.showing"
//                 ns="portfolio"
//                 values={{ start: startIndex, end: endIndex, total: filteredProjects.length }}
//                 components={{ b: <b /> }}
//               />
//             </span>
//             <span className="ppg__sep" aria-hidden="true">•</span>
//             <span className="ppg__count">
//               <Trans
//                 i18nKey="pager.pageOf"
//                 ns="portfolio"
//                 values={{ page, total: totalPages }}
//                 components={{ b: <b /> }}
//               />
//             </span>
//           </div>
//         </div>

//         <button
//           className="ppg__btn"
//           onClick={goNext}
//           disabled={page >= totalPages}
//           aria-label={t("pager.nextAria")}
//         >
//           <span className="ppg__txt">{t("pager.next")}</span>
//           <span className="ppg__icon" aria-hidden="true">→</span>
//         </button>
//       </nav>
//     </div>
//   );
// }


