import React, { useEffect, useRef, useState } from "react";

const AudioVisualizer = ({ color = "#40e024", strokeColor = "#40e02445", innerColor = "#40e02445", backgroundColor = "#3b3a39" }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

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
        draw();
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setIsCapturing(false);
      }
    };

    const draw = () => {
      const { width, height } = dimensions;
      canvas.width = width;
      canvas.height = height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.15; // Slightly smaller base radius

      rafIdRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.fillStyle = backgroundColor; // a little transparent black
      ctx.fillRect(0, 0, width, height);

      // add small base circle

      // draw amplified circle
      ctx.beginPath();
      const amplitude = dataArrayRef.current.reduce(
        (acc, cur) => Math.max(acc, cur) ,
        0
      );
      let r = baseRadius + (amplitude / 255) * baseRadius * 0.9; // Reduced expansion factor for subtlety
      for (let i = 0; i < 360; i++) {
        // randomize radius a little bit
        let x = centerX + r * Math.cos((i * Math.PI) / 180);
        let y = centerY + r * Math.sin((i * Math.PI) / 180);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      ctx.fillStyle = innerColor;
      ctx.fill();

      // Add stroke
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
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
  }, [color, dimensions, backgroundColor, innerColor, strokeColor]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
      {!isCapturing && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-center">
          <div>
            <p className="text-xl mb-2">
              Microphone access is required for the visualizer.
            </p>
            <p>Please allow microphone access and refresh the page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
