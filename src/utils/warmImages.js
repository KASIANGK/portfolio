// src/utils/warmImages.js
import { preloadImagesOnce } from "./projectsCache";

/**
 * Legacy helper:
 * IMPORTANT: delegates to projectsCache so it stays deduped globally.
 */
export async function warmDecodeImages(urls = []) {
  const list = Array.from(new Set((urls || []).filter(Boolean)));
  await preloadImagesOnce(list, { fetchPriority: "high", decoding: "async" });
}
