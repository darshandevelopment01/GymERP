import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCcw, Check } from 'lucide-react';
import './CameraModal.css';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Default to rear camera
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please ensure you have given permission.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    }
  };

  const handleDone = () => {
    if (capturedImage) {
      // Convert dataUrl to File object
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          onCapture(file);
          onClose();
        });
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        <div className="camera-modal-header">
          <h3>Camera Capture</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="camera-preview-container">
          {error ? (
            <div className="camera-error">
              <p>{error}</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="captured-preview" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="video-feed" />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="camera-controls">
          {!capturedImage ? (
            <>
              <button 
                className="control-btn switch-btn" 
                onClick={toggleCamera} 
                title="Switch Camera"
                disabled={!!error}
              >
                <RefreshCcw size={24} />
              </button>
              <button 
                className="capture-btn" 
                onClick={takePhoto}
                disabled={!!error}
              >
                <div className="inner-circle" />
              </button>
              <div style={{ width: 44 }} /> {/* Spacer */}
            </>
          ) : (
            <>
              <button className="control-btn retake-btn" onClick={() => setCapturedImage(null)}>
                <RefreshCcw size={20} /> Retake
              </button>
              <button className="control-btn done-btn" onClick={handleDone}>
                <Check size={20} /> Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
