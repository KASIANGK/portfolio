// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";

import Home from "./Components/Home/Home";
import HomeCity from "./Components/Home/HomeCity/HomeCity";
import Skills from "./Components/Skills/Skills";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import LanguageToast from "./Components/Navbar/LanguageToast";
import Dandelion from "./Components/Dandlion/Dandlion";
import About from "./Components/About";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isCity = location.pathname === "/city";

  return (
    <>
      <Navbar />
      <LanguageToast />

      {/* cursor custom uniquement hors Home/City */}
      {!isHome && !isCity && <Dandelion />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/city" element={<HomeCity />} />

        {/* routes “alias” */}
        <Route path="/essential" element={<Navigate to="/#essential" replace />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/portfolio" element={<Navigate to="/#projects" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
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
