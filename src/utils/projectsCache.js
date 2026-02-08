// src/utils/projectsCache.js
let _projectsPromise = null;
let _projectsData = null;

// url -> Promise<void> (dedupe global)
const _imgCache = new Map();
export function normalizeImagesToArray(images) {
  if (Array.isArray(images)) return images.filter(Boolean);

  if (images && typeof images === "object" && !Array.isArray(images)) {
    const laptop = Array.isArray(images.laptop) ? images.laptop : [];
    if (laptop.length) return laptop.filter(Boolean);

    const tablet = Array.isArray(images.tablet) ? images.tablet : [];
    if (tablet.length) return tablet.filter(Boolean);

    const mobile = Array.isArray(images.mobile) ? images.mobile : [];
    return mobile.filter(Boolean);
  }

  return [];
}

/**
 * Internal: preload + decode a single image once (cached).
 * Resolves even on error (never blocks the app).
 */
function _preloadOne(url, opts = {}) {
  if (!url) return Promise.resolve();
  if (_imgCache.has(url)) return _imgCache.get(url);

  const p = new Promise((resolve) => {
    const img = new Image();

    // hints only
    img.decoding = opts.decoding || "async";

    // NOTE: fetchPriority exists on HTMLImageElement (camelCase)
    // Some browsers may ignore it, but it's safe.
    if (opts.fetchPriority) {
      try {
        img.fetchPriority = opts.fetchPriority; // "high" | "low" | "auto"
      } catch {}
    }

    const done = () => resolve();

    img.onload = () => {
      if (img.decode) img.decode().then(done).catch(done);
      else done();
    };

    img.onerror = done; // never block
    img.src = url;
  });

  _imgCache.set(url, p);
  return p;
}

/** Public: await when an image URL has been preloaded/decoded (once). */
export function whenImageReady(url) {
  return _preloadOne(url);
}

/** Public: preload a list of images once (deduped). */
export function preloadImagesOnce(urls = [], opts = {}) {
  const list = Array.from(new Set((urls || []).filter(Boolean)));
  return Promise.all(list.map((u) => _preloadOne(u, opts)));
}

/* --------------------------
   1) Data cache: projects.json
-------------------------- */

function getJsonCacheMode() {
  try {
    return import.meta?.env?.DEV ? "no-store" : "force-cache";
  } catch {
    return "force-cache";
  }
}

export function getProjects() {
  if (_projectsData) return Promise.resolve(_projectsData);
  if (_projectsPromise) return _projectsPromise;

  _projectsPromise = fetch("/projects.json", { cache: getJsonCacheMode() })
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      _projectsData = Array.isArray(data) ? data : [];
      return _projectsData;
    })
    .catch(() => {
      _projectsData = [];
      return _projectsData;
    });

  return _projectsPromise;
}

/* --------------------------
   2) Pick images from projects data
-------------------------- */

export function pickProjectImages(data, max = 10) {
  const urls = [];

  for (const p of data || []) {
    const imgs = normalizeImagesToArray(p.images);
    const cover = p.cover || imgs[0];

    if (cover) urls.push(cover);

    for (const u of imgs) {
      if (u && u !== cover) urls.push(u);
      if (urls.length >= max) break;
    }
    if (urls.length >= max) break;
  }

  return urls.slice(0, max);
}


/* --------------------------
   3) Preview organs assets
-------------------------- */

export function warmPreviewAssets() {
  return preloadImagesOnce(
    [
      "/preview_city.png",
      "/preview_kasia.jpg",
      "/preview_project_1.png",
      "/preview_project_2.png",
      "/preview_project_3.png",
    ],
    { fetchPriority: "high" }
  );
}

/* --------------------------
   4) Warm some project images
-------------------------- */

export async function warmProjectImages(max = 12) {
  const data = await getProjects();
  const urls = pickProjectImages(data, max);
  return preloadImagesOnce(urls);
}
