import React, { useState, useEffect, useRef } from 'react';

interface FramePlayerProps {
  frameFolder: 'frame_one' | 'frame_two';
  totalFrames?: number;
  intervalMs?: number;
  className?: string;
}

// Folder-specific config
const FOLDER_CONFIG = {
  frame_one: {
    totalFrames: 49,
    getFrameSrc: (n: number) => `/frames/frame_one/f1_${n}.jpg`,
    label: 'Desktop Preview',
    aspectClass: 'aspect-video',
  },
  frame_two: {
    totalFrames: 50,
    getFrameSrc: (n: number) => `/frames/frame_two/f2_${n}.jpg`,
    label: 'Mobile Preview',
    aspectClass: 'aspect-[9/16]',
  },
} as const;

const FramePlayer: React.FC<FramePlayerProps> = ({
  frameFolder,
  totalFrames,
  intervalMs = 120,
  className = '',
}) => {
  const config = FOLDER_CONFIG[frameFolder];
  const resolvedTotal = totalFrames ?? config.totalFrames;

  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload all frames to avoid flicker
  useEffect(() => {
    for (let i = 1; i <= resolvedTotal; i++) {
      const img = new Image();
      img.src = config.getFrameSrc(i);
    }
  }, [frameFolder, resolvedTotal]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev % resolvedTotal) + 1);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, resolvedTotal, intervalMs]);

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(parseInt(e.target.value, 10));
    setIsPlaying(false);
  };

  const totalSec = Math.round((resolvedTotal * intervalMs) / 1000);
  const currentSec = Math.round((currentFrame * intervalMs) / 1000);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {/* Frame Container */}
      <div className={`relative ${config.aspectClass} bg-slate-900 flex items-center justify-center overflow-hidden group`}>
        <img
          key={config.getFrameSrc(currentFrame)}
          src={config.getFrameSrc(currentFrame)}
          alt={`${config.label} — Frame ${currentFrame}`}
          className="w-full h-full object-cover select-none"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
        />

        {/* Hover play/pause overlay */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div
            className="bg-white/95 text-slate-800 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 pointer-events-auto cursor-pointer"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Floating label badge */}
        <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {config.label}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/35">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${(currentFrame / resolvedTotal) * 100}%` }}
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min="1"
          max={resolvedTotal}
          value={currentFrame}
          onChange={handleTimelineChange}
          className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
        />

        <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider min-w-[52px] text-right">
          {fmt(currentSec)} / {fmt(totalSec)}
        </span>
      </div>
    </div>
  );
};

export default FramePlayer;
