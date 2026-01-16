import React, { createContext, useContext, useState, useEffect } from 'react';
import './App.css'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
    document.body.classList.toggle('dark-mode', !isLightMode);
  }, [isLightMode]);

  const toggleMode = () => {
    setIsLightMode(prevMode => !prevMode);
  }

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext)