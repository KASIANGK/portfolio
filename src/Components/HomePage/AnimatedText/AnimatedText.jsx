import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AnimatedText.css'

const AnimatedText = () => {
  const [hikariVisible, setHikariVisible] = useState(false);
  const [sloganVisible, setSloganVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [slideOut, setSlideOut] = useState(false); 
  const slogan = "Light up your vision"

  // pour animer "Hikari"
  useEffect(() => {
    if (hikariVisible) {
      let opacityInterval = setInterval(() => {
        setOpacity((prevOpacity) => {
          if (prevOpacity < 1) return prevOpacity + 0.01;
          return prevOpacity;
        })
      }, 20);

      return () => clearInterval(opacityInterval);
    }
  }, [hikariVisible]);

  // [our animer "Light up your vision"
  useEffect(() => {
    if (sloganVisible) {
      let index = 0;
      const typingInterval = setInterval(() => {
        setTypedText(() => {
          const nextText = slogan.slice(0, index);
          index += 1;
          if (index > slogan.length) {
            clearInterval(typingInterval);
          }
          return nextText;
        });
      }, 75); 

      return () => clearInterval(typingInterval);
    }
  }, [sloganVisible]);

  // setTimeout pour afficher/cacher les textes
  useEffect(() => {
    setTimeout(() => {
      setHikariVisible(true);
    }, 0);

    setTimeout(() => {
      setSloganVisible(true);
    }, 200);

    setTimeout(() => {
      setHikariVisible(false);
      setSlideOut(true); 
    }, 4500);

    setTimeout(() => {
      setSloganVisible(false);
      setSlideOut(true); 
      setOpacity(0);
      setTypedText('');
    }, 5000);
  }, []);

  return (
    <div className="homepage-text-container">
      <div className={`background-overlay ${hikariVisible || sloganVisible ? 'active' : ''}`}></div>

      <motion.div
        className={`text hikari ${hikariVisible ? 'fade-in pulse' : ''} ${slideOut ? 'slide-out-right' : ''}`}
        style={{
          opacity: opacity,
          textShadow: hikariVisible ? '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.4)' : '',
        }}
        transition={{
          duration: 2.5,
          ease: [0.25, 0.46, 0.45, 0.25], 
          loop: Infinity,
          repeatDelay: 0.5
        }}
      >
        <h1>Hikari</h1>
      </motion.div>
      <motion.div
        className={`text slogan ${sloganVisible ? 'typewriter' : ''} ${slideOut ? 'slide-out-right' : ''}`}
        style={{ opacity: opacity }}
        animate={{
          opacity: sloganVisible ? 1 : 0,
          scale: sloganVisible ? [1, 1.1, 1] : 1,
          // rotate: sloganVisible ? [0, -5, 5, 0] : 0,
          rotate: sloganVisible ? [0, -5, 5, 0, 15] : 0, 
          x: sloganVisible ? [0, 20, -20, 0] : 0,
          y: sloganVisible ? [0, 10, -10, 0] : 0,
          filter: sloganVisible ? ['blur(0px)', 'blur(3px)', 'blur(0px)'] : 'blur(0px)',
          skewX: sloganVisible ? ['0deg', '5deg', '-5deg', '0deg'] : '0deg', 
          skewY: sloganVisible ? ['0deg', '5deg', '-5deg', '0deg'] : '0deg', 
        }}
        transition={{
          duration: 2.5,
          ease: 'easeInOut',
          loop: Infinity,
          repeatDelay: 0.5
        }}
      >
        {typedText}
      </motion.div>

      {/* animation light qui traverse le texte */}
      <motion.div
        className="light-effect"
        animate={{
          x: [0, '100vw'],
        }}
        transition={{
          duration: 4,
          ease: "linear",
          repeat: Infinity,
        }}
      ></motion.div>
    </div>
  );
}

export default AnimatedText;