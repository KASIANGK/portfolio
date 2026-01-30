// src/Components/Contact/Contact.jsx
import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import Draggable from "react-draggable";
import "./Contact.css";
import useMountLog from "../../utils/useMountLog";

const DRAG_CANCEL = "input, textarea, select, button, a";
const EMPTY_CONTACT = { name: "", email: "" };

function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function normalizeContact(v) {
  if (!v) return EMPTY_CONTACT;
  const name = String(v.name || "").trim();
  const email = String(v.email || "").trim();
  return { name, email };
}
function hasContactData(v) {
  return !!(v && (String(v.name || "").trim() || String(v.email || "").trim()));
}
function sameContact(a, b) {
  const A = normalizeContact(a);
  const B = normalizeContact(b);
  return A.name === B.name && A.email === B.email;
}
function sameSubjects(a, b) {
  const A = asArray(a);
  const B = asArray(b);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    if (String(A[i]?.id) !== String(B[i]?.id)) return false;
    if (String(A[i]?.title) !== String(B[i]?.title)) return false;
    if (String(A[i]?.message) !== String(B[i]?.message)) return false;
  }
  return true;
}

const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

function Contact({ initialContactInfo = null, initialSubjects = null }) {
  useMountLog("Contact");

  const didFetchRef = useRef(false);
  const didReadyRef = useRef(false);

  const initialContact = useMemo(
    () => (hasContactData(initialContactInfo) ? normalizeContact(initialContactInfo) : EMPTY_CONTACT),
    [initialContactInfo]
  );
  const initialSubjs = useMemo(() => asArray(initialSubjects), [initialSubjects]);

  const [contactInfo, setContactInfo] = useState(() => initialContact);
  const [subjects, setSubjects] = useState(() => initialSubjs);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [message, setMessage] = useState("");
  const [activeDiv, setActiveDiv] = useState("userInfos");

  const title = useMemo(() => "CONTACT ME", []);

  const containerRef = useRef(null);
  const userNodeRef = useRef(null);
  const contentNodeRef = useRef(null);

  // canDrag only on fine pointer/hover
  const [canDrag, setCanDrag] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = () => setCanDrag(!!mql.matches);

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener?.(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener?.(onChange);
    };
  }, []);

  // keep state in sync if props change (dev)
  useEffect(() => {
    if (!hasContactData(initialContactInfo)) return;
    setContactInfo((prev) => (sameContact(prev, initialContactInfo) ? prev : normalizeContact(initialContactInfo)));
  }, [initialContactInfo]);

  useEffect(() => {
    if (!Array.isArray(initialSubjects)) return;
    setSubjects((prev) => (sameSubjects(prev, initialSubjects) ? prev : asArray(initialSubjects)));
  }, [initialSubjects]);

  // Fetch ONLY if missing (once)
  useEffect(() => {
    if (didFetchRef.current) return;

    const alreadyHaveContact = hasContactData(initialContactInfo) || hasContactData(contactInfo);
    const alreadyHaveSubjects =
      (Array.isArray(initialSubjects) && initialSubjects.length) ||
      (Array.isArray(subjects) && subjects.length);

    if (alreadyHaveContact && alreadyHaveSubjects) return;

    didFetchRef.current = true;

    const ac = new AbortController();

    (async () => {
      try {
        const tasks = [];

        if (!alreadyHaveContact) {
          tasks.push(
            fetch("/messages.json", { signal: ac.signal, cache: "force-cache" })
              .then((r) => r.json())
              .then((data) => {
                const first = Array.isArray(data) ? data[0] : null;
                if (!first) return;
                setContactInfo((prev) => (sameContact(prev, first) ? prev : normalizeContact(first)));
              })
          );
        }

        if (!alreadyHaveSubjects) {
          tasks.push(
            fetch("/subjects.json", { signal: ac.signal, cache: "force-cache" })
              .then((r) => r.json())
              .then((data) => {
                const next = Array.isArray(data) ? data : [];
                setSubjects((prev) => (sameSubjects(prev, next) ? prev : next));
              })
          );
        }

        await Promise.all(tasks);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Contact fetch error:", err);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-fill message
  useEffect(() => {
    if (!selectedSubject) return;
    const selected = subjects.find((s) => String(s.id) === String(selectedSubject));
    setMessage(selected?.message || "");
  }, [selectedSubject, subjects]);

  // ✅ READY signal (once): slightly later (3 RAF) => reduces "reveal too early"
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didReadyRef.current) return;

    const hasSomeData = (subjects?.length || 0) > 0 || hasContactData(contactInfo);
    if (!hasSomeData) return;
    if (!containerRef.current) return;

    didReadyRef.current = true;

    (async () => {
      await rafN(3);
      try {
        if (!window.__AG_CTC_READY__) {
          window.__AG_CTC_READY__ = true;
          window.dispatchEvent(new Event("ag:contactReady"));
        }
      } catch {}
    })();
  }, [subjects?.length, contactInfo]);

  const onFocusPanel = useCallback((key) => setActiveDiv(key), []);
  const onChangeName = useCallback((e) => setContactInfo((p) => ({ ...p, name: e.target.value })), []);
  const onChangeEmail = useCallback((e) => setContactInfo((p) => ({ ...p, email: e.target.value })), []);
  const onChangeSubject = useCallback((e) => setSelectedSubject(e.target.value), []);
  const onChangeMessage = useCallback((e) => setMessage(e.target.value), []);

  return (
    <div className="ctc-page">
      <div className="ctc-title">
        <h2>{title}</h2>
        <div className="ctc-subline">
          <span className="ctc-dot" />
          <span>Promis, je reponds vite!</span>
          <span className="ctc-dot" />
        </div>
      </div>

      <div className="contact-container" ref={containerRef}>
        {/* USER INFOS */}
        <Draggable
          nodeRef={userNodeRef}
          bounds="parent"
          cancel={DRAG_CANCEL}
          disabled={!canDrag}
          onStart={() => onFocusPanel("userInfos")}
        >
          <div
            ref={userNodeRef}
            className={`ctc-panel ctc-user-infos ${activeDiv === "userInfos" ? "active" : ""}`}
            onMouseDown={() => onFocusPanel("userInfos")}
            role="group"
          >
            <div className="ctc-grab" aria-hidden="true">
              <span className="ctc-grab__hand">✋</span>
              <span className="ctc-grab__txt">grab me</span>
            </div>

            <div className="ctc-panel__hud" aria-hidden="true" />

            <div className="ctc-panel__header">
              <div className="ctc-kicker">identity</div>
              <div className="ctc-headline">User infos</div>
            </div>

            <label className="ctc-field">
              <span className="ctc-label">Name</span>
              <input
                type="text"
                placeholder="Kasia"
                value={contactInfo.name || ""}
                onChange={onChangeName}
                autoComplete="name"
              />
            </label>

            <label className="ctc-field">
              <span className="ctc-label">Email</span>
              <input
                type="email"
                placeholder="kasia@angels.city"
                value={contactInfo.email || ""}
                onChange={onChangeEmail}
                autoComplete="email"
              />
            </label>
          </div>
        </Draggable>

        {/* CONTENT */}
        <Draggable
          nodeRef={contentNodeRef}
          bounds="parent"
          cancel={DRAG_CANCEL}
          disabled={!canDrag}
          onStart={() => onFocusPanel("content")}
        >
          <div
            ref={contentNodeRef}
            className={`ctc-panel ctc-content ${activeDiv === "content" ? "active" : ""}`}
            onMouseDown={() => onFocusPanel("content")}
            role="group"
          >
            <div className="ctc-panel__hud" aria-hidden="true" />

            <div className="ctc-grab" aria-hidden="true">
              <span className="ctc-grab__hand">✋</span>
              <span className="ctc-grab__txt">grab me</span>
            </div>

            <div className="ctc-panel__header">
              <div className="ctc-kicker">message</div>
              <div className="ctc-headline">Compose</div>
            </div>

            <label className="ctc-field">
              <span className="ctc-label">Subject</span>
              <select onChange={onChangeSubject} value={selectedSubject}>
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="ctc-field ctc-field--textarea">
              <span className="ctc-label">Payload</span>
              <textarea value={message} onChange={onChangeMessage} placeholder="Write your message…" />
            </label>

            <button className="ctc-send" type="button">
              <span className="ctc-send__glow" aria-hidden="true" />
              Send
            </button>
          </div>
        </Draggable>
      </div>
    </div>
  );
}

export default memo(Contact);








//ok
// // src/Components/Contact/Contact.jsx
// import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
// import Draggable from "react-draggable";
// import "./Contact.css";
// import useMountLog from "../../utils/useMountLog";

// const DRAG_CANCEL = "input, textarea, select, button, a";
// const EMPTY_CONTACT = { name: "", email: "" };

// function asArray(v) {
//   return Array.isArray(v) ? v : [];
// }
// function normalizeContact(v) {
//   if (!v) return EMPTY_CONTACT;
//   const name = String(v.name || "").trim();
//   const email = String(v.email || "").trim();
//   return { name, email };
// }
// function hasContactData(v) {
//   return !!(v && (String(v.name || "").trim() || String(v.email || "").trim()));
// }
// function sameContact(a, b) {
//   const A = normalizeContact(a);
//   const B = normalizeContact(b);
//   return A.name === B.name && A.email === B.email;
// }
// function sameSubjects(a, b) {
//   const A = asArray(a);
//   const B = asArray(b);
//   if (A.length !== B.length) return false;
//   for (let i = 0; i < A.length; i++) {
//     if (String(A[i]?.id) !== String(B[i]?.id)) return false;
//     if (String(A[i]?.title) !== String(B[i]?.title)) return false;
//     if (String(A[i]?.message) !== String(B[i]?.message)) return false;
//   }
//   return true;
// }

// const raf = () => new Promise((r) => requestAnimationFrame(r));
// const rafN = async (n = 2) => {
//   for (let i = 0; i < n; i++) await raf();
// };

// function Contact({ initialContactInfo = null, initialSubjects = null }) {
//   useMountLog("Contact");

//   // ✅ MUST be inside component
//   const didFetchRef = useRef(false);
//   const didReadyRef = useRef(false);

//   // ---- initial from props (boot) ----
//   const initialContact = useMemo(
//     () => (hasContactData(initialContactInfo) ? normalizeContact(initialContactInfo) : EMPTY_CONTACT),
//     [initialContactInfo]
//   );
//   const initialSubjs = useMemo(() => asArray(initialSubjects), [initialSubjects]);

//   const [contactInfo, setContactInfo] = useState(() => initialContact);
//   const [subjects, setSubjects] = useState(() => initialSubjs);

//   const [selectedSubject, setSelectedSubject] = useState("");
//   const [message, setMessage] = useState("");
//   const [activeDiv, setActiveDiv] = useState("userInfos");

//   const title = useMemo(() => "CONTACT ME", []);

//   const containerRef = useRef(null);
//   const userNodeRef = useRef(null);
//   const contentNodeRef = useRef(null);

//   // reveal guard
//   const [revealReady, setRevealReady] = useState(() => {
//     if (typeof window === "undefined") return false;
//     return window.__AG_REVEAL_DONE__ === true;
//   });

//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const setReady = () => setRevealReady(true);

//     if (window.__AG_REVEAL_DONE__ === true) {
//       setReady();
//       return;
//     }

//     window.addEventListener("ag:revealDone", setReady, { once: true });
//     return () => window.removeEventListener("ag:revealDone", setReady);
//   }, []);

//   // canDrag only on fine pointer/hover
//   const [canDrag, setCanDrag] = useState(() => {
//     if (typeof window === "undefined") return false;
//     return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
//   });

//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
//     const onChange = () => setCanDrag(!!mql.matches);

//     if (mql.addEventListener) mql.addEventListener("change", onChange);
//     else mql.addListener?.(onChange);

//     return () => {
//       if (mql.removeEventListener) mql.removeEventListener("change", onChange);
//       else mql.removeListener?.(onChange);
//     };
//   }, []);

//   // keep state in sync if props change (dev)
//   useEffect(() => {
//     if (!hasContactData(initialContactInfo)) return;
//     setContactInfo((prev) => (sameContact(prev, initialContactInfo) ? prev : normalizeContact(initialContactInfo)));
//   }, [initialContactInfo]);

//   useEffect(() => {
//     if (!Array.isArray(initialSubjects)) return;
//     setSubjects((prev) => (sameSubjects(prev, initialSubjects) ? prev : asArray(initialSubjects)));
//   }, [initialSubjects]);

//   // Fetch ONLY if missing (once)
//   useEffect(() => {
//     if (didFetchRef.current) return;

//     const alreadyHaveContact = hasContactData(initialContactInfo) || hasContactData(contactInfo);
//     const alreadyHaveSubjects =
//       (Array.isArray(initialSubjects) && initialSubjects.length) ||
//       (Array.isArray(subjects) && subjects.length);

//     if (alreadyHaveContact && alreadyHaveSubjects) return;

//     didFetchRef.current = true; // ✅ lock

//     const ac = new AbortController();

//     (async () => {
//       try {
//         const tasks = [];

//         if (!alreadyHaveContact) {
//           tasks.push(
//             fetch("/messages.json", { signal: ac.signal, cache: "force-cache" })
//               .then((r) => r.json())
//               .then((data) => {
//                 const first = Array.isArray(data) ? data[0] : null;
//                 if (!first) return;
//                 setContactInfo((prev) => (sameContact(prev, first) ? prev : normalizeContact(first)));
//               })
//           );
//         }

//         if (!alreadyHaveSubjects) {
//           tasks.push(
//             fetch("/subjects.json", { signal: ac.signal, cache: "force-cache" })
//               .then((r) => r.json())
//               .then((data) => {
//                 const next = Array.isArray(data) ? data : [];
//                 setSubjects((prev) => (sameSubjects(prev, next) ? prev : next));
//               })
//           );
//         }

//         await Promise.all(tasks);
//       } catch (err) {
//         if (err?.name === "AbortError") return;
//         console.error("Contact fetch error:", err);
//       }
//     })();

//     return () => ac.abort();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // auto-fill message
//   useEffect(() => {
//     if (!selectedSubject) return;
//     const selected = subjects.find((s) => String(s.id) === String(selectedSubject));
//     setMessage(selected?.message || "");
//   }, [selectedSubject, subjects]);

//   // ✅ READY signal (once): when we have enough data + painted
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (didReadyRef.current) return;

//     const hasSomeData = subjects?.length > 0 || hasContactData(contactInfo);
//     if (!hasSomeData) return;
//     if (!containerRef.current) return;

//     didReadyRef.current = true;

//     (async () => {
//       await rafN(2);
//       try {
//         if (!window.__AG_CTC_READY__) {
//           window.__AG_CTC_READY__ = true;
//           window.dispatchEvent(new Event("ag:contactReady"));
//         }
//       } catch {}
//     })();
//   }, [subjects?.length, contactInfo]);

//   const onFocusPanel = useCallback((key) => setActiveDiv(key), []);
//   const onChangeName = useCallback((e) => setContactInfo((p) => ({ ...p, name: e.target.value })), []);
//   const onChangeEmail = useCallback((e) => setContactInfo((p) => ({ ...p, email: e.target.value })), []);
//   const onChangeSubject = useCallback((e) => setSelectedSubject(e.target.value), []);
//   const onChangeMessage = useCallback((e) => setMessage(e.target.value), []);

//   const renderCount = useRef(0);
//   renderCount.current++;
//   if (import.meta.env.DEV) console.log("🔁 Contact render", renderCount.current);

//   return (
//     <div className="ctc-page" data-reveal={revealReady ? "1" : "0"}>
//       <div className="ctc-title">
//         <h2>{title}</h2>
//         <div className="ctc-subline">
//           <span className="ctc-dot" />
//           <span>Promis, je reponds vite!</span>
//           <span className="ctc-dot" />
//         </div>
//       </div>

//       <div className="contact-container" ref={containerRef}>
//         {/* USER INFOS */}
//         <Draggable
//           nodeRef={userNodeRef}
//           bounds="parent"
//           cancel={DRAG_CANCEL}
//           disabled={!canDrag}
//           onStart={() => onFocusPanel("userInfos")}
//         >
//           <div
//             ref={userNodeRef}
//             className={`ctc-panel ctc-user-infos ${activeDiv === "userInfos" ? "active" : ""}`}
//             onMouseDown={() => onFocusPanel("userInfos")}
//             role="group"
//           >
//             <div className="ctc-grab" aria-hidden="true">
//               <span className="ctc-grab__hand">✋</span>
//               <span className="ctc-grab__txt">grab me</span>
//             </div>

//             <div className="ctc-panel__hud" aria-hidden="true" />

//             <div className="ctc-panel__header">
//               <div className="ctc-kicker">identity</div>
//               <div className="ctc-headline">User infos</div>
//             </div>

//             <label className="ctc-field">
//               <span className="ctc-label">Name</span>
//               <input
//                 type="text"
//                 placeholder="Kasia"
//                 value={contactInfo.name || ""}
//                 onChange={onChangeName}
//                 autoComplete="name"
//               />
//             </label>

//             <label className="ctc-field">
//               <span className="ctc-label">Email</span>
//               <input
//                 type="email"
//                 placeholder="kasia@angels.city"
//                 value={contactInfo.email || ""}
//                 onChange={onChangeEmail}
//                 autoComplete="email"
//               />
//             </label>
//           </div>
//         </Draggable>

//         {/* CONTENT */}
//         <Draggable
//           nodeRef={contentNodeRef}
//           bounds="parent"
//           cancel={DRAG_CANCEL}
//           disabled={!canDrag}
//           onStart={() => onFocusPanel("content")}
//         >
//           <div
//             ref={contentNodeRef}
//             className={`ctc-panel ctc-content ${activeDiv === "content" ? "active" : ""}`}
//             onMouseDown={() => onFocusPanel("content")}
//             role="group"
//           >
//             <div className="ctc-panel__hud" aria-hidden="true" />

//             <div className="ctc-grab" aria-hidden="true">
//               <span className="ctc-grab__hand">✋</span>
//               <span className="ctc-grab__txt">grab me</span>
//             </div>

//             <div className="ctc-panel__header">
//               <div className="ctc-kicker">message</div>
//               <div className="ctc-headline">Compose</div>
//             </div>

//             <label className="ctc-field">
//               <span className="ctc-label">Subject</span>
//               <select onChange={onChangeSubject} value={selectedSubject}>
//                 <option value="">Select subject</option>
//                 {subjects.map((subject) => (
//                   <option key={subject.id} value={subject.id}>
//                     {subject.title}
//                   </option>
//                 ))}
//               </select>
//             </label>

//             <label className="ctc-field ctc-field--textarea">
//               <span className="ctc-label">Payload</span>
//               <textarea value={message} onChange={onChangeMessage} placeholder="Write your message…" />
//             </label>

//             <button className="ctc-send" type="button">
//               <span className="ctc-send__glow" aria-hidden="true" />
//               Send
//             </button>
//           </div>
//         </Draggable>
//       </div>
//     </div>
//   );
// }

// export default memo(Contact);
