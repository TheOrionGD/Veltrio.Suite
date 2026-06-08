import React, { useState, useEffect, useRef } from 'react';

interface FramePlayerProps {
  frameFolder: 'frame_one' | 'frame_two';
  totalFrames?: number;
  intervalMs?: number;
  className?: string;
}

const FramePlayer: React.FC<FramePlayerProps> = ({
  frameFolder,
  totalFrames = 4,
  intervalMs = 2000, // 4 frames * 2s = 8 seconds total length
  className = '',
}) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload frames to avoid flicker
  useEffect(() => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `/frames/${frameFolder}/${i}.png`;
    }
  }, [frameFolder, totalFrames]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev % totalFrames) + 1);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalFrames, intervalMs]);

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(parseInt(e.target.value, 10));
    setIsPlaying(false);
  };

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden group">
        <img
          src={`/frames/${frameFolder}/${currentFrame}.png`}
          alt={`Walkthrough ${frameFolder} Frame ${currentFrame}`}
          className="w-full h-full object-cover select-none transition-opacity duration-300"
        />

        {/* Hover play/pause overlay */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 text-slate-800 p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 pointer-events-auto cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
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

        {/* Floating badge */}
        <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {frameFolder === 'frame_one' ? 'Overview Walkthrough' : 'Live Translator Demo'}
        </div>

        {/* Progress bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/35">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500" 
            style={{ width: `${(currentFrame / totalFrames) * 100}%` }}
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors focus:outline-none"
          title={isPlaying ? 'Pause Walkthrough' : 'Play Walkthrough'}
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

        {/* Timeline Slider */}
        <input
          type="range"
          min="1"
          max={totalFrames}
          value={currentFrame}
          onChange={handleTimelineChange}
          className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
        />

        {/* Frame Label */}
        <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider min-w-[36px] text-right">
          0:0{currentFrame * 2} / 0:08
        </span>
      </div>
    </div>
  );
};

export default FramePlayer;
