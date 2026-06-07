import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
  mode: 'recording' | 'speaking' | 'idle' | 'processing';
  audioStream?: MediaStream | null;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isActive, mode, audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioStream && mode === 'recording') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        
        audioCtxRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (err) {
        console.error("Failed to initialize audio analyser", err);
      }
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [audioStream, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    let height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);

    let phase = 0;

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Draw digital oscilloscope background grid
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.08)';
      ctx.lineWidth = 1;
      
      // Horizontal grids
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Vertical grids
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Midline reference
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const baseColor = '#00ff66';
      const accentColor = '#00ffff';
      const purpleColor = '#ff00ff';

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, accentColor);
      gradient.addColorStop(1, purpleColor);

      if (mode === 'recording' && analyserRef.current) {
        // Real-time audio waveform from microphone
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 3 * window.devicePixelRatio;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = baseColor;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; 
          const normalizedX = i / bufferLength;
          const windowFactor = Math.sin(normalizedX * Math.PI);
          
          const y = height / 2 + ((v - 1.0) * height * 0.95 * windowFactor);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      } else if (isActive && (mode === 'speaking' || mode === 'processing' || mode === 'recording')) {
        // Simulated fluid grid curves
        phase += mode === 'processing' ? 0.03 : 0.08;
        const linesCount = mode === 'processing' ? 2 : 4;
        
        for (let l = 0; l < linesCount; l++) {
          ctx.beginPath();
          const amp = (height * 0.35) / (l + 1) * (mode === 'processing' ? 0.25 : 1);
          const freq = (0.015 + l * 0.005) * (width / 400);
          
          ctx.lineWidth = (3.5 - l * 0.7) * window.devicePixelRatio;
          ctx.strokeStyle = l === 0 ? gradient : `${accentColor}${Math.floor(255 / (l + 1.3)).toString(16).padStart(2, 'f')}`;
          ctx.lineCap = 'round';
          ctx.shadowBlur = l === 0 ? 8 : 0;
          ctx.shadowColor = accentColor;

          for (let x = 0; x < width; x += 4) {
            const normalizedX = x / width;
            const windowFactor = Math.sin(normalizedX * Math.PI);
            
            const y = height / 2 + Math.sin(x * freq - phase + l) * amp * windowFactor;
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Idle flat baseline
        ctx.beginPath();
        ctx.lineWidth = 1.5 * window.devicePixelRatio;
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = baseColor;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, mode]);

  return (
    <div className="w-full h-24 relative bg-black/40 border border-primary/20 overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default WaveformVisualizer;
