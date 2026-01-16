import React, { useEffect, useState } from 'react';
import './Portfolio.css';
import gsap from 'gsap';

const Portfolio = () => {
  const [projects, setProjects] = useState([]) 
  const [hovered, setHovered] = useState(null) 
  const [lastScrollPosition, setLastScrollPosition] = useState({}) // stocker la derniere position du slide 


  useEffect(() => {
    fetch('/projects.json')
      .then(response => response.json()) 
      .then(projectsData => {
        setProjects(projectsData); 
      })
      .catch(error => console.error("Error:", error)); 
  }, []); 

  // fonction qui s'active au survol d'un projet
  const handleMouseEnter = (id) => {
    setHovered(id) // marquer le projet comme survole
    gsap.to(`.project-images-${id}`, { opacity: 1, duration: 0.5 }); 
    gsap.to(`.project-image-${id}`, { opacity: 0.5, duration: 0.5 }); 
  }

  // fonction qui s'active quand le survol d'un projet est quitte
  const handleMouseLeave = (id) => {
    setHovered(null) // pour enlever le survol
    // reinitialisation du defilement en appliquant la derniere position
    const imageSlider = document.querySelector(`.image-slider-${id}`);
    if (imageSlider && lastScrollPosition[id] !== undefined) {
      imageSlider.style.transform = `translateX(-${lastScrollPosition[id]}px)`; // reinitialisation du defilement selon la derniere position
    }
  }

  // fonction qui gere le mouvement de la mouse pour defiler les images horizontalement
  const handleMouseMove = (e, id) => {
    const { clientX, currentTarget } = e; // coordonnees de la mouse
    const { width } = currentTarget.getBoundingClientRect(); // largeur de l'element cible
    const mouseXPercentage = (clientX / width) * 100; // pourcentage du mouvement horizontal de la mouse

    // recuperation du slider des images
    const imageSlider = document.querySelector(`.image-slider-${id}`);
    if (imageSlider) {
      const totalWidth = imageSlider.scrollWidth; // largeur totale des images dans le slider
      const offset = (mouseXPercentage / 100) * (totalWidth - width); // calcul du deplacement horizontal en fonction du pourcentage de la mouse
      imageSlider.style.transform = `translateX(-${offset}px)`; // deplacement sur le slider

      // memoire de la derniere position du defilement pour chaque projet
      setLastScrollPosition(prevState => ({
        ...prevState,
        [id]: offset // stockage de la nouvelle position
      }));
    }
  }

  return (
    <div className='portfolio-container-all'>
        <div className='portfolio-title'>
            <h3>Portfolio</h3>
        </div>
        <div className="portfolio-container">
        {projects.map((project) => (
            <div 
            key={project.id} 
            className="portfolio-item"
            onMouseEnter={() => handleMouseEnter(project.id)}
            onMouseLeave={() => handleMouseLeave(project.id)} 
            onMouseMove={(e) => handleMouseMove(e, project.id)} 
            >
            <div className={`project-images project-images-${project.id}`}>
                <div className={`image-slider image-slider-${project.id}`}>
                {Array.isArray(project.images) && project.images.map((img, index) => (
                    <img key={index} src={img} alt={`Additional ${project.title}`} /> // affichage des images supplementaires du projet
                ))}
                </div>
            </div>
            <div className="project-details">
                <h3>{project.title}</h3> 
                <p>{project.description}</p> 
                <a href={project.link} target="_blank" rel="noopener noreferrer">View Project</a> 
            </div>
            </div>
        ))}
        </div>
    </div>
  )
}

export default Portfolio