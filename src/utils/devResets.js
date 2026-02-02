// src/utils/devResets.js

export const DEV_KEYS = {
    ABOUT_HINT_3D: "ag_about_hint_3d_v1",
    CITY_TUTORIAL: "ag_city_tutorial_done_v1",
    // ajoute ici tes autres keys (languages, onboarding, etc.)
  };
  
  export function devResetKey(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  
  export function devResetKeys(keys = []) {
    try {
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
  
  export function devResetAll() {
    try {
      Object.values(DEV_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
  