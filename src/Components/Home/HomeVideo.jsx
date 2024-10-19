import React, { useEffect, useRef, useState } from 'react';
// import darkModeVideo from '../../assets/webDev.mp4';
import darkModeVideo from '../../assets/Automatic3.mp4';
import lightModeVideo from '../../assets/Automatic.mp4';
import './HomeVideo.css';

function HomeVideo({ isLightMode }) {
  const [currentVideo, setCurrentVideo] = useState();
  const [videoTime, setVideoTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoTime;
      videoRef.current.play();
      setLoading(false);
    }
  }, [currentVideo]);

  useEffect(() => {
    if (videoRef.current) {
      setVideoTime(videoRef.current.currentTime);
      // currentTime propriete JS qui indique position de video ou audio
      const newVideo = isLightMode ? lightModeVideo : darkModeVideo;
      setCurrentVideo(newVideo);
      setLoading(true);
      videoRef.current.load();
    }
  }, [isLightMode]);



  return (
    <div className={`home ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      <div className='video-div'>
        {loading && <div className="loading">Loading...</div>}
        <video
          ref={videoRef}
          className="main-video"
          autoPlay
          muted
          loop
          onTimeUpdate={() => {
            if (videoRef.current) {
              setVideoTime(videoRef.current.currentTime);
            }
          }}
        >
          <source src={currentVideo} type="video/mp4" />
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
    </div>
  );
}

export default HomeVideo;









// VIDEO LIGH&DARK CHANGEMENT EN FONCTION DU DERNIER FRAME

// import React, { useEffect, useRef, useState } from 'react';
// // import darkModeVideo from '../../assets/webDev.mp4';
// import darkModeVideo from '../../assets/Automatic3.mp4';
// import lightModeVideo from '../../assets/Automatic.mp4';
// import './Home.css';

// function Home({ isLightMode }) {
//   const [currentVideo, setCurrentVideo] = useState();
//   const [videoTime, setVideoTime] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const videoRef = useRef(null);

//   useEffect(() => {
//     if (videoRef.current) {
//       videoRef.current.currentTime = videoTime;
//       videoRef.current.play();
//       setLoading(false);
//     }
//   }, [currentVideo]);

//   useEffect(() => {
//     if (videoRef.current) {
//       setVideoTime(videoRef.current.currentTime);
//       // currentTime propriete JS qui indique position de video ou audio
//       const newVideo = isLightMode ? lightModeVideo : darkModeVideo;
//       setCurrentVideo(newVideo);
//       setLoading(true);
//       videoRef.current.load();
//     }
//   }, [isLightMode]);



//   return (
//     <div className={`home ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
//       <div className='video-div'>
//         {loading && <div className="loading">Loading...</div>}
//         <video
//           ref={videoRef}
//           className="main-video"
//           autoPlay
//           muted
//           loop
//           onTimeUpdate={() => {
//             if (videoRef.current) {
//               setVideoTime(videoRef.current.currentTime);
//             }
//           }}
//         >
//           <source src={currentVideo} type="video/mp4" />
//           Votre navigateur ne supporte pas la balise vidéo.
//         </video>
//       </div>
//       <div className='home-about'>
//         <h1>About</h1>
//         <p>little txt</p>
//         <button>Discover</button>
//       </div>
//     </div>
//   );
// }

// export default Home;

