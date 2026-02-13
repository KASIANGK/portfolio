// src/Components/Contact/Contact.jsx
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Contact.css";
import useMountLog from "../../utils/useMountLog";

const EMAIL_PUBLIC = "ngk.kasia@gmail.com";
const PHONE_PUBLIC = "0472845612";

// Subjects (clean + pro)
const SUBJECTS = [
  { id: "3d-animation", label: "3D Animation" },
  { id: "3d-modeling", label: "3D Modeling" },
  { id: "web-app", label: "Web / App" },
  { id: "visual", label: "Visual / Creative" },
  { id: "support", label: "Support / Help" },
  { id: "collab", label: "Collaboration" },
  { id: "work", label: "Work Opportunity" },
  { id: "other", label: "Other" },
];

const SOCIALS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/angels_gang_style/",
    Icon: IconInstagram,
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@kiss_my_fire",
    Icon: IconTikTok,
  },
  // ✅ GitHub supprimé
  {
    id: "linkedin",
    label: "LinkedIn",
    // 🔁 Remplace par TON URL exacte si besoin
    href: "https://www.linkedin.com/in/kasia-nagorka/",
    Icon: IconLinkedIn,
  },
];

const raf = () => new Promise((r) => requestAnimationFrame(r));
const rafN = async (n = 2) => {
  for (let i = 0; i < n; i++) await raf();
};

// =======================
// Inline SVG icons (always render)
// =======================
function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.6 6.8a.9.9 0 1 1-.9-.9.9.9 0 0 1 .9.9Z"
      />
    </svg>
  );
}

function IconTikTok(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16.5 2h-2.8v12.2a3.2 3.2 0 1 1-2.7-3.2V8.2a6 6 0 1 0 5.5 6V8.8c1.1 1 2.6 1.6 4.2 1.6V7.7c-1.7 0-3.2-.7-4.2-1.8-.7-.8-1.1-2-1.1-3.3Z"
      />
    </svg>
  );
}

function IconLinkedIn(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6.94 6.5A2.19 2.19 0 1 1 7 2.12a2.19 2.19 0 0 1-.06 4.38ZM5.5 21.5h3V9h-3v12.5ZM10.5 9h2.88v1.71h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v7.75h-3v-6.88c0-1.64-.03-3.74-2.28-3.74-2.28 0-2.63 1.78-2.63 3.62v7h-3V9Z"
      />
    </svg>
  );
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
      />
    </svg>
  );
}

function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6.6 10.8c1.5 3 3.9 5.4 6.9 6.9l2.3-2.3c.3-.3.8-.4 1.2-.3 1.3.4 2.7.6 4.1.6.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C10.4 21.2 2.8 13.6 2.8 4.9c0-.7.5-1.2 1.2-1.2H6c.7 0 1.2.5 1.2 1.2 0 1.4.2 2.8.6 4.1.1.4 0 .9-.3 1.2l-2.9 2.6Z"
      />
    </svg>
  );
}

function Contact() {
  useMountLog("Contact");

  const didReadyRef = useRef(false);

  const [first, setFirst] = useState("Kasia");
  const [last, setLast] = useState("Nagorka");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]?.id || "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const subjectLabel = useMemo(
    () => SUBJECTS.find((s) => s.id === subject)?.label || "Contact",
    [subject]
  );

  // READY event (same ecosystem as other sections)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didReadyRef.current) return;
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
  }, []);

  const onCopy = useCallback(async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {}
  }, []);

  // ✅ No backend: mailto with clean body
  const onSend = useCallback(
    (e) => {
      e?.preventDefault?.();

      const fullName = `${String(first || "").trim()} ${String(last || "").trim()}`.trim() || "—";

      const body = [
        `From: ${fullName}`,
        email ? `Reply-to: ${email}` : "",
        `Subject: ${subjectLabel}`,
        "",
        String(message || ""),
        "",
        "—",
        "Sent from Kasia's portfolio",
      ]
        .filter(Boolean)
        .join("\n");

      const mailto = `mailto:${EMAIL_PUBLIC}?subject=${encodeURIComponent(
        `[${subjectLabel}] Contact form`
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
      setSent(true);
      setTimeout(() => setSent(false), 2400);
    },
    [first, last, email, subjectLabel, message]
  );

  return (
    <section className="ctc2" aria-label="Contact">
      <div className="ctc2__wrap">
        {/* BIG TITLE */}
        <header className="ctc2__hero">
          <h2 className="ctc2__big">LET'S BUILD SOMETHING THAT MATTERS</h2>
        </header>

        <div className="ctc2__grid">
          {/* LEFT INFO */}
          <aside className="ctc2__left" aria-label="Contact info">
            <div className="ctc2__leftBlock">
              <div className="ctc2__name">Kasia Nagorka</div>

              <button className="ctc2__link" type="button" onClick={() => onCopy(PHONE_PUBLIC)}>
                {PHONE_PUBLIC}
              </button>

              <button className="ctc2__link" type="button" onClick={() => onCopy(EMAIL_PUBLIC)}>
                {EMAIL_PUBLIC}
              </button>

              <div className="ctc2__icons" aria-label="Social links">
                <a className="ctc2__iconBtn" href={`mailto:${EMAIL_PUBLIC}`} aria-label="Email">
                  <IconMail className="ctc2__iconSvg" />
                </a>

                {/* ✅ tel: format international (affichage inchangé) */}
                <a className="ctc2__iconBtn" href="tel:+32472845612" aria-label="Phone">
                  <IconPhone className="ctc2__iconSvg" />
                </a>

                {SOCIALS.map(({ id, label, href, Icon }) => (
                  <a
                    key={id}
                    className="ctc2__iconBtn"
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (href === "#") e.preventDefault();
                    }}
                  >
                    <Icon className="ctc2__iconSvg" />
                  </a>
                ))}
              </div>

              <div className="ctc2__hint">Tip: click phone/email to copy.</div>
            </div>
          </aside>

          {/* RIGHT FORM */}
          <div className="ctc2__right" aria-label="Contact form">
            <form
              className="ctc2__form"
              onSubmit={onSend}
              onKeyDownCapture={(e) => e.stopPropagation()}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onMouseDownCapture={(e) => e.stopPropagation()}
            >
              <div className="ctc2__row2">
                <label className="ctc2__field">
                  <span className="ctc2__label">FIRST NAME</span>
                  <input
                    className="ctc2__input"
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                    placeholder="Your first name"
                    autoComplete="given-name"
                  />
                </label>

                <label className="ctc2__field">
                  <span className="ctc2__label">LAST NAME</span>
                  <input
                    className="ctc2__input"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                    placeholder="Your last name"
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <label className="ctc2__field ctc2__fieldFull">
                <span className="ctc2__label">EMAIL</span>
                <input
                  className="ctc2__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </label>

              <label className="ctc2__field ctc2__fieldFull">
                <span className="ctc2__label">SUBJECT</span>
                <select
                  className="ctc2__select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ctc2__field ctc2__fieldFull">
                <span className="ctc2__label">MESSAGE</span>
                <textarea
                  className="ctc2__textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell me what you want to build…"
                />
              </label>

              <div className="ctc2__actions">
                <button className="aboutX__btn" type="submit">
                  {sent ? "SENT ✓" : "SEND"}
                </button>

                <button className="aboutX__btn isGhost" type="button" onClick={() => setMessage("")}>
                  CLEAR
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Contact);
