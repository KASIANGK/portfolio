// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { ThemeProvider } from "./ThemeContext";

import Home from "./Components/Home/Home";
import HomeCity from "./Components/Home/HomeCity/HomeCity";
import Skills from "./Components/Skills/Skills";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import LanguageToast from "./Components/Navbar/LanguageToast";
import Portfolio from "./Components/Portfolio/Portfolio";
import ProjectPage from "./Components/Portfolio/ProjectPage/ProjectPage";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isCity = location.pathname === "/city";

  return (
    <>
      <Navbar />
      <LanguageToast />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/city" element={<HomeCity />} />
        <Route path="/projects" element={<Navigate to="/#projects" replace />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project/:slug" element={<ProjectPage />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />

        <Route path="/skills" element={<Skills />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
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
