// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { ThemeProvider } from "./ThemeContext";

import Home from "./Components/Home/Home";
import Skills from "./Components/Skills/Skills";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import LanguageToast from "./Components/Navbar/LanguageToast";
import Portfolio from "./Components/Portfolio/Portfolio";
import ProjectPage from "./Components/Portfolio/ProjectPage/ProjectPage";
import MobileCityPreview from "./Components/Home/HomeCity/MobileCityPreview";
import ScrollToTop from "./utils/ScrollToTop";

/* ----------------------------------
   Dynamic import (DESKTOP ONLY)
-----------------------------------*/
const loadCityComponent = async () => {
  return (await import("./Components/Home/HomeCity/HomeCity")).default;
};

function Layout() {
  // const location = useLocation();
  const location = useLocation();
  const isCity = location.pathname === "/city";

  const [isMobile, setIsMobile] = useState(null);
  const [CityComponent, setCityComponent] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);

  
  /* ----------------------------------
     Detect mobile safely
  -----------------------------------*/
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");

    const onChange = (e) => setIsMobile(e.matches);

    // initial value
    setIsMobile(mq.matches);

    if ("addEventListener" in mq) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    // Safari fallback
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  /* ----------------------------------
     Load CITY only on desktop
  -----------------------------------*/
  useEffect(() => {
    if (location.pathname !== "/city") {
      setCityComponent(null);
      return;
    }

    // wait mobile detection
    if (isMobile === null) return;

    // mobile → NEVER load 3D
    if (isMobile) {
      setCityComponent(null);
      return;
    }

    let alive = true;

    loadCityComponent().then((Comp) => {
      if (alive) setCityComponent(() => Comp);
    });

    return () => {
      alive = false;
    };
  }, [location.pathname, isMobile]);

  /* ----------------------------------
     Listen loader events (3D scene)
  -----------------------------------*/
  useEffect(() => {
    const on = () => setCityLoading(true);
    const off = () => setCityLoading(false);

    window.addEventListener("ag:cityLoaderOn", on);
    window.addEventListener("ag:cityLoaderOff", off);

    return () => {
      window.removeEventListener("ag:cityLoaderOn", on);
      window.removeEventListener("ag:cityLoaderOff", off);
    };
  }, []);

  /* ----------------------------------
     Desktop prewarm (premium feeling)
  -----------------------------------*/
  useEffect(() => {
    if (location.pathname !== "/" || isMobile) return;

    const prewarm = () =>
      import("./Components/Home/HomeCity/HomeCity").catch(() => {});

    const id =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(prewarm)
        : window.setTimeout(prewarm, 800);

    return () => {
      if (typeof id === "number") window.clearTimeout(id);
      else window.cancelIdleCallback?.(id);
    };
  }, [location.pathname, isMobile]);

  const hideFooter = (!isMobile && isCity) || cityLoading;

  /* ----------------------------------
     RENDER
  -----------------------------------*/
  return (
    <>
      <Navbar />
      <LanguageToast />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/city"
          element={
            isMobile
              ? <MobileCityPreview />
              : CityComponent
                ? <CityComponent />
                : <MobileCityPreview />
          }
        />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project/:slug" element={<ProjectPage />} />
        {/* <Route path="/projects" element={<Navigate to="/#projects" replace />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} /> */}
        <Route path="/skills" element={<Skills />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout />
      </Router>
    </ThemeProvider>
  );
}
