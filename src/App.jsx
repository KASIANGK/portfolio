import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";

import HomeCity from "./Components/HomeCity/HomeCity";
import About from "./Components/About/About";
import Essential from "./Components/Essential/Essential";
import Navbar from "./Components/Navbar/Navbar";
import Skills from "./Components/Skills/Skills";
import Contact from "./Components/Contact/Contact";
// import AnimatedText from "./Components/HomePage/AnimatedText/AnimatedText";
import Dandelion from "./Components/Dandlion/Dandlion";
import Footer from "./Components/Footer/Footer";
import Portfolio from "./Components/Portfolio/Portfolio";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      <Navbar />
      {/* ✅ Hide custom cursor on Home (FPS/pointerlock page) */}
      {!isHome && <Dandelion />}

      <Routes>
        <Route path="/" element={<HomeCity />} />
        <Route path="/essential" element={<Essential />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/contact" element={<Contact />} />
        {/* <Route path="/animated-txt" element={<AnimatedText />} /> */}
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







//ok
// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ThemeProvider } from './ThemeContext'; 
// import HomeCity from "./Components/HomeCity/HomeCity";
// import About from './Components/About/About';
// import Expertise from './Components/Expertise/Expertise';
// import Navbar from './Components/Navbar/Navbar';
// import Members from './Components/Members/Members';
// import Contact from './Components/Contact/Contact';
// import AnimatedText from './Components/HomePage/AnimatedText/AnimatedText';
// import Dandelion from './Components/Dandlion/Dandlion';
// import Footer from './Components/Footer/Footer';
// import Portfolio from './Components/Portfolio/Portfolio';


// function App() {
//   return (
//     <ThemeProvider>
//       <Router>
//           <Navbar />
//           <Dandelion/>
//           <Routes>
//             <Route path="/" element={<HomeCity  />} />
//             <Route path="/expertise" element={<Expertise  />} />
//             <Route path="/members" element={<Members  />} />
//             <Route path="/about" element={<About  />} />
//             <Route path="/portfolio" element={<Portfolio  />} />
//             <Route path="/contact" element={<Contact  />} />
//             <Route path="/animated-txt" element={<AnimatedText  />} />

//           </Routes>
//           <Footer/>
//       </Router>
//     </ThemeProvider>
//   );
// }

// export default App;