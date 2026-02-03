import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== "undefined"
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = () => setMatches(media.matches);

    // initial sync
    handler();

    if (media.addEventListener) {
      media.addEventListener("change", handler);
    } else {
      media.addListener(handler); // Safari old
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}
