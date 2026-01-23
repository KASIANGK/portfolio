// src/utils/projectsCache.js

let _projectsPromise = null;
let _projectsData = null;

const _imgCache = new Map(); // url -> Promise<void>

function _preloadOne(url) {
  if (!url) return Promise.resolve();
  if (_imgCache.has(url)) return _imgCache.get(url);

  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";

    const done = async () => {
      // decode = réduit le “pop” au moment d’afficher
      try {
        if (img.decode) await img.decode();
      } catch {
        // decode peut fail sur certains formats/browsers, no-op
      }
      resolve();
    };

    img.onload = done;
    img.onerror = () => resolve(); // ne bloque jamais
    img.src = url;
  });

  _imgCache.set(url, p);
  return p;
}

export function preloadImages(urls = []) {
  const list = Array.from(new Set((urls || []).filter(Boolean)));
  return Promise.all(list.map(_preloadOne));
}

// 1) data cache
export function getProjects() {
  if (_projectsData) return Promise.resolve(_projectsData);
  if (_projectsPromise) return _projectsPromise;

  _projectsPromise = fetch("/projects.json")
    .then((r) => r.json())
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

// 2) picks images
export function pickProjectImages(data, max = 10) {
  const urls = [];
  for (const p of data || []) {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
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

// 3) previeworgans assets
export function warmPreviewAssets() {
  return preloadImages([
    "/preview_city.png",
    "/preview_kasia.jpg",
    "/preview_project_1.png",
    "/preview_project_2.png",
    "/preview_project_3.png",
  ]);
}

// 4) warm projects images
export async function warmProjectImages(max = 12) {
  const data = await getProjects();
  const urls = pickProjectImages(data, max);
  return preloadImages(urls);
}
