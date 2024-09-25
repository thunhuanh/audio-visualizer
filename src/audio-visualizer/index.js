import React, { useEffect, useRef, useState } from "react";

const AudioVisualizer = ({
  strokeColor = "#E0C09790",
  innerColor = "#E0C09780",
  backgroundColor = "#2D2424",
}) => {
  const containerRef = useRef(null);
  const circleRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        setIsCapturing(true);
        updateVisualization();
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setIsCapturing(false);
      }
    };

    const updateVisualization = () => {
      const { width, height } = dimensions;
      const baseRadius = Math.min(width, height) * 0.15;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      const amplitude = dataArrayRef.current.reduce(
        (acc, cur) => Math.max(acc, cur),
        0
      );
      const radius = baseRadius + (amplitude / 255) * baseRadius * 0.9;

      if (circleRef.current) {
        circleRef.current.style.width = `${radius * 2}px`;
        circleRef.current.style.height = `${radius * 2}px`;
      }

      rafIdRef.current = requestAnimationFrame(updateVisualization);
    };

    setupAudio();

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      <div
        ref={circleRef}
        style={{
          backgroundColor: innerColor,
          border: `2px solid ${strokeColor}`,
          borderRadius: '50%',
          transition: 'width 0.1s ease-out, height 0.1s ease-out',
        }}
      />
      {!isCapturing && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Microphone access is required for the visualizer.
          </p>
          <p>Please allow microphone access and refresh the page.</p>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;