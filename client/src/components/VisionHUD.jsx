import React, { useState } from 'react';
import { Eye, EyeOff, Activity, ShieldCheck, ChevronDown, ChevronUp, Sparkles, User } from 'lucide-react';

/**
 * Live Vision & Body Language Telemetry HUD Overlay
 * Rendered over the Candidate video stream in VideoInterviewRoom.
 */
export default function VisionHUD({ metrics }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!metrics) return null;

  const {
    isFaceDetected = true,
    eyeContact = true,
    eyeContactPercentage = 90,
    postureStatus = 'upright',
    postureScore = 90,
    composureScore = 8.5,
    headStabilityScore = 92,
    coachingTip = 'Great eye contact and posture.'
  } = metrics;

  const getStatusColor = (score) => {
    if (score >= 85) return '#10b981'; // Green
    if (score >= 70) return '#06b6d4'; // Cyan
    if (score >= 55) return '#fbbf24'; // Amber
    return '#f43f5e'; // Rose
  };

  const eyeColor = getStatusColor(eyeContactPercentage);
  const postureColor = getStatusColor(postureScore);

  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      right: 14,
      background: 'rgba(10, 15, 29, 0.88)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '12px',
      padding: collapsed ? '6px 12px' : '10px 14px',
      color: '#fff',
      fontSize: '0.75rem',
      zIndex: 25,
      maxWidth: collapsed ? 'auto' : '260px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      transition: 'all 0.25s ease'
    }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        cursor: 'pointer'
      }}
      onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isFaceDetected ? '#10b981' : '#f43f5e',
            boxShadow: isFaceDetected ? '0 0 6px #10b981' : '0 0 6px #f43f5e'
          }} />
          <span style={{ fontWeight: 800, fontSize: '0.74rem', color: '#a5b4fc', letterSpacing: '0.02em' }}>
            VISION AI TELEMETRY
          </span>
        </div>

        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Metrics */}
      {!collapsed && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          
          {/* Eye Contact Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0' }}>
              <Eye size={13} color={eyeColor} />
              <span>Eye Contact:</span>
            </div>
            <span style={{ fontWeight: 800, color: eyeColor }}>
              {eyeContact ? 'Direct' : 'Averted'} ({eyeContactPercentage}%)
            </span>
          </div>

          {/* Posture Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0' }}>
              <User size={13} color={postureColor} />
              <span>Posture:</span>
            </div>
            <span style={{ fontWeight: 800, color: postureColor, textTransform: 'capitalize' }}>
              {postureStatus} ({postureScore}%)
            </span>
          </div>

          {/* Composure / Stability Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#e2e8f0' }}>
              <Activity size={13} color="#c084fc" />
              <span>Composure:</span>
            </div>
            <span style={{ fontWeight: 800, color: '#c084fc' }}>
              {composureScore} / 10
            </span>
          </div>

          {/* Mini Coaching Feedback Pill */}
          <div style={{
            marginTop: 4,
            padding: '5px 8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '6px',
            fontSize: '0.68rem',
            color: '#c7d2fe',
            lineHeight: 1.3
          }}>
            {coachingTip}
          </div>

        </div>
      )}
    </div>
  );
}
