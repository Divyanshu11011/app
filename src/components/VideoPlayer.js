import React, { useState, useRef, useEffect } from 'react';
import './v.css';

const VideoPlayer = ({ filePath, updateVideoFilePath }) => {
  const videoRef = useRef(null);
  const cameraPreviewRef = useRef(null);
  const [volume, setVolume] = useState(50);
  const [showVideo, setShowVideo] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [output, setOutput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadButtonText, setUploadButtonText] = useState('Upload Document');
  const [showFileInput, setShowFileInput] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    pan: false,
    aadhar: false,
    Unrecognized: false
  });
  const [showVerificationLabels, setShowVerificationLabels] = useState(false);
  const [previousVideoEnded, setPreviousVideoEnded] = useState(true); // Track if the previous video has ended
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null);


  const fetchInfoData = async () => {
    try {
      const response = await fetch('http://localhost:3001/latest-data');
      const result = await response.json();

      if (result.data) {
        console.log('Fetched Info Data:', result.data);
        setInfoData(result.data);

        // Update verification status based on ID type
        if (result.data['ID Type'] === 'PAN') {
          setVerificationStatus((prevStatus) => ({
            ...prevStatus,
            pan: true,
          }));
        } else if (result.data['ID Type'] === 'Aadhaar') {
          setVerificationStatus((prevStatus) => ({
            ...prevStatus,
            aadhar: true,
          }));
        } else if (result.data['ID Type'] === 'Unrecognized') {
          setVerificationStatus((prevStatus) => ({
            ...prevStatus,
            Unrecognized: true,
          }));
        }


        // Check if both PAN and Aadhaar are verified
       if (verificationStatus.pan && previousVideoEnded) {
          updateVideoFilePath('PAN'); // Call the function to update video file path
        } else if (verificationStatus.aadhar && previousVideoEnded) {
          updateVideoFilePath('Aadhaar'); // Call the function to update video file path
        } else if (verificationStatus.Unrecognized && previousVideoEnded) {
          updateVideoFilePath('Unrecognized'); // Call the function to update video file path
        }
        else if (verificationStatus.pan && verificationStatus.aadhar && previousVideoEnded) {
          updateVideoFilePath('BothVerified'); // Call the function to update video file path
        } 
      } else {
        console.error('Received unexpected data structure:', result);
      }
    } catch (error) {
      console.error('Error fetching info data:', error);
    }
  };


  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleJoinClick = () => {
    setShowVideo(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setPreviousVideoEnded(true);
    setShowVerificationLabels(true);
    setShowButtons(true); // Display buttons after video ends

    console.log('Email input:', emailInput);
    // Play the correct video based on verification status
    if (verificationStatus.pan && verificationStatus.aadhar && previousVideoEnded) {
      updateVideoFilePath('BothVerified');
      setShowEmailInput(true);
      setShowButtons(false);// Call the function to update video file path
      // console.log('Email input:', emailInput);

      handleEmailSubmit(emailInput);
    } else if (verificationStatus.pan && previousVideoEnded) {
      updateVideoFilePath('PAN'); // Call the function to update video file path
    } else if (verificationStatus.aadhar && previousVideoEnded) {
      updateVideoFilePath('Aadhaar'); // Call the function to update video file path
    } else if (verificationStatus.Unrecognized && previousVideoEnded) {
      updateVideoFilePath('Unrecognized'); // Call the function to update video file path
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadButtonText('Confirm Upload');
  };
  const handleEmailSubmit = async (email) => {
    try {
      if (!email) {
        console.error('Email not provided');
        return;
      }

      console.log('Submitting email:', email);

      const response = await fetch('http://localhost:3001/submit-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response body:', result);

      if (response.ok) {
        console.log('Email submitted successfully:', email);
      } else {
        console.error('Failed to submit email:', result.error);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.createElement('video');
      videoElement.srcObject = videoStream;
      videoElement.setAttribute('playsinline', true);
      document.body.appendChild(videoElement);
  
      videoElement.onloadedmetadata = () => {
        videoElement.play();
      };
  
      cameraPreviewRef.current.appendChild(videoElement);
  
      const captureButton = document.createElement('button');
      captureButton.innerText = 'Capture';
      captureButton.className = 'capture-button';
      captureButton.onclick = async () => {
        const userSatisfaction = window.confirm('Are you satisfied with the captured image?');
        if(userSatisfaction){
          setShowCameraPreview(false);
          setShowButtons(true);
          handleCameraCapture();
        }
        
        const capturedBlob = await captureImageFromVideo(videoElement);
  
        if (capturedBlob) {
          const currentDate = new Date();
          const imageFileName = `captured_${currentDate.getTime()}.jpg`;
  
          const downloadLink = document.createElement('a');
          downloadLink.href = URL.createObjectURL(capturedBlob);
          downloadLink.download = imageFileName;
          downloadLink.click();
  
          // Update the capture status directly without a confirmation dialogue
          setCaptureStatus('Satisfied');
          setShowCameraPreview(false);
          setShowButtons(true);
        }
      };
  
      cameraPreviewRef.current.appendChild(captureButton);
    } catch (error) {
      console.error('Error capturing image from camera:', error);
    }
  };
  
  



  const captureImageFromVideo = (videoElement) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handlePointToCameraClick = async () => {
    try {
      setShowButtons(false);
      setShowCameraPreview(true); // Show camera preview after capturing
      if(setShowCameraPreview){
        await handleCameraCapture();
      } 
      if(showCameraPreview===false){
        alert("hello");
        console.log("hello");
      }
      
        // const userSatisfaction = window.confirm('Are you satisfied with the captured image?');
    
        // if (userSatisfaction) {
        //   // If satisfied, update the capture status and UI accordingly
        //   setCaptureStatus('Satisfied');
        // } else {
        //   // If retry, reset the capture status
        //   setCaptureStatus(null);
        // }
      
    } catch (error) {
      console.error('Error handling camera capture click:', error);
    }
  };
  

  


  const handleProcessFile = async () => {
    try {
      if (!selectedFile || isUploading) {
        console.error('No file selected or file is already being uploaded.');
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:3001/process-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setOutput(JSON.stringify(result, null, 2));

      // Update verification status based on the processed file
      if (result.message) {
        const aadharVerification = result.message.toLowerCase().includes('aadhar');
        const panVerification = result.message.toLowerCase().includes('pan');
        const unrecognizedVerification = result.message.toLowerCase().includes('unrecognized');


        setVerificationStatus((prevStatus) => ({
          ...prevStatus,
          aadhar: aadharVerification || prevStatus.aadhar,
          pan: panVerification || prevStatus.pan,
          Unrecognized: unrecognizedVerification || prevStatus.Unrecognized,
        }));

        // Play the correct video based on verification status
         if (verificationStatus.pan && previousVideoEnded) {
          updateVideoFilePath('PAN'); // Call the function to update video file path
        } else if (verificationStatus.aadhar && previousVideoEnded) {
          updateVideoFilePath('Aadhaar'); // Call the function to update video file path
        } else if (verificationStatus.Unrecognized && previousVideoEnded) {
          updateVideoFilePath('Unrecognized'); // Call the function to update video file path
        }
        else if (verificationStatus.pan && verificationStatus.aadhar && previousVideoEnded) {
          updateVideoFilePath('BothVerified'); // Call the function to update video file path
        } 
      }

      fetchInfoData();
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsUploading(false);
      setUploadButtonText('Upload Document');
      setSelectedFile(null);
      setShowFileInput(false);
    }
  };
  const handleCaptureOptionClick = (option) => {
    if (option === 'Satisfied') {
      setShowButtons(true);
      setShowCaptureOptions(false);
    } else if (option === 'RETRY') {
      setShowCaptureOptions(true);
      // Additional logic if needed when user clicks "RETRY"
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.width = '100%';
      videoRef.current.style.height = 'auto';
    }
  
    // You can check verificationStatus.pan and verificationStatus.aadhar here
    if (verificationStatus.pan && verificationStatus.aadhar && previousVideoEnded) {
      updateVideoFilePath('BothVerified'); // Call the function to update video file path
    } else if (verificationStatus.pan && previousVideoEnded) {
      updateVideoFilePath('PAN'); // Call the function to update video file path
    } else if (verificationStatus.aadhar && previousVideoEnded) {
      updateVideoFilePath('Aadhaar'); // Call the function to update video file path
    } else if (verificationStatus.Unrecognized && previousVideoEnded) {
      updateVideoFilePath('Unrecognized'); // Call the function to update video file path
    }
  
    setShowCameraPreview(
      verificationStatus.pan ||
      verificationStatus.aadhar ||
      verificationStatus.Unrecognized
    );
  
    // Check if the user is satisfied and update UI accordingly
    if (captureStatus === 'Satisfied') {
      setShowButtons(true);
      setShowCameraPreview(false);
    }
  }, [selectedFile, verificationStatus, previousVideoEnded, updateVideoFilePath, captureStatus]);
  
  return (
    <div className="video-container">
      {!showVideo && (
        <button onClick={handleJoinClick} className="join-button">
          Join The Session
        </button>
      )}
      {showVideo && (
        <div>
          <video
            ref={videoRef}
            src={filePath}
            autoPlay
            playsInline
            className="react-player"
            controlsList="nodownload noremoteplayback"
            onEnded={handleVideoEnd}
          />
          
          <div className="end-buttons">
            {videoEnded && !showEmailInput && (
                <div className="white-container">
                  <p className="black-text">Data from info.json:</p>
                  {infoData && <pre>{JSON.stringify(infoData, null, 2)}</pre>}
                </div>
              )}
            {showButtons && (
              <>
                {!showFileInput && (
                  <button
                    className="upload-button"
                    onClick={() => {
                      setShowFileInput(true);
                    }}
                  >
                    {uploadButtonText}
                  </button>
                )}
                {showFileInput && (
                  <div className='inputButton'>
                    <input
                      type="file"
                      accept=".jpg, .jpeg, .png"
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <button
                        className="upload-button"
                        onClick={() => {
                          handleProcessFile();
                        }}
                        disabled={isUploading}
                      >
                        Confirm Upload
                      </button>
                    )}
                  </div>
                )}

                <button className="point-button" onClick={handlePointToCameraClick}>
                  Point to Camera
                </button>
                {showCaptureOptions && (
                  <div className="capture-options">
                    <p>{captureStatus}</p>
                    <button onClick={() => handleCaptureOptionClick('Satisfied')}>Satisfied</button>
                    <button onClick={() => handleCaptureOptionClick('RETRY')}>RETRY</button>
                  </div>
                )}
                

              </>
            )}
            
                
                <div ref={cameraPreviewRef} className="camera-preview-container"></div>

            {showEmailInput && (
              <div className="email-input-container">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />

                <button onClick={() => handleEmailSubmit(emailInput)}>Submit</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* {showCameraPreview && (
        <div className="camera-preview-container">
          <video
            ref={cameraPreviewRef}
            autoPlay
            playsInline
            className="camera-preview"
          />
        </div>
      )} */}





      {showVideo && showVerificationLabels && (
        <div className="verification-label-container">
          <label className="switch">
            <input type="checkbox" checked={verificationStatus.pan} readOnly={!verificationStatus.pan} />
            <div className="slider"></div>
            <div className="slider-card">
              <div className="slider-card-face slider-card-front"></div>
              <div className="slider-card-face slider-card-back"></div>
            </div>
            <span className="verification-status pan-status">Pan__Verified</span>
          </label>

          <label className="switch">
            <input type="checkbox" checked={verificationStatus.aadhar} readOnly={!verificationStatus.aadhar} />
            <div className="slider"></div>
            <div className="slider-card">
              <div className="slider-card-face slider-card-front"></div>
              <div className="slider-card-face slider-card-back"></div>
            </div>
            <span className="verification-status pan-status">Aadhar__Verified</span>
          </label>
        </div>
      )}

      {showVideo && (
        <div className="volume-control">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
          />
          <span>{volume}%</span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

