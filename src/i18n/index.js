// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",

    // ✅ force 2-letter languages
    supportedLngs: ["en", "fr", "nl", "pl"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",

    ns: [
      "common",
      "intro",
      "home",
      "markers",
      "nav",
      "about",
      "portfolio",
      "projects",
      "projects_home",
    ],
    defaultNS: "common",

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "angels_lang",
      caches: ["localStorage"],

      // ✅ ensure detector also stores/returns "fr" not "fr-FR"
      convertDetectedLanguage: (lng) => String(lng || "en").split("-")[0],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;


// avant netlify
// // src/i18n/index.js
// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import LanguageDetector from "i18next-browser-languagedetector";
// import HttpBackend from "i18next-http-backend";

// i18n
//   .use(HttpBackend)
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     fallbackLng: "en",

//     ns: ["common", "intro", "home", "markers", "nav", "about", "portfolio", "projects", "projects_home"],
//     defaultNS: "common",

//     backend: {
//       loadPath: "/locales/{{lng}}/{{ns}}.json",
//     },

//     detection: {
//       order: ["localStorage", "navigator"],
//       lookupLocalStorage: "angels_lang",
//       caches: ["localStorage"],
//     },

//     interpolation: {
//       escapeValue: false,
//     },

//     react: {
//       useSuspense: false,
//     },
//   });

// export default i18n;
