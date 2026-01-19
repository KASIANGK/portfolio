import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaPhoneAlt, FaInstagram, FaTwitter } from 'react-icons/fa'; 
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // pour ouvrir/fermer  menu
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // pour fermer menu si click qque part sur la page
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div className="navbar-container" ref={menuRef}>
        {/* <img src='/assets/webdev.png' className="logo-image" alt='logo'/> */}
        <div className="hamburger" onClick={toggleMenu}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
        </div>

        <div className={`menu ${isOpen ? 'open' : ''}`}>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/essential">Essential</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Ctc</a></li>
                <li><a href="/skills">Skills</a></li>
                <li><a href="/portfolio">Portfolio</a></li>
            </ul>
            <div className="social-icons-navbar">
                <a href="mailto:hikari-web-agency@gmail.com"><FaEnvelope size={24} /></a>
                <a href="tel:123456789"><FaPhoneAlt size={24} /></a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram size={24} /></a>
                <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter size={24} /></a>
            </div>
        </div>
    </div>
  )
}

export default Navbar

