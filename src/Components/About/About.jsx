import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './About.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Model from './Model/Model';

const About = () => {
    const [hovered, setHovered] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const images = [
        "/assets/s.jpg",  
        "/assets/aura.jpg" 
    ];
    const [currentImage, setCurrentImage] = useState(images[0])
    const title = "About us"
    const [titleAnimationKey, setTitleAnimationKey] = useState(0)


    const handleHover = (index) => {
        setHovered(index);
        setCurrentImage(images[index]);
    };

    // ref du conteneur du canvas
    const canvasRef = useRef(null)

    // position de la souris par rapport au Canvas
    const handleMouseMove = (event) => {
        if (canvasRef.current) {
            // recup les coordonnees de la mouse par rapport a Canvas
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width * 2 - 1; 
            const y = -(event.clientY - rect.top) / rect.height * 2 + 1; 
            setMousePosition({ x, y })
        }
    }

    // event listener pour la mouse a l'interieur du canvas
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.addEventListener('mousemove', handleMouseMove)
        }
        return () => {
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('mousemove', handleMouseMove) // nettoyage
            }
        }
    }, []);


    // animations pour chaque lettre
    const letterAnimations = {
        A: {
            scale: [1, 1.5, 1],
            color: ["#000", "#ff0000", "#fff"], 
            transition: { duration: 1, repeatType: 'loop' },
        },
        B: {
            rotate: [0, 45, -45, 0],  
            transition: { duration: 1, repeatType: 'loop' },
        },
        O: {
            rotate: [0, 360],
            transition: { duration: 2, repeatType: 'loop' },
        },
        T: {
            y: [0, -20, 0],  
            transition: { duration: 0.5, repeatType: 'loop' },
        },
        U2: {
            scale: [1, 1.3, 0.7, 1], 
            skew: ["0deg", "15deg", "-15deg", "0deg"],
            transition: { duration: 2, repeatType: 'loop' },
        },
        U1: { 
            scale: [1, 1.2, 1],
            color: ["#F77600", "#CCA4C4", "#fff"],
            transition: { duration: 1.2, repeatType: 'loop' },
        },
        S: {
            scale: [1, 1.5, 1],
            transition: { duration: 1, repeatType: 'loop' },
        },
    };

    const defaultLetterAnimation = {
        scale: [1, 1.05, 1],
        transition: { duration: 0.6, repeat: Infinity, repeatType: 'loop' }
    };


    const RotatingLight = ({ position, color, intensity }) => {
    const lightRef = useRef();
  
    useFrame(({ clock }) => {
      if (lightRef.current) {
        const time = clock.getElapsedTime();
        const radius = 5;
        lightRef.current.position.x = Math.sin(time) * radius;
        lightRef.current.position.z = Math.cos(time) * radius;
      }
    });
    }


    return (
        <div className='about-container-all'>
            <div 
                className="about-title" 
                onMouseEnter={() => setTitleAnimationKey(prevKey => prevKey + 1)} 
                onMouseLeave={() => setTitleAnimationKey(prevKey => prevKey + 1)} 
            >
                <h2>
                    {title.split("").map((letter, index) => {
                        let animation;
                        if (letter.toUpperCase() === 'U') {
                            animation = index === 3 ? letterAnimations['U1'] : (index === 6 ? letterAnimations['U2'] : defaultLetterAnimation)
                        } else {
                            animation = letterAnimations[letter.toUpperCase()] || defaultLetterAnimation
                        }
                        return (
                            <motion.span
                                key={`${index}-${titleAnimationKey}`} 
                                style={{ display: 'inline-block' }}
                                animate={animation}
                            >
                                {letter}
                                {index === 4 && <span>&nbsp;</span>} 
                            </motion.span>
                        );
                    })}
                </h2>
            </div>
            <div className="about-container">
                <div className="about-left-section">
                    <div
                        className="about-top-left"
                        onMouseEnter={() => handleHover(0)}
                    >
                        <motion.div
                            className="about-content"
                            initial={{ rotateX: 0, backgroundColor: "#fff" }}
                            animate={{
                                rotateX: hovered === 0 ? 180 : 0,
                                backgroundColor: hovered === 0 ? "transparent" : "#fff"
                            }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="video-background">
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    className={hovered === 0 ? 'hidden-video' : 'visible-video'}
                                >
                                    <source src="/assets/8.mp4" type="video/mp4" />
                                </video>
                                <div className={`up-front front ${hovered === 0 ? 'hidden' : ''}`}>
                                    {/* <div className='up-front-title'>
                                        <h2>HIKARI</h2>
                                    </div> */}
                                    {/* <div className='up-front-description'>
                                        <p>Une histoire de passion et de savoir-faire</p>
                                        <p>Découvrir davantage</p>
                                    </div> */}
                                </div>
                            </div>

                            <div className={`up-back back ${hovered === 0 ? 'visible' : ''}`}>
                                <div className='up-back-content-first'>
                                    <img src='/assets/picture.png' alt='image-about'/>
                                </div>
                                <div className='up-back-content-second'>
                                    <p>Hikari incarne l'union de nos aspirations et de notre engagement à donner vie à un projet qui reflète nos valeurs et notre créativité.</p>
                                    </div>
                            </div>
                        </motion.div>
                    </div>
                    <div
                        className="about-bottom-left"
                        onMouseEnter={() => handleHover(1)}
                    >
                        <motion.div
                            className="down-about-content"
                            initial={{ rotateX: 0, backgroundColor: "#fff" }}
                            animate={{
                                rotateX: hovered === 0 ? -180 : 0,
                                backgroundColor: hovered === 0 ? "transparent" : "#fff"
                            }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className={`down-front front ${hovered === 0 ? 'hidden' : ''}`}>
                                <div className='up-back-down-content-first'>
                                    <img src='/assets/picture.png' alt='image-about'/>
                                </div>
                                <motion.div
                                    className="up-back-down-content-second"
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: 1,
                                        transition: { duration: 0.3 },
                                        textShadow: '0px 0px 8px rgba(255,255,255,0.8)',
                                    }}
                                    >
                                    <h2>Qui sommes-nous?</h2>
                                    <p>
                                        Hikari est né d'une rencontre entre passion et détermination. Dans un monde où le code occupe souvent plus de place que nos moments partagés avec nos proches, deux visionnaires ont décidé de créer ce concept unique.
                                    </p>
                                </motion.div>
                                {/* <div className='up-back-down-content-second'>
                                    <h2>Qui sommes-nous?</h2>
                                    <p>Hikari est né d'une rencontre entre passion et détermination. Dans un monde où le code occupe souvent plus de place que nos moments partagés avec nos proches, deux visionnaires ont décidé de créer ce concept unique.</p>
                                </div> */}
                            </div>
                            <div className={`down-back back ${hovered === 0 ? 'visible' : 'hidden'}`}>
                                <div className='down-back-content-first'>
                                    <img src='/assets/color.png' alt='image-about'/>
                                </div>
                                <div className='down-back-content-second'>
                                    <a href="/members">Members</a>                            
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
               
                <div className="about-right-section">
                    <div className='about-right-section-first'>
                        {/* Canvas */}
                        <div className="canvas-container" ref={canvasRef}>
                            <Canvas
                                camera={{ position: [0, 0, 5], fov: 50 }}
                            >
                                <mesh position={[0, 0, -10]}>
                                    <planeGeometry args={[100, 100]} />
                                    <meshStandardMaterial color="lightblue" />
                                </mesh>
                                {/* lumiere */}
                                <ambientLight intensity={0.5} />
                                <spotLight position={[2, 2, 2]} intensity={1} angle={Math.PI / 4} penumbra={1} castShadow />
                                <spotLight position={[10, 10, 10]} intensity={0.7} />
                                <spotLight 
                                    position={[2, 2, 2]} 
                                    intensity={10} 
                                    color="#78AD19" 
                                />
                                <spotLight 
                                    position={[1, 0, 2]} 
                                    intensity={10} 
                                    color="#F77600" 
                                />
                                <RotatingLight position={[2, 2, 2]} color="#E0B2FF" intensity={10} />
                                <RotatingLight position={[-3, 0, 5]} color="#AB50D6" intensity={10}/>

                                {/* mesh */}
                                <Model mousePosition={mousePosition} />

                                <OrbitControls />
                            </Canvas>
                        </div>
                        {/* Image 1 */}
                        <div className='img-section-about'>
                            <motion.img
                                src={currentImage}
                                alt="Current"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <div className='overlay-images'>
                                <img src="/assets/eyes.png" alt="Lower Left" className='lower-left' />
                            </div>
                            <div className='txt-img-section-about'>
                                <a href="/expertise">Our serveices</a>                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default About
