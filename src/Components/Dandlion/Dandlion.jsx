import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Dandelion = () => {
  const location = useLocation();

if (location.pathname === '/' || location.pathname === '/about' || location.pathname === '/portfolio') {
  return null;
}


  // crea particules
  useEffect(() => {
    const createDandelions = (e) => {
      const target = e.target
      const rect = target.getBoundingClientRect(); // pour obtenir la position et les dimensions d'un element dans le viewport

      // verif proximite de la mouse par rapport a l'element cible
      const mouseX = e.clientX
      const mouseY = e.clientY
      const proximity = 15

      // pour eviter dandlion sur une className
      const hasClass = (element, className) => {
        while (element) {
          if (element.classList && element.classList.contains(className)) {
            return true;
          }
          element = element.parentElement;
        }
        return false;
      };

      if (
        (mouseX > rect.left - proximity && mouseX < rect.right + proximity) &&
        (mouseY > rect.top - proximity && mouseY < rect.bottom + proximity) &&
        (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'UL' ||
        target.tagName === 'LI' ||
        hasClass(target, 'social-icons-navbar'))
      ) {
        return;
      }

      for (let i = 0; i < 5; i++) { 
        const particle = document.createElement('div')
        particle.classList.add('particle')

        // position random autour de la mouse
        const offsetX = (Math.random() - 0.5) * 20
        const offsetY = (Math.random() - 0.5) * 20

        particle.style.left = `${e.clientX + offsetX}px`
        particle.style.top = `${e.clientY + offsetY}px`

        // styles
        particle.style.position = 'absolute'
        particle.style.width = `${Math.random() * 10 + 5}px`
        particle.style.height = `${Math.random() * 10 + 5}px`
        particle.style.backgroundColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`
        particle.style.borderRadius = `${Math.random() < 0.5 ? '50%' : '0%'}`
        particle.style.zIndex = '9999'
        particle.style.pointerEvents = 'none'
        particle.style.transition = 'transform 1s ease-out, opacity 1s ease-out'
        particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px) scale(${Math.random() + 0.5})`

        document.body.appendChild(particle)

        setTimeout(() => {
          particle.style.opacity = '0'; // fade out
          particle.style.transform += ' scale(0)'
        }, 50);

        setTimeout(() => {
          particle.remove()
        }, 1000); 
      }
    }

    document.addEventListener('mousemove', createDandelions)

    return () => {
      document.removeEventListener('mousemove', createDandelions)
    }
  }, [])

  return <div className="dandelion-container"></div>
}

export default Dandelion
