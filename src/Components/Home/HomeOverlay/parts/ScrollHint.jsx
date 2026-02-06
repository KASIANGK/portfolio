// src/Components/Home/HomeOverlay/parts/ScrollHint.jsx
import React from "react";

export default function ScrollHint({ visible = true }) {
  const scrollToAboutCenter = () => {
    const el = document.getElementById("about");
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const y = window.scrollY + rect.top;
    const target = y + rect.height / 2 - window.innerHeight / 2;

    window.history.replaceState({}, "", "/#about");
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      scrollToAboutCenter();
    }
  };

  return (
    <div className={`homeOverlay__scrollHint ${visible ? "isVisible" : ""}`}>
      <button
        type="button"
        className="homeOverlay__scrollCircle"
        onClick={scrollToAboutCenter}
        onKeyDown={handleKeyDown}
        aria-label="Scroll to About section"
      >
        <span className="homeOverlay__scrollIcon" aria-hidden="true">
          <svg
            className="homeOverlay__scrollChevronSvg"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="agChevronGrad"
                x1="6"
                y1="8"
                x2="58"
                y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="35%" stopColor="#7C3AED" />
                <stop offset="70%" stopColor="#5B8CFF" />
                <stop offset="100%" stopColor="#FF00AA" />
              </linearGradient>

              <filter id="agChevronGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.4" result="b" />
                <feColorMatrix
                  in="b"
                  type="matrix"
                  values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.85 0"
                  result="g"
                />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g
              fill="none"
              stroke="url(#agChevronGrad)"
              strokeWidth="4.5"
              strokeLinecap="butt"     /* ⬅️ pas arrondi */
              strokeLinejoin="miter"   /* ⬅️ angles nets, cyber */
              filter="url(#agChevronGlow)"
              opacity="0.95"
            >
              <path d="M16 18 L32 34 L48 18" />
              <path d="M16 42 L32 58 L48 42" />
            </g>

          </svg>
        </span>
      </button>
    </div>
  );
}



// // src/Components/Home/HomeOverlay/parts/ScrollHint.jsx
// import React from "react";

// export default function ScrollHint({ visible = true, onClick }) {
//   const handleKeyDown = (e) => {
//     if (!onClick) return;
//     if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
//       e.preventDefault();
//       onClick();
//     }
//   };

//   return (
//     <div className={`homeOverlay__scrollHint ${visible ? "isVisible" : ""}`}>
//       <button
//         type="button"
//         className="homeOverlay__scrollCircle"
//         onClick={onClick}
//         onKeyDown={handleKeyDown}
//         aria-label="Scroll to About section"
//       >
//         <span className="homeOverlay__scrollIcon" aria-hidden="true">
//           <svg
//             className="homeOverlay__scrollChevronSvg"
//             viewBox="0 0 64 64"
//             xmlns="http://www.w3.org/2000/svg"
//             aria-hidden="true"
//           >
//             <defs>
//               <linearGradient id="agChevronGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
//                 <stop offset="0%" stopColor="#00F5FF" />
//                 <stop offset="55%" stopColor="#5B8CFF" />
//                 <stop offset="100%" stopColor="#FF00AA" />
//               </linearGradient>

//               <filter id="agChevronGlow" x="-40%" y="-40%" width="180%" height="180%">
//                 <feGaussianBlur stdDeviation="2.2" result="blur" />
//                 <feMerge>
//                   <feMergeNode in="blur" />
//                   <feMergeNode in="SourceGraphic" />
//                 </feMerge>
//               </filter>
//             </defs>

//             <g
//               fill="none"
//               stroke="url(#agChevronGrad)"
//               strokeWidth="7.5"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               filter="url(#agChevronGlow)"
//               opacity="0.98"
//             >
//               <path d="M16 18 L32 34 L48 18" />

//               <path d="M16 44 L32 60 L48 44" />
//             </g>
//           </svg>

//         </span>
//       </button>
//     </div>
//   );
// }
