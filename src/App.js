import React, { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [videoFilePath, setVideoFilePath] = useState('/videos/1.mp4');

  // Function to update the video file path based on the ID type
  // Function to update the video file path based on the ID type
const updateVideoFilePath = (idType) => {
  if (idType === 'PAN') {
    setVideoFilePath('/videos/2.mp4');
  } else if (idType === 'Aadhaar') {
    setVideoFilePath('/videos/3.mp4');
  } 
  else if (idType === 'BothVerified') {
    setVideoFilePath('/videos/4.mp4');
  } 
  else if  (idType === 'Unrecognized'){
    setVideoFilePath('/videos/5.mp4');
  }
};


  return (
    <div className='App'>
      <VideoPlayer filePath={videoFilePath} updateVideoFilePath={updateVideoFilePath} />
    </div>
  );
}

export default App;