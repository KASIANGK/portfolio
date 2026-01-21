import React, { useEffect, useMemo, useRef, useState } from "react";
import Draggable from "react-draggable";
import "./Contact.css";

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({ name: "", email: "" });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [message, setMessage] = useState("");
  const [activeDiv, setActiveDiv] = useState("userInfos");

  const title = useMemo(() => "CONTACT ME", []);

  const containerRef = useRef(null);

  // ✅ IMPORTANT: nodeRefs (sinon react-draggable tente findDOMNode)
  const userNodeRef = useRef(null);
  const contentNodeRef = useRef(null);

  // ✅ drag uniquement desktop/laptop (pas mobile)
  const canDrag =
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;

  useEffect(() => {
    const fetchContact = fetch("/messages.json").then((r) => r.json());
    const fetchSubjects = fetch("/subjects.json").then((r) => r.json());

    Promise.all([fetchContact, fetchSubjects])
      .then(([contactData, subjectsData]) => {
        setContactInfo(contactData?.[0] || { name: "", email: "" });
        setSubjects(subjectsData || []);
      })
      .catch((err) => console.error("Error:", err));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const selectedMessage = subjects.find(
      (s) => String(s.id) === String(selectedSubject)
    )?.message;
    setMessage(selectedMessage || "");
  }, [selectedSubject, subjects]);

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
          handle=".ctc-panel__header"
          disabled={!canDrag}
          onStart={() => setActiveDiv("userInfos")}
        >
          <div
            ref={userNodeRef}
            className={`ctc-panel ctc-user-infos ${
              activeDiv === "userInfos" ? "active" : ""
            }`}
            onMouseDown={() => setActiveDiv("userInfos")}
            onClick={() => setActiveDiv("userInfos")}
            role="button"
            tabIndex={0}
          >
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
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, name: e.target.value })
                }
              />
            </label>

            <label className="ctc-field">
              <span className="ctc-label">Email</span>
              <input
                type="email"
                placeholder="kasia@angels.city"
                value={contactInfo.email || ""}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, email: e.target.value })
                }
              />
            </label>

            <div className="ctc-hint">Click this panel to bring it to front.</div>
          </div>
        </Draggable>

        {/* CONTENT */}
        <Draggable
          nodeRef={contentNodeRef}
          bounds="parent"
          handle=".ctc-panel__header"
          disabled={!canDrag}
          onStart={() => setActiveDiv("content")}
        >
          <div
            ref={contentNodeRef}
            className={`ctc-panel ctc-content ${
              activeDiv === "content" ? "active" : ""
            }`}
            onMouseDown={() => setActiveDiv("content")}
            onClick={() => setActiveDiv("content")}
            role="button"
            tabIndex={0}
          >
            <div className="ctc-panel__hud" aria-hidden="true" />

            <div className="ctc-panel__header">
              <div className="ctc-kicker">message</div>
              <div className="ctc-headline">Compose</div>
            </div>

            <label className="ctc-field">
              <span className="ctc-label">Subject</span>
              <select
                onChange={(e) => setSelectedSubject(e.target.value)}
                value={selectedSubject}
              >
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
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message…"
              />
            </label>

            <button className="ctc-send" type="button">
              <span className="ctc-send__glow" aria-hidden="true" />
              Send
            </button>

            <div className="ctc-hint">Click this panel to bring it to front.</div>
          </div>
        </Draggable>
      </div>
    </div>
  );
};

export default Contact;
