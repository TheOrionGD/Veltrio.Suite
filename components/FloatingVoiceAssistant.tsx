import React, { useState, useEffect, useRef } from 'react';
import { AppPage } from '../types';

interface FloatingVoiceAssistantProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  activeOverlay: AppPage | null;
  setActiveOverlay: (overlay: AppPage | null) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
}

interface AssistantAction {
  id: string;
  label: string;
  icon: string;
  colorClass: string;
  angle: number;
  action: () => void;
}

const FloatingVoiceAssistant: React.FC<FloatingVoiceAssistantProps> = ({
  currentPage,
  setCurrentPage,
  activeOverlay,
  setActiveOverlay,
  setIsCommandPaletteOpen,
  isAssistantOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string>('VOICE ASSISTANT');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close overlay on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHoveredLabel('SELECT ACTION');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Radial menu options mapped to Veltrio routes and overlays
  const ACTIONS: AssistantAction[] = [
    {
      id: 'translate',
      label: 'Translate Text',
      icon: '📝',
      colorClass: 'translate',
      angle: 315, // Top-Left
      action: () => {
        setCurrentPage('translator');
        setActiveOverlay(null);
        handleClose();
      },
    },
    {
      id: 'voice',
      label: 'Voice Room',
      icon: '🎙️',
      colorClass: 'voice',
      angle: 45, // Top-Right
      action: () => {
        setCurrentPage('conversation');
        setActiveOverlay(null);
        handleClose();
      },
    },
    {
      id: 'search',
      label: 'Quick Search',
      icon: '🔍',
      colorClass: 'search',
      angle: 135, // Bottom-Right
      action: () => {
        setIsCommandPaletteOpen(true);
        handleClose();
      },
    },
    {
      id: 'notes',
      label: 'Project Files',
      icon: '🗂️',
      colorClass: 'notes',
      angle: 225, // Bottom-Left
      action: () => {
        setActiveOverlay('files');
        handleClose();
      },
    },
  ];

  const RADIUS = 85; // circular layout radius (pixels)

  return (
    <>
      {/* Floating Trigger Button: visible only on mobile viewports when no overlay is open */}
      {!activeOverlay && !isAssistantOpen && (
        <button
          onClick={handleOpen}
          className="voice-assistant-trigger focus:outline-none block md:hidden"
          title="Open Voice Assistant"
        >
          <span className="text-xl select-none">🎙️</span>
        </button>
      )}

      {/* Full-Screen Immersive Voice Assistant Overlay */}
      <div
        ref={overlayRef}
        onClick={handleClose}
        className={`voice-assistant-overlay ${isOpen ? 'active' : ''}`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="voice-assistant-wheel-container"
        >
          {/* Circular Wheel Widget */}
          <div className="voice-assistant-wheel-wrapper">
            {/* Top caret selector pointer */}
            <div className="voice-assistant-indicator" />

            {/* Orbiting Blobs/Petals (Radial menu items) */}
            {ACTIONS.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setHoveredLabel(item.label)}
                onMouseLeave={() => setHoveredLabel('SELECT ACTION')}
                className={`voice-assistant-petal ${item.colorClass} focus:outline-none`}
                style={{
                  transform: `rotate(${item.angle}deg) translate(0, -${RADIUS}px) rotate(${-item.angle}deg)`,
                }}
              >
                <span className="petal-icon select-none pointer-events-none">{item.icon}</span>
                <span className="petal-label select-none pointer-events-none">{item.id}</span>
              </button>
            ))}

            {/* Glowing Center Core */}
            <div className="voice-assistant-core select-none">
              <span className="text-3xl animate-pulse">🎙️</span>
            </div>
          </div>

          {/* Dynamic spaced label below the wheel */}
          <div className="voice-assistant-label-glow">
            {hoveredLabel}
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingVoiceAssistant;
