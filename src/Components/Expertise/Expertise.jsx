import React, { useEffect, useState } from 'react';
import './Expertise.css';
import gsap from 'gsap';

const Expertise = () => {
    
    const [services, setServices] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [visibleDiv, setVisibleDiv] = useState(null);

    useEffect(() => {
        const services = fetch('/services.json').then(response => response.json());
        const servicesImages = fetch('/images.json').then(response => response.json());

        Promise.all([services, servicesImages])
            .then(([servicesData, servicesImagesData]) => {
                handleServicesWithImages(servicesData, servicesImagesData);
            })
            .catch(error => console.error("Error:", error));
    }, []);

    const handleServicesWithImages = (servicesData, servicesImagesData) => {
        const servicesWithImages = servicesData.map(service => {
            const serviceImage = servicesImagesData.find(image => image.id === service.image_id);
            return {
                ...service,
                image: serviceImage ? serviceImage.image : ''
            };
        });
        setServices(servicesWithImages);
    };

    const handleShowHiddenDiv = (id) => {
        setVisibleDiv(visibleDiv === id ? null : id);
    };

    const handleMouseLeave = () => {
        setVisibleDiv(null);
    };

    useEffect(() => {
        gsap.fromTo('.service-card', { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.3, duration: 1 });
        gsap.fromTo('.expertise-title span', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, stagger: 0.1, duration: 1 }
        );
    }, [services]);

    return (
        <div className='expertise-container-all'>
            <div className='background-image-expertise' />
            <div className="expertise-container">
                <div className="service-container">
                    {services.map(service => (
                        <div 
                            key={service.id} 
                            className={`service-card ${visibleDiv === service.id ? 'active' : ''}`}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="service-image">
                                {service.image && <img src={`/assets/${service.image}`} alt={service.title} />}
                            </div>
                            <div className={`service-description ${visibleDiv === service.id ? 'visible' : ''}`}>
                                <p>{service.description}</p>
                            </div>
                            <div className="service-icon">
                                {service.icon && <img src={`/assets/${service.icon}`} alt={service.title} />}
                            </div>
                            <h3>
                                <button className='button-hover-effect' onClick={() => handleShowHiddenDiv(service.id)}>Read more</button>
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
            <div className='expertise-title'>
                <h2>
                    {'Our Expertise'.split('').map((letter, index) => (
                        <span key={index}>{letter}</span>  
                    ))}
                </h2>
            </div>
        </div>
    )
}

export default Expertise