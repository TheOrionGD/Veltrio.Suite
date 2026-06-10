import React, { useState, useEffect, useRef } from 'react';
import { AppPage } from '../types';

interface WheelNavItem {
  id: string;
  label: string;
  icon: string;
  isOverlay: boolean;
  actionKey: AppPage | 'copilot';
}

const WHEEL_ITEMS: WheelNavItem[] = [
  { id: 'translator', label: 'Text', icon: '📝', isOverlay: false, actionKey: 'translator' },
  { id: 'conversation', label: 'Voice', icon: '🎙️', isOverlay: false, actionKey: 'conversation' },
  { id: 'copilot', label: 'Copilot', icon: '✨', isOverlay: false, actionKey: 'copilot' },
  { id: 'analytics', label: 'Stats', icon: '📊', isOverlay: true, actionKey: 'analytics' },
  { id: 'files', label: 'Files', icon: '🗂️', isOverlay: true, actionKey: 'files' },
  { id: 'history', label: 'Timeline', icon: '🕐', isOverlay: true, actionKey: 'history' },
  { id: 'settings', label: 'Settings', icon: '⚙️', isOverlay: true, actionKey: 'settings' },
  { id: 'notifications', label: 'Alerts', icon: '🔔', isOverlay: true, actionKey: 'notifications' },
  { id: 'help', label: 'Docs', icon: '❓', isOverlay: true, actionKey: 'help' }
];

interface MobileNavWheelProps {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  activeOverlay: AppPage | null;
  setActiveOverlay: (overlay: AppPage | null) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  unreadNotificationsCount?: number;
}

const MobileNavWheel: React.FC<MobileNavWheelProps> = ({
  currentPage,
  setCurrentPage,
  activeOverlay,
  setActiveOverlay,
  isAssistantOpen,
  setIsAssistantOpen,
  unreadNotificationsCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLButtonElement[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Animation and interaction state stored in refs for 60fps performance
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startAngleRef = useRef(0);
  const startRotationRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastRotationRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  const RADIUS = 115; // circular layout radius (pixels)

  // Map current app state to wheel item index
  useEffect(() => {
    let activeKey: string = currentPage;
    if (activeOverlay) {
      if (activeOverlay === 'projects') activeKey = 'files';
      else if (activeOverlay === 'profile') activeKey = 'settings';
      else activeKey = activeOverlay;
    } else if (isAssistantOpen) {
      activeKey = 'copilot';
    }

    const idx = WHEEL_ITEMS.findIndex((item) => item.id === activeKey);
    if (idx !== -1 && !isDraggingRef.current) {
      setActiveIndex(idx);
      // Clean target rotation for activeIndex
      const targetRotation = -idx * 40;
      
      // Cancel previous animation and animate towards target
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animateToRotation(targetRotation, idx);
    }
  }, [currentPage, activeOverlay, isAssistantOpen]);

  // Clean layout helper
  const updateLayout = (rot: number) => {
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rot}deg)`;
    }

    WHEEL_ITEMS.forEach((_, idx) => {
      const itemEl = itemRefs.current[idx];
      if (!itemEl) return;

      // Calculate relative angle to top center (0 deg)
      const baseAngle = idx * 40;
      const currentAngle = baseAngle + rot;
      
      // Normalize to [-180, 180]
      let normAngle = currentAngle % 360;
      if (normAngle > 180) normAngle -= 360;
      if (normAngle < -180) normAngle += 360;

      // Vis properties based on distance from center
      const absAngle = Math.abs(normAngle);
      
      // Calculate scale (peak at center: 1.35x, falloff to 0.75x)
      const scale = Math.max(0.75, 1.35 - 0.6 * Math.pow(absAngle / 90, 2));
      
      // Calculate opacity (peak: 1.0, falloff to 0.0 at 90+ deg)
      const opacity = absAngle >= 95 ? 0 : Math.max(0, 1.0 - (absAngle / 95));

      // Calculate blur (0px at center, up to 6px at sides)
      const blurVal = Math.min(6, absAngle / 15);

      // Keep item icons upright
      itemEl.style.transform = `rotate(${baseAngle}deg) translate(0, -${RADIUS}px) rotate(${-baseAngle - rot}deg) scale(${scale})`;
      itemEl.style.opacity = `${opacity}`;
      itemEl.style.filter = blurVal > 0.5 ? `blur(${blurVal}px)` : 'none';
      itemEl.style.pointerEvents = opacity > 0.15 ? 'auto' : 'none';
      
      if (absAngle < 20) {
        itemEl.classList.add('active');
      } else {
        itemEl.classList.remove('active');
      }
    });
  };

  const getTouchAngle = (clientX: number, clientY: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height; // Center offset below screen bottom
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    
    isDraggingRef.current = true;
    const touch = e.touches[0];
    const angle = getTouchAngle(touch.clientX, touch.clientY);
    
    startAngleRef.current = angle;
    startRotationRef.current = rotationRef.current;
    
    lastRotationRef.current = rotationRef.current;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    
    const touch = e.touches[0];
    const angle = getTouchAngle(touch.clientX, touch.clientY);
    const diff = angle - startAngleRef.current;
    
    const nextRotation = startRotationRef.current + diff;
    rotationRef.current = nextRotation;
    
    // Calculate sliding velocity
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 10) {
      const rotDiff = nextRotation - lastRotationRef.current;
      velocityRef.current = rotDiff / dt;
      
      lastRotationRef.current = nextRotation;
      lastTimeRef.current = now;
    }
    
    updateLayout(nextRotation);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    
    // Decelerate with friction or snap immediately
    let velocity = velocityRef.current * 16; // scale to degrees/frame roughly
    
    const step = () => {
      if (Math.abs(velocity) > 0.25) {
        rotationRef.current += velocity;
        velocity *= 0.93; // decay friction
        updateLayout(rotationRef.current);
        animationFrameIdRef.current = requestAnimationFrame(step);
      } else {
        // Run snap alignment LERP
        const k = Math.round(-rotationRef.current / 40);
        const targetRotation = -k * 40;
        snapToRotation(targetRotation);
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(step);
  };

  const snapToRotation = (targetRot: number) => {
    const snapStep = () => {
      const diff = targetRot - rotationRef.current;
      if (Math.abs(diff) > 0.1) {
        rotationRef.current += diff * 0.18; // smooth spring LERP
        updateLayout(rotationRef.current);
        animationFrameIdRef.current = requestAnimationFrame(snapStep);
      } else {
        rotationRef.current = targetRot;
        updateLayout(targetRot);
        
        // Resolve target action
        const k = Math.round(-targetRot / 40);
        const resolvedIdx = ((k % 9) + 9) % 9;
        setActiveIndex(resolvedIdx);
        triggerAction(WHEEL_ITEMS[resolvedIdx]);
      }
    };
    animationFrameIdRef.current = requestAnimationFrame(snapStep);
  };

  const animateToRotation = (targetRot: number, targetIdx: number) => {
    const step = () => {
      const diff = targetRot - rotationRef.current;
      if (Math.abs(diff) > 0.2) {
        rotationRef.current += diff * 0.18;
        updateLayout(rotationRef.current);
        animationFrameIdRef.current = requestAnimationFrame(step);
      } else {
        rotationRef.current = targetRot;
        updateLayout(targetRot);
        setActiveIndex(targetIdx);
      }
    };
    animationFrameIdRef.current = requestAnimationFrame(step);
  };

  const triggerAction = (item: WheelNavItem) => {
    if (item.isOverlay) {
      setActiveOverlay(item.actionKey as AppPage);
    } else {
      if (item.actionKey === 'copilot') {
        setIsAssistantOpen(true);
      } else {
        setCurrentPage(item.actionKey as AppPage);
        setActiveOverlay(null);
        setIsAssistantOpen(false);
      }
    }
  };

  const handleItemClick = (idx: number) => {
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    
    const targetRotation = -idx * 40;
    
    const step = () => {
      const diff = targetRotation - rotationRef.current;
      if (Math.abs(diff) > 0.2) {
        rotationRef.current += diff * 0.22; // Faster spring for direct taps
        updateLayout(rotationRef.current);
        animationFrameIdRef.current = requestAnimationFrame(step);
      } else {
        rotationRef.current = targetRotation;
        updateLayout(targetRotation);
        setActiveIndex(idx);
        triggerAction(WHEEL_ITEMS[idx]);
      }
    };
    animationFrameIdRef.current = requestAnimationFrame(step);
  };

  // Initial draw
  useEffect(() => {
    updateLayout(rotationRef.current);
  }, []);

  return (
    <div ref={containerRef} className="mobile-wheel-container">
      {/* Visual selection indicator tick */}
      <div className="mobile-wheel-hud-pointer" />

      {/* Background ring layer */}
      <div className="mobile-wheel-hitbox"
           onTouchStart={handleTouchStart}
           onTouchMove={handleTouchMove}
           onTouchEnd={handleTouchEnd}
      >
        <div ref={wheelRef} className="mobile-wheel-ring w-full h-full">
          {WHEEL_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current[idx] = el;
              }}
              onClick={() => handleItemClick(idx)}
              className="mobile-wheel-item focus:outline-none relative"
              title={item.label}
              style={{
                // Base angles mapped absolute
                transform: `rotate(${idx * 40}deg) translate(0, -${RADIUS}px) rotate(${-idx * 40}deg)`
              }}
            >
              <span className="select-none pointer-events-none">{item.icon}</span>
              {item.id === 'notifications' && unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#44b3cc] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#44b3cc]"></span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Floating dynamic label for selection indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.25em] text-[#2896b2] dark:text-[#44b3cc] pointer-events-none">
        {WHEEL_ITEMS[activeIndex]?.label}
      </div>
    </div>
  );
};

export default MobileNavWheel;
