// src/bootstrap/preloadBoot.js
import i18n from "../i18n";
import { preloadImagesOnce } from "../utils/projectsCache";

const ASSETS_PREFIX = "/assets/";
// productcache.js (ou preloadAssets.js)

export const ABOUT_PRELOAD = [
  "/projects.json",
  "/cv.pdf",

  // i18n (exemples)
  "/i18n/fr.json",
  "/i18n/en.json",

  // thumbs / assets
  "/preview_city.png",
  "/preview_kasia.jpg",
];

export const PROJECTS_PRELOAD = [
  "/projects.json",
  "/preview_city.png",
  "/home_bg.jpg",
];

export const HOMEOVERLAY_ASSETS = [
  "/home_bg.jpg",
  "/home_bg_step2.jpg",
  "/preview_city.png",
  "/preview_kasia.jpg",
  "/preview_project_1.png",
  "/preview_project_2.png",
  "/preview_project_3.png",
];

function runIdle(fn) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) return window.requestIdleCallback(fn, { timeout: 1500 });
  return window.setTimeout(fn, 450);
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function getJsonCacheMode() {
  try {
    return import.meta?.env?.DEV ? "no-store" : "force-cache";
  } catch {
    return "force-cache";
  }
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: getJsonCacheMode() });
  if (!r.ok) throw new Error(`Fetch failed: ${url} (${r.status})`);
  return r.json();
}

/** Collect portfolio images (cover + 2 next) */
function collectPortfolioImages(projects) {
  const urls = [];
  (projects || []).forEach((p) => {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const cover = p.cover || imgs[0];
    const slides = [...(cover ? [cover] : []), ...imgs.filter((u) => u !== cover)];
    slides.slice(0, 3).forEach((u) => urls.push(u));
  });
  return uniq(urls);
}

function collectHomeProjectsImages(buckets) {
  if (Array.isArray(buckets)) return collectPortfolioImages(buckets);
  if (!buckets || typeof buckets !== "object") return [];

  const flat = []
    .concat(
      Array.isArray(buckets.all) ? buckets.all : [],
      Array.isArray(buckets.web) ? buckets.web : [],
      Array.isArray(buckets.threeD) ? buckets.threeD : [],
      Array.isArray(buckets.events) ? buckets.events : []
    );

  return collectPortfolioImages(flat);
}


let _bootPromise = null;

export function preloadBootOnce() {
  if (_bootPromise) return _bootPromise;

  _bootPromise = (async () => {
    // Expose for DEV / other modules
    if (typeof window !== "undefined") window.__AG_BOOT_PROMISE__ = _bootPromise;

    // 1) i18n blocking
    await i18n.loadNamespaces(["intro", "nav", "about", "portfolio", "home"]);
    await i18n.loadLanguages(["en", "fr", "pl", "nl"]);

    // 2) JSON blocking
    const [projects, projectsHome, contactMessages, subjects] = await Promise.all([
      fetchJson("/projects.json"),
      fetchJson("/projects_home.json"),
      fetchJson("/messages.json"),
      fetchJson("/subjects.json"),
    ]);
    
    const safeProjectsHome =
    projectsHome && typeof projectsHome === "object"
      ? {
          web: Array.isArray(projectsHome.web) ? projectsHome.web : [],
          threeD: Array.isArray(projectsHome.threeD) ? projectsHome.threeD : [],
          events: Array.isArray(projectsHome.events) ? projectsHome.events : [],
          all: Array.isArray(projectsHome.all) ? projectsHome.all : [],
        }
      : { web: [], threeD: [], events: [], all: [] };
  
    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeSubjects = Array.isArray(subjects) ? subjects : [];
    const safeContactMessages = Array.isArray(contactMessages) ? contactMessages : [];

    // 3) images to preload
    const portfolioImages = collectPortfolioImages(safeProjects);
    const homeProjectsImages = collectHomeProjectsImages(safeProjectsHome);

    // Stage 1 (blocking) — overlay + first portfolio + ALL essential
    const FIRST_PORTFOLIO_PRELOAD = 18;

    const stage1 = uniq([
      ...HOMEOVERLAY_ASSETS,
      ...homeProjectsImages.slice(0, 14),
      ...portfolioImages.slice(0, FIRST_PORTFOLIO_PRELOAD),
      "/assets/about_web.jpg",
      "/assets/about_3d.jpg",
      "/assets/about_angels.jpg",
      "/assets/about_all.jpg",
    ]);

    // One single preload pipeline (deduped)
    await preloadImagesOnce(stage1, { fetchPriority: "high", decoding: "async" });
    try {
      window.__AG_ABOUT_READY__ = true;
      window.dispatchEvent(new Event("ag:aboutReady"));

    } catch {}
    try {
      window.__AG_CTC_READY__ = true;
      window.dispatchEvent(new Event("ag:contactReady"));
    } catch {}
    try {
      window.__AG_PRJ_READY__ = true;
      window.dispatchEvent(new Event("ag:projectsReady"));
    } catch {}


    
    // 4) stash data
    window.__AG_BOOT__ = {
      projectsHome: safeProjectsHome,

      projects: safeProjects,
      contactInfo: safeContactMessages?.[0] || { name: "", email: "" },
      subjects: safeSubjects,
      messages: safeContactMessages,
    };

    window.__AG_BOOT_READY__ = true;
    window.dispatchEvent(new Event("ag:bootReady"));

    // Stage 2 (idle): rest of portfolio only
    runIdle(() => {
      const rest = uniq([    
        ...homeProjectsImages.slice(14),
        ...portfolioImages.slice(FIRST_PORTFOLIO_PRELOAD)]);
      preloadImagesOnce(rest).catch(() => {});
    });
  })();

  // update exposed promise now that it's created
  if (typeof window !== "undefined") window.__AG_BOOT_PROMISE__ = _bootPromise;

  return _bootPromise;
}
