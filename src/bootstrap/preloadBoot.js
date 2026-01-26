// src/bootstrap/preloadBoot.js
import i18n from "../i18n";
import { preloadImagesOnce } from "../utils/projectsCache";

const ASSETS_PREFIX = "/assets/";

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

/** Essential assets from /essential.json (items: {id, image}) */
function collectEssentialAssets(essentialData) {
  const list = Array.isArray(essentialData) ? essentialData : [];
  return uniq(
    list
      .map((it) => it?.image)
      .filter(Boolean)
      .map((img) => `${ASSETS_PREFIX}${img}`)
  );
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
    const [projects, contactMessages, subjects, essential] = await Promise.all([
      fetchJson("/projects.json"),
      fetchJson("/messages.json"),
      fetchJson("/subjects.json"),
      fetchJson("/essential.json"),
    ]);

    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeSubjects = Array.isArray(subjects) ? subjects : [];
    const safeContactMessages = Array.isArray(contactMessages) ? contactMessages : [];
    const safeEssential = Array.isArray(essential) ? essential : [];

    // 3) images to preload
    const portfolioImages = collectPortfolioImages(safeProjects);
    const essentialAssets = collectEssentialAssets(safeEssential);

    // Stage 1 (blocking) — overlay + first portfolio + ALL essential
    const FIRST_PORTFOLIO_PRELOAD = 18;

    const stage1 = uniq([
      ...HOMEOVERLAY_ASSETS,
      ...portfolioImages.slice(0, FIRST_PORTFOLIO_PRELOAD),
      ...essentialAssets,
    ]);

    // One single preload pipeline (deduped)
    await preloadImagesOnce(stage1, { fetchPriority: "high", decoding: "async" });

    // 4) stash data
    window.__AG_BOOT__ = {
      projects: safeProjects,
      contactInfo: safeContactMessages?.[0] || { name: "", email: "" },
      subjects: safeSubjects,
      essential: safeEssential,
      messages: safeContactMessages,
    };

    window.__AG_BOOT_READY__ = true;
    window.dispatchEvent(new Event("ag:bootReady"));

    // Stage 2 (idle): rest of portfolio only
    runIdle(() => {
      const rest = uniq(portfolioImages.slice(FIRST_PORTFOLIO_PRELOAD));
      preloadImagesOnce(rest).catch(() => {});
    });
  })();

  // update exposed promise now that it's created
  if (typeof window !== "undefined") window.__AG_BOOT_PROMISE__ = _bootPromise;

  return _bootPromise;
}
