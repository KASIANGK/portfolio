// src/Pages/ProjectPage/ProjectPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ProjectPage.css";

const EMPTY = Object.freeze({ web: [], threeD: [], all: [] });

function normalizeImagesObj(images) {
  if (images && typeof images === "object" && !Array.isArray(images)) {
    return {
      laptop: Array.isArray(images.laptop) ? images.laptop.filter(Boolean) : [],
      tablet: Array.isArray(images.tablet) ? images.tablet.filter(Boolean) : [],
      mobile: Array.isArray(images.mobile) ? images.mobile.filter(Boolean) : [],
    };
  }
  if (Array.isArray(images)) {
    const arr = images.filter(Boolean);
    return { laptop: arr, tablet: [], mobile: [] };
  }
  return { laptop: [], tablet: [], mobile: [] };
}

function normalizeProject(p) {
  const images = normalizeImagesObj(p?.images);
  const cover = images.laptop[0] || images.tablet[0] || images.mobile[0] || "";
  const videos = p?.videos || p?.video || null;

  return {
    id: p?.id,
    slug: String(p?.slug || ""),
    title: p?.title || "",
    function: p?.function || "",
    lead: p?.lead || "",
    description: p?.description || "",
    overview: p?.overview || "",
    stack: Array.isArray(p?.stack) ? p.stack : [],
    role: Array.isArray(p?.role) ? p.role : [],
    images,
    cover,
    videos,
    links: {
      demo: p?.links?.demo || p?.link || "",
      repo: p?.links?.repo || p?.repo || "",
    },
  };
}

function flattenBuckets(json) {
  const all = Array.isArray(json?.all) ? json.all : [];
  if (all.length) return all;

  const web = Array.isArray(json?.web) ? json.web : [];
  const threeD = Array.isArray(json?.threeD) ? json.threeD : [];
  return [...web, ...threeD];
}

const unique = (arr) => [...new Set((arr || []).filter(Boolean))];

function isVideoSrc(src = "") {
  const s = String(src).toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm") || s.endsWith(".mov");
}

/**
 * Header visual priority:
 * 1) video
 * 2) images.mobile[0]
 * 3) images.tablet[0]
 * 4) images.laptop[0]
 */
function pickHeaderVisual(project) {
  const v = project?.videos;
  if (typeof v === "string" && v) return v;
  if (Array.isArray(v) && v[0]) return v[0];
  if (v && typeof v === "object") {
    if (v.portrait) return v.portrait;
    if (v.main) return v.main;
    if (v.mobile) return v.mobile;
  }

  const m = project?.images?.mobile?.[0];
  if (m) return m;
  const t = project?.images?.tablet?.[0];
  if (t) return t;
  const l = project?.images?.laptop?.[0];
  if (l) return l;

  return project?.cover || "";
}

function spicyOverview(project) {
  const raw = (project?.overview || project?.description || "").trim();
  if (raw) return raw;

  const title = project?.title || "this project";
  const stack = (project?.stack || []).slice(0, 4).join(" · ");

  return [
    `Built to feel obvious: ${title} — but faster, cleaner, and less noisy.`,
    stack ? `Stack: ${stack}.` : null,
    `Cyber polish + real UX decisions (not just glitter).`,
  ]
    .filter(Boolean)
    .join(" ");
}

function pickDefaultBucket(images) {
  const hasM = images.mobile.length > 0;
  const hasT = images.tablet.length > 0;
  const hasL = images.laptop.length > 0;

  if (hasM && hasT && hasL) return "all";
  if (hasM) return "mobile";
  if (hasT) return "tablet";
  if (hasL) return "laptop";
  return "all";
}

export default function ProjectPage({ jsonUrl }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const base = import.meta.env.BASE_URL || "/";
  const effectiveJsonUrl = jsonUrl || `${base}locales/${lang}/projects_home.json`;

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  // gallery bucket
  const [bucket, setBucket] = useState("all");

  const goBack = () => navigate("/portfolio?filter=all");
  const goHome = () => navigate("/");

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const r = await fetch(effectiveJsonUrl, { cache: "no-store", signal: ac.signal });
        if (!r.ok) throw new Error(`Fetch failed ${r.status} for ${effectiveJsonUrl}`);

        const json = await r.json();
        if (!alive) return;

        setData({
          web: Array.isArray(json?.web) ? json.web : [],
          threeD: Array.isArray(json?.threeD) ? json.threeD : [],
          all: Array.isArray(json?.all) ? json.all : [],
        });
      } catch (e) {
        if (!alive) return;
        if (e?.name === "AbortError") return;
        console.error(e);
        setData(EMPTY);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [effectiveJsonUrl]);

  const project = useMemo(() => {
    const wanted = String(slug || "").trim().toLowerCase();
    const list = flattenBuckets(data).map(normalizeProject);
    return list.find((p) => String(p.slug).trim().toLowerCase() === wanted) || null;
  }, [data, slug]);

  const headerVisual = useMemo(() => (project ? pickHeaderVisual(project) : ""), [project]);
  const headerVisualIsVideo = useMemo(() => isVideoSrc(headerVisual), [headerVisual]);

  const imagesByBucket = useMemo(() => {
    if (!project) return { mobile: [], tablet: [], laptop: [] };
    return {
      mobile: unique(project.images.mobile),
      tablet: unique(project.images.tablet),
      laptop: unique(project.images.laptop),
    };
  }, [project]);

  const canPick = useMemo(
    () => ({
      all: unique([...imagesByBucket.mobile, ...imagesByBucket.tablet, ...imagesByBucket.laptop]).length > 0,
      mobile: imagesByBucket.mobile.length > 0,
      tablet: imagesByBucket.tablet.length > 0,
      laptop: imagesByBucket.laptop.length > 0,
    }),
    [imagesByBucket]
  );

  const currentList = useMemo(() => {
    if (bucket === "all") {
      return unique([...imagesByBucket.mobile, ...imagesByBucket.tablet, ...imagesByBucket.laptop]);
    }
    const list = imagesByBucket?.[bucket] || [];
    if (list.length) return list;

    // fallback safety
    const all = unique([...imagesByBucket.mobile, ...imagesByBucket.tablet, ...imagesByBucket.laptop]);
    return all;
  }, [imagesByBucket, bucket]);

  useEffect(() => {
    if (!project) return;
    setBucket(pickDefaultBucket(project.images));
  }, [project]);

  const setBucketSafe = useCallback((b) => setBucket(b), []);

  const overviewText = project ? spicyOverview(project) : "";

  if (loading) {
    return (
      <main className="ppage">
        <button className="ppage__homeFab" onClick={goHome} aria-label="Home">
            <span aria-hidden="true">⌂</span>
        </button>
        <div className="ppage__shell">
          <header className="ppage__header">
            <div className="ppage__backRow">
              <button className="ppage__back" onClick={goBack}>
                ← Back
              </button>
            </div>
            <div className="ppage__headerGrid">
              <div className="ppage__info">
                <div className="ppage__kicker">Loading</div>
                <h1 className="ppage__title">Project</h1>
                <p className="ppage__lead">Preparing the page…</p>
                <div className="ppage__overview">
                  <h2 className="ppage__h2">Overview</h2>
                  <p className="ppage__p ppage__muted">Loading content…</p>
                </div>
              </div>
              <div className="ppage__visualPanel">
                <div className="ppage__visualFrame" />
              </div>
            </div>

          </header>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="ppage">
        <div className="ppage__shell">
          <header className="ppage__header">
            <div className="ppage__backRow">
              <button className="ppage__back" onClick={goBack}>
                ← Back
              </button>
            </div>
            <div className="ppage__headerGrid">
              <div className="ppage__info">
                <div className="ppage__kicker">Not found</div>
                <h1 className="ppage__title">Unknown project</h1>
                <p className="ppage__lead">Slug “{slug}” doesn’t match {effectiveJsonUrl}.</p>
              </div>
              <div className="ppage__visualPanel">
                <div className="ppage__visualFrame" />
              </div>
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="ppage">
      <div className="ppage__shell">
        {/* HEADER */}
        <header className="ppage__header">
          <div className="ppage__backRow">
            <button className="ppage__back" onClick={goBack}>
              ← Back
            </button>
          </div>

          <div className="ppage__headerGrid">
            <div className="ppage__info">
              <div className="ppage__kicker">{project.function}</div>
              <h1 className="ppage__title">{project.title}</h1>
              {project.lead ? <p className="ppage__lead">{project.lead}</p> : null}

              <div className="ppage__overview">
                <h2 className="ppage__h2">Overview</h2>
                <p className="ppage__p">{overviewText}</p>
              </div>
            </div>

            <div className="ppage__visualPanel">
              <div className="ppage__visualFrame" aria-label="Project visual">
                {headerVisual ? (
                  headerVisualIsVideo ? (
                    <video
                      className="ppage__visualMedia"
                      src={headerVisual}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      className="ppage__visualMedia"
                      src={headerVisual}
                      alt={`${project.title} visual`}
                      loading="eager"
                      decoding="async"
                    />
                  )
                ) : (
                  <div className="ppage__visualFallback" aria-hidden="true" />
                )}
                <div className="ppage__visualFx" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* home button bottom-left */}
        </header>

        {/* BODY */}
        <section className="ppage__body">
          {/* Images (left) */}
          <article className="ppage__card ppage__card--images">
            <div className="ppage__imagesTop">
              <h2 className="ppage__h2">Images</h2>

              <div className="ppage__imagesControls">
                <div className="ppage__tabs" role="tablist" aria-label="Screens by device">
                  {canPick.all && (
                    <button
                      type="button"
                      className={`ppage__tab ${bucket === "all" ? "isActive" : ""}`}
                      onClick={() => setBucketSafe("all")}
                      role="tab"
                      aria-selected={bucket === "all"}
                    >
                      All
                    </button>
                  )}
                  {canPick.mobile && (
                    <button
                      type="button"
                      className={`ppage__tab ${bucket === "mobile" ? "isActive" : ""}`}
                      onClick={() => setBucketSafe("mobile")}
                      role="tab"
                      aria-selected={bucket === "mobile"}
                    >
                      Mobile
                    </button>
                  )}
                  {canPick.tablet && (
                    <button
                      type="button"
                      className={`ppage__tab ${bucket === "tablet" ? "isActive" : ""}`}
                      onClick={() => setBucketSafe("tablet")}
                      role="tab"
                      aria-selected={bucket === "tablet"}
                    >
                      Tablet
                    </button>
                  )}
                  {canPick.laptop && (
                    <button
                      type="button"
                      className={`ppage__tab ${bucket === "laptop" ? "isActive" : ""}`}
                      onClick={() => setBucketSafe("laptop")}
                      role="tab"
                      aria-selected={bucket === "laptop"}
                    >
                      Laptop
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ strip scrollable tight (height max 300) */}
            <div className="ppage__strip" aria-label="Screens strip">
              {currentList.map((src, i) => (
                <figure className="ppage__stripItem" key={`${src}_${i}`}>
                  <img src={src} alt={`${project.title} ${bucket} ${i + 1}`} loading="lazy" decoding="async" />
                </figure>
              ))}
            </div>
          </article>

          {/* Stack + Role (right) */}
          <aside className="ppage__side">
            <article className="ppage__card ppage__card--side">
              <h2 className="ppage__h2">Stack</h2>
              <div className="ppage__chips">
                {project.stack.map((s) => (
                  <span className="ppage__chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </article>

            <article className="ppage__card ppage__card--side">
              <h2 className="ppage__h2">Role</h2>
              <ul className="ppage__list">
                {project.role.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
