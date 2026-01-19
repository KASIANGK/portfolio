import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Portfolio.css";
import gsap from "gsap";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [hovered, setHovered] = useState(null);

  // ✅ Filters (All auto-checks both)
  const [filters, setFilters] = useState({ all: true, web: true, d3: true });

  // refs per card
  const sliderRefs = useRef(new Map());
  const wrapperRefs = useRef(new Map());

  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    );
  }, []);

  useEffect(() => {
    fetch("/projects.json")
      .then((r) => r.json())
      .then(setProjects)
      .catch((err) => console.error("Error:", err));
  }, []);

  const setSliderRef = (id) => (el) => {
    if (!el) return;
    sliderRefs.current.set(id, el);
  };

  const setWrapperRef = (id) => (el) => {
    if (!el) return;
    wrapperRefs.current.set(id, el);
  };

  const animateOverlayIn = (id) => {
    gsap.to(`.pcard__overlay--${id}`, { opacity: 1, duration: 0.22, ease: "power2.out" });
    gsap.to(`.pcard__cta--${id}`, { y: 0, opacity: 1, duration: 0.26, ease: "power3.out" });
  };

  const animateOverlayOut = (id) => {
    gsap.to(`.pcard__overlay--${id}`, { opacity: 0, duration: 0.18, ease: "power2.out" });
    gsap.to(`.pcard__cta--${id}`, { y: 8, opacity: 0, duration: 0.18, ease: "power2.out" });
  };

  const handleEnter = (id) => {
    if (isTouch) return;
    setHovered(id);
    animateOverlayIn(id);
  };

  const handleLeave = (id) => {
    if (isTouch) return;
    setHovered(null);
    animateOverlayOut(id);
  };

  // ✅ Desktop "scan": move mouse -> scroll horizontally (reliable)
  const handleMove = (e, id) => {
    if (isTouch) return;

    const slider = sliderRefs.current.get(id);
    const wrapper = wrapperRefs.current.get(id);
    if (!slider || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const t = clamp(localX / rect.width, 0, 1);

    const max = Math.max(0, slider.scrollWidth - slider.clientWidth);
    const target = t * max;

    if (!slider._quickScroll) {
      slider._quickScroll = gsap.quickTo(slider, "scrollLeft", {
        duration: 0.25,
        ease: "power3.out",
      });
    }
    slider._quickScroll(target);
  };

  // ---- Filter logic (as requested)
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

  return (
    <div className="portfolio">
      <header className="portfolio__header">
        <div className="portfolio__headerInner">
          <div className="portfolio__titleWrap">
            <h1 className="portfolio__title">PORTFOLIO</h1>
            <p className="portfolio__subtitle">
              Web Dev & 3D — a selection of my builds.
            </p>

            <div className="portfolio__filters" role="group" aria-label="Project filters">
              <label className="pf">
                <input type="checkbox" checked={filters.all} onChange={toggleAll} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">All</span>
              </label>

              <label className="pf">
                <input type="checkbox" checked={filters.web} onChange={toggleWeb} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">Web Dev</span>
              </label>

              <label className="pf">
                <input type="checkbox" checked={filters.d3} onChange={toggle3D} />
                <span className="pf__box" aria-hidden="true" />
                <span className="pf__label">3D</span>
              </label>
            </div>
          </div>

          <div className="portfolio__chip">KASIA</div>
        </div>
      </header>

      <section className="portfolio__grid">
        {filteredProjects.map((project) => {
          const id = project.id;
          const images = Array.isArray(project.images) ? project.images.filter(Boolean) : [];
          const cover = project.cover || images[0];

          return (
            <article
              key={id}
              className={`pcard ${hovered === id ? "is-hover" : ""}`}
              onMouseEnter={() => handleEnter(id)}
              onMouseLeave={() => handleLeave(id)}
              onMouseMove={(e) => handleMove(e, id)}
            >
              <div className="pcard__media" ref={setWrapperRef(id)}>
                <div className="pcard__scanlines" />

                <div className="pcard__slider" ref={setSliderRef(id)}>
                  {cover && (
                    <div className="pcard__imgWrap pcard__imgWrap--cover">
                      <img src={cover} alt={`${project.title} cover`} loading="lazy" />
                    </div>
                  )}

                  {images
                    .filter((src) => src !== cover)
                    .map((src, idx) => (
                      <div className="pcard__imgWrap" key={`${id}-${idx}`}>
                        <img src={src} alt={`${project.title} ${idx + 2}`} loading="lazy" />
                      </div>
                    ))}
                </div>

                <div className={`pcard__overlay pcard__overlay--${id}`} />
              </div>

              <div className="pcard__content">
                <div className="pcard__top">
                  <h3 className="pcard__title">{project.title}</h3>

                  <div className="pcard__tags">
                    <span className="pcard__tag">{project.function}</span>
                    {project.tags?.slice?.(0, 2)?.map((t) => (
                      <span className="pcard__tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="pcard__desc">{project.description}</p>

                <div className={`pcard__cta pcard__cta--${id}`}>
                  <a className="pcard__btn" href={project.link} target="_blank" rel="noreferrer">
                    View Project
                  </a>
                  {project.repo ? (
                    <a className="pcard__btn pcard__btn--ghost" href={project.repo} target="_blank" rel="noreferrer">
                      Repo
                    </a>
                  ) : null}
                </div>

                {isTouch ? <div className="pcard__hint">Swipe images →</div> : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}







// import React, { useEffect, useState } from 'react';
// import './Portfolio.css';
// import gsap from 'gsap';

// const Portfolio = () => {
//   const [projects, setProjects] = useState([]) 
//   const [hovered, setHovered] = useState(null) 
//   const [lastScrollPosition, setLastScrollPosition] = useState({}) // stocker la derniere position du slide 


//   useEffect(() => {
//     fetch('/projects.json')
//       .then(response => response.json()) 
//       .then(projectsData => {
//         setProjects(projectsData); 
//       })
//       .catch(error => console.error("Error:", error)); 
//   }, []); 

//   // fonction qui s'active au survol d'un projet
//   const handleMouseEnter = (id) => {
//     setHovered(id) // marquer le projet comme survole
//     gsap.to(`.project-images-${id}`, { opacity: 1, duration: 0.5 }); 
//     gsap.to(`.project-image-${id}`, { opacity: 0.5, duration: 0.5 }); 
//   }

//   // fonction qui s'active quand le survol d'un projet est quitte
//   const handleMouseLeave = (id) => {
//     setHovered(null) // pour enlever le survol
//     // reinitialisation du defilement en appliquant la derniere position
//     const imageSlider = document.querySelector(`.image-slider-${id}`);
//     if (imageSlider && lastScrollPosition[id] !== undefined) {
//       imageSlider.style.transform = `translateX(-${lastScrollPosition[id]}px)`; // reinitialisation du defilement selon la derniere position
//     }
//   }

//   // fonction qui gere le mouvement de la mouse pour defiler les images horizontalement
//   const handleMouseMove = (e, id) => {
//     const { clientX, currentTarget } = e; // coordonnees de la mouse
//     const { width } = currentTarget.getBoundingClientRect(); // largeur de l'element cible
//     const mouseXPercentage = (clientX / width) * 100; // pourcentage du mouvement horizontal de la mouse

//     // recuperation du slider des images
//     const imageSlider = document.querySelector(`.image-slider-${id}`);
//     if (imageSlider) {
//       const totalWidth = imageSlider.scrollWidth; // largeur totale des images dans le slider
//       const offset = (mouseXPercentage / 100) * (totalWidth - width); // calcul du deplacement horizontal en fonction du pourcentage de la mouse
//       imageSlider.style.transform = `translateX(-${offset}px)`; // deplacement sur le slider

//       // memoire de la derniere position du defilement pour chaque projet
//       setLastScrollPosition(prevState => ({
//         ...prevState,
//         [id]: offset // stockage de la nouvelle position
//       }));
//     }
//   }

//   return (
//     <div className='portfolio-container-all'>
//         <div className='portfolio-title'>
//             <h3>Portfolio</h3>
//         </div>
//         <div className="portfolio-container">
//         {projects.map((project) => (
//             <div 
//             key={project.id} 
//             className="portfolio-item"
//             onMouseEnter={() => handleMouseEnter(project.id)}
//             onMouseLeave={() => handleMouseLeave(project.id)} 
//             onMouseMove={(e) => handleMouseMove(e, project.id)} 
//             >
//             <div className={`project-images project-images-${project.id}`}>
//                 <div className={`image-slider image-slider-${project.id}`}>
//                 {Array.isArray(project.images) && project.images.map((img, index) => (
//                     <img key={index} src={img} alt={`Additional ${project.title}`} /> // affichage des images supplementaires du projet
//                 ))}
//                 </div>
//             </div>
//             <div className="project-details">
//                 <h3>{project.title}</h3> 
//                 <p>{project.description}</p> 
//                 <a href={project.link} target="_blank" rel="noopener noreferrer">View Project</a> 
//             </div>
//             </div>
//         ))}
//         </div>
//     </div>
//   )
// }

// export default Portfolio