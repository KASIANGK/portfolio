import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";

import HomeCity from "./Components/HomeCity/HomeCity";
import About from "./Components/About/About";
import Essential from "./Components/Essential/Essential";
import Navbar from "./Components/Navbar/Navbar";
import Skills from "./Components/Skills/Skills";
import Contact from "./Components/Contact/Contact";
import Dandelion from "./Components/Dandlion/Dandlion";
import Footer from "./Components/Footer/Footer";
import Portfolio from "./Components/Portfolio/Portfolio";
import LanguageToast from "./Components/Navbar/LanguageToast";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      <Navbar />
      <LanguageToast /> 

      {/* ✅ Hide custom cursor on Home (FPS/pointerlock page) */}
      {!isHome && <Dandelion />}

      <Routes>
        <Route path="/" element={<HomeCity />} />
        <Route path="/essential" element={<Essential />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <Footer />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
