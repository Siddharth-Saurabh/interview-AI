import React, { useEffect, useState } from 'react';

/**
 * 2D Animated AI Interviewer Avatar Component
 * Features:
 * - Dynamic mouth talking animation synced to speech state (lip-sync simulation)
 * - Natural eye blinking and eyebrow micro-expressions
 * - Emotion & status states: 'speaking', 'listening', 'evaluating', 'idle'
 * - Multiple selectable interviewer characters (Alex, Sarah, David, Elena)
 * - Glowing audio-reactive aura rings and particle effects
 */

export const AVATAR_CHARACTERS = {
  alex: {
    id: 'alex',
    name: 'Alex Rivera',
    title: 'Lead Architect',
    hairColor: '#1e293b',
    skinColor: '#f6d8b8',
    suitColor: '#312e81',
    shirtColor: '#e0e7ff',
    tieColor: '#6366f1',
    glasses: true,
    gender: 'male',
    tag: 'Technical & System Design',
    badge: '👔 Tech Lead'
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah Chen',
    title: 'VP of Engineering',
    hairColor: '#0f172a',
    skinColor: '#fcd3b6',
    suitColor: '#1e1b4b',
    shirtColor: '#fbcfe8',
    tieColor: '#ec4899',
    glasses: false,
    gender: 'female',
    tag: 'Executive & Strategy',
    badge: '👑 VP of Eng'
  },
  david: {
    id: 'david',
    name: 'David Miller',
    title: 'Senior Staff Engineer',
    hairColor: '#78350f',
    skinColor: '#e2a97e',
    suitColor: '#0f766e',
    shirtColor: '#ccfbf1',
    tieColor: '#14b8a6',
    glasses: true,
    gender: 'male',
    tag: 'Algorithms & Concurrency',
    badge: '🔬 Staff SDE'
  },
  elena: {
    id: 'elena',
    name: 'Elena Rostova',
    title: 'Director of Talent & Culture',
    hairColor: '#b45309',
    skinColor: '#ffedd5',
    suitColor: '#831843',
    shirtColor: '#fdf2f8',
    tieColor: '#f43f5e',
    glasses: false,
    gender: 'female',
    tag: 'Behavioral & STAR Leader',
    badge: '🤝 Talent Bar Raiser'
  }
};

export default function Avatar2D({
  characterId = 'alex',
  state = 'idle', // 'speaking' | 'listening' | 'evaluating' | 'idle'
  size = 280,
  showStatusBadge = true,
  audioLevel = 0.5
}) {
  const [blink, setBlink] = useState(false);
  const [mouthOpenStep, setMouthOpenStep] = useState(0); // 0, 1, 2, 3 for mouth shapes
  const [headTilt, setHeadTilt] = useState(0);

  const character = AVATAR_CHARACTERS[characterId] || AVATAR_CHARACTERS.alex;
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isEvaluating = state === 'evaluating';

  // Eye blinking timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle head tilt / breathing animation
  useEffect(() => {
    let tiltInterval;
    if (isListening) {
      tiltInterval = setInterval(() => {
        setHeadTilt(prev => (prev === 0 ? 3 : prev === 3 ? -2 : 0));
      }, 2500);
    } else {
      setHeadTilt(0);
    }
    return () => clearInterval(tiltInterval);
  }, [isListening]);

  // Dynamic mouth shapes for lip-sync when speaking
  useEffect(() => {
    let mouthInterval;
    if (isSpeaking) {
      mouthInterval = setInterval(() => {
        // Cycle randomly between open/narrow/wide mouth shapes
        const steps = [0, 1, 2, 3, 2, 1, 0, 2];
        const next = steps[Math.floor(Math.random() * steps.length)];
        setMouthOpenStep(next);
      }, 120);
    } else {
      setMouthOpenStep(0);
    }
    return () => clearInterval(mouthInterval);
  }, [isSpeaking]);

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none'
    }}>
      {/* Dynamic Sound Wave Pulse Rings (When Speaking) */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          inset: -14,
          borderRadius: '50%',
          border: '2px solid rgba(6, 182, 212, 0.4)',
          animation: 'avatarPulseRing 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Dynamic Listening Pulse Rings (When Listening) */}
      {isListening && (
        <div style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          border: '2px solid rgba(244, 63, 94, 0.45)',
          animation: 'avatarPulseRing 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Evaluating Neural Glow Ring */}
      {isEvaluating && (
        <div style={{
          position: 'absolute',
          inset: -16,
          borderRadius: '50%',
          border: '2px dashed rgba(168, 85, 247, 0.6)',
          animation: 'avatarSpinRing 6s linear infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* SVG 2D Illustrated Character */}
      <svg
        viewBox="0 0 300 300"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          filter: isSpeaking 
            ? 'drop-shadow(0 0 24px rgba(6, 182, 212, 0.35))' 
            : isListening 
            ? 'drop-shadow(0 0 24px rgba(244, 63, 94, 0.3))' 
            : 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
          transform: `rotate(${headTilt}deg)`,
          transition: 'transform 0.4s ease'
        }}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={character.suitColor} />
            <stop offset="100%" stopColor="#0b0f19" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={character.skinColor} />
            <stop offset="100%" stopColor="#e2ab80" />
          </linearGradient>

          <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isSpeaking ? '#06b6d4' : isListening ? '#f43f5e' : '#6366f1'} stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo Backdrop */}
        <circle cx="150" cy="150" r="140" fill="url(#haloGlow)" />

        {/* Circular Avatar Background */}
        <circle cx="150" cy="150" r="132" fill="url(#bgGrad)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="3" />

        {/* Clip Path for shoulders inside circle */}
        <clipPath id="avatarClip">
          <circle cx="150" cy="150" r="130" />
        </clipPath>

        <g clipPath="url(#avatarClip)">
          {/* Subtle Ambient Background Grid in Avatar Tile */}
          <circle cx="150" cy="150" r="95" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="4,4" />

          {/* Shoulders & Suit */}
          <path
            d="M 50 310 L 80 230 C 100 205, 200 205, 220 230 L 250 310 Z"
            fill="url(#suitGrad)"
          />

          {/* Shirt Collar (V-neck / Collared) */}
          <polygon
            points="120,215 150,260 180,215 160,205 150,215 140,205"
            fill={character.shirtColor}
          />

          {/* Tie or Lapel Accent */}
          {character.gender === 'male' ? (
            <polygon
              points="145,225 155,225 158,285 150,295 142,285"
              fill={character.tieColor}
            />
          ) : (
            <path
              d="M 135 220 Q 150 240 165 220"
              stroke={character.tieColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Suit Lapels */}
          <path
            d="M 115 210 L 138 275 L 122 280 L 98 225 Z"
            fill="#1e293b"
            opacity="0.85"
          />
          <path
            d="M 185 210 L 162 275 L 178 280 L 202 225 Z"
            fill="#1e293b"
            opacity="0.85"
          />

          {/* Neck */}
          <rect
            x="134"
            y="170"
            width="32"
            height="46"
            rx="8"
            fill="url(#skinGrad)"
          />
          {/* Neck shadow under chin */}
          <ellipse cx="150" cy="180" rx="18" ry="6" fill="rgba(0,0,0,0.18)" />

          {/* Hair Back (For female style) */}
          {character.gender === 'female' && (
            <path
              d="M 85 120 C 80 200, 110 240, 110 240 C 110 240, 130 190, 130 150 C 170 150, 190 190, 190 240 C 190 240, 220 200, 215 120 C 210 65, 90 65, 85 120 Z"
              fill={character.hairColor}
            />
          )}

          {/* Head Shape */}
          <ellipse
            cx="150"
            cy="138"
            rx="52"
            ry="60"
            fill="url(#skinGrad)"
          />

          {/* Ears */}
          <ellipse cx="96" cy="138" rx="8" ry="14" fill={character.skinColor} />
          <ellipse cx="96" cy="138" rx="4" ry="8" fill="rgba(0,0,0,0.1)" />
          <ellipse cx="204" cy="138" rx="8" ry="14" fill={character.skinColor} />
          <ellipse cx="204" cy="138" rx="4" ry="8" fill="rgba(0,0,0,0.1)" />

          {/* Hair Top & Front */}
          {character.gender === 'male' ? (
            <path
              d="M 94 125 C 92 80, 130 65, 150 65 C 180 65, 208 80, 206 125 C 198 105, 175 92, 150 92 C 125 92, 102 105, 94 125 Z"
              fill={character.hairColor}
            />
          ) : (
            <path
              d="M 92 125 C 88 80, 125 65, 150 65 C 185 65, 212 80, 208 125 C 195 95, 175 84, 150 84 C 120 84, 105 100, 92 125 Z"
              fill={character.hairColor}
            />
          )}

          {/* Eyebrows */}
          <g style={{
            transform: isSpeaking ? 'translateY(-2px)' : isEvaluating ? 'translateY(-3px)' : 'none',
            transition: 'transform 0.2s ease'
          }}>
            <path
              d="M 120 112 Q 132 108 140 114"
              stroke={character.hairColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 180 112 Q 168 108 160 114"
              stroke={character.hairColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Eyes (With Blinking Animation) */}
          {blink ? (
            /* Blink closed eyes */
            <g>
              <line x1="122" y1="126" x2="138" y2="126" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="162" y1="126" x2="178" y2="126" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          ) : (
            /* Open Eyes with attentive pupils */
            <g>
              {/* Left Eye */}
              <ellipse cx="130" cy="126" rx="8" ry="7" fill="#ffffff" />
              <circle cx="130" cy="126" r="4.5" fill="#1e293b" />
              <circle cx="132" cy="124" r="1.8" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="170" cy="126" rx="8" ry="7" fill="#ffffff" />
              <circle cx="170" cy="126" r="4.5" fill="#1e293b" />
              <circle cx="172" cy="124" r="1.8" fill="#ffffff" />
            </g>
          )}

          {/* Glasses Frame (if enabled for character) */}
          {character.glasses && (
            <g>
              <rect x="118" y="116" width="24" height="20" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              <rect x="158" y="116" width="24" height="20" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              <line x1="142" y1="124" x2="158" y2="124" stroke="#6366f1" strokeWidth="2.5" />
              <line x1="118" y1="123" x2="98" y2="125" stroke="#6366f1" strokeWidth="2" />
              <line x1="182" y1="123" x2="202" y2="125" stroke="#6366f1" strokeWidth="2" />
            </g>
          )}

          {/* Nose */}
          <path
            d="M 148 132 L 152 146 L 146 148"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Mouth (Dynamic Lip-Sync Based on isSpeaking & mouthOpenStep) */}
          {isSpeaking ? (
            mouthOpenStep === 0 ? (
              /* Talking Mouth Shape 0: Wide O */
              <ellipse cx="150" cy="164" rx="10" ry="7" fill="#881337" stroke="#4c0519" strokeWidth="1.5">
                <ellipse cx="150" cy="162" rx="6" ry="2" fill="#ffffff" />
              </ellipse>
            ) : mouthOpenStep === 1 ? (
              /* Talking Mouth Shape 1: Open Smile */
              <path
                d="M 138 160 Q 150 174 162 160 Z"
                fill="#9f1239"
                stroke="#881337"
                strokeWidth="1.5"
              />
            ) : mouthOpenStep === 2 ? (
              /* Talking Mouth Shape 2: Narrower open vowel */
              <ellipse cx="150" cy="164" rx="8" ry="9" fill="#881337">
                <ellipse cx="150" cy="160" rx="5" ry="2" fill="#ffffff" />
              </ellipse>
            ) : (
              /* Talking Mouth Shape 3: Syllable articulate */
              <ellipse cx="150" cy="163" rx="12" ry="5" fill="#9f1239">
                <line x1="142" y1="163" x2="158" y2="163" stroke="#fff" strokeWidth="1.5" />
              </ellipse>
            )
          ) : isListening ? (
            /* Attentive Listening Smile */
            <path
              d="M 140 162 Q 150 169 160 162"
              stroke="#881337"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : isEvaluating ? (
            /* Thinking Pondering Straight Mouth */
            <line x1="142" y1="164" x2="158" y2="164" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
          ) : (
            /* Friendly Rest Neutral Smile */
            <path
              d="M 140 163 Q 150 168 160 163"
              stroke="#881337"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Subtle Cheek Rosy Glow */}
          <ellipse cx="120" cy="144" rx="8" ry="5" fill="#f43f5e" opacity="0.16" />
          <ellipse cx="180" cy="144" rx="8" ry="5" fill="#f43f5e" opacity="0.16" />
        </g>
      </svg>

      {/* Floating Status / Persona Indicator Badge */}
      {showStatusBadge && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          background: isSpeaking 
            ? 'rgba(6, 182, 212, 0.95)' 
            : isListening 
            ? 'rgba(244, 63, 94, 0.95)' 
            : isEvaluating 
            ? 'rgba(168, 85, 247, 0.95)' 
            : 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          padding: '4px 14px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}>
          {isSpeaking ? (
            <>
              <span className="wave-dot" style={{ background: '#fff' }} />
              <span>Speaking Question...</span>
            </>
          ) : isListening ? (
            <>
              <span className="wave-dot" style={{ background: '#fff' }} />
              <span>Listening to Candidate...</span>
            </>
          ) : isEvaluating ? (
            <>
              <span className="spin-icon" style={{ display: 'inline-block' }}>⚡</span>
              <span>AI Analyzing Response...</span>
            </>
          ) : (
            <>
              <span>{character.badge}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
