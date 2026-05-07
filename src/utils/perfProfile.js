export function applyPerfProfile() {
    const lowPerf =
      navigator.deviceMemory <= 4 ||
      navigator.hardwareConcurrency <= 4;
  
    const touch =
      window.matchMedia("(pointer: coarse)").matches;
  
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
    let profile = "high";
  
    if (lowPerf || touch || reduced) {
      profile = "low";
    }
  
    document.documentElement.dataset.perf = profile;
  }