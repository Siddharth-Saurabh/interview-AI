import React, { useState } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Layers, 
  Code2, 
  MessageSquare, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Target, 
  Clock, 
  Compass,
  Trophy,
  Flame,
  Award,
  Video,
  Camera,
  Users
} from 'lucide-react';
import Avatar2D, { AVATAR_CHARACTERS } from './Avatar2D.jsx';

const POPULAR_ROLES = [
  'Full Stack MERN Developer',
  'Frontend React Engineer',
  'Backend Node.js / Express',
  'System Design & Architecture',
  'DevOps & Cloud Engineer',
  'Data Scientist & ML',
  'Product Manager (Tech)'
];

const PRESET_TEMPLATES = [
  {
    name: '💻 FAANG DSA & Algorithms',
    role: 'Software Development Engineer',
    level: 'Mid-Level',
    tech: ['JavaScript', 'Algorithms', 'Data Structures', 'LeetCode'],
    round: 1,
    primaryLanguage: 'javascript'
  },
  {
    name: '🚀 MERN Stack Mastery',
    role: 'Full Stack MERN Developer',
    level: 'Mid-Level',
    tech: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript'],
    round: 2,
    primaryLanguage: 'javascript'
  },
  {
    name: '⚡ Distributed Systems Architect',
    role: 'System Design & Architecture',
    level: 'Senior',
    tech: ['Docker', 'AWS', 'Redis', 'PostgreSQL', 'GraphQL'],
    round: 3,
    primaryLanguage: 'javascript'
  },
  {
    name: '🎨 Modern Frontend Specialist',
    role: 'Frontend React Engineer',
    level: 'Mid-Level',
    tech: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
    round: 1,
    primaryLanguage: 'typescript'
  },
  {
    name: '👑 Executive Bar Raiser',
    role: 'Product Manager (Tech)',
    level: 'Senior',
    tech: ['Agile', 'System Metrics', 'STAR Framework'],
    round: 4,
    primaryLanguage: 'javascript'
  }
];

const EXPERIENCE_LEVELS = [
  { id: 'Junior', label: 'Junior (0-2 Yrs)', desc: 'Fundamentals, syntax, and core problem solving' },
  { id: 'Mid-Level', label: 'Mid-Level (2-5 Yrs)', desc: 'System design, optimization, and project trade-offs' },
  { id: 'Senior', label: 'Senior (5+ Yrs)', desc: 'Architectural scale, leadership, and deep technical mastery' }
];

const INTERVIEW_ROUNDS = [
  {
    roundNumber: 1,
    id: 'Live Coding',
    title: 'Round 1: Live Coding & Algorithms',
    tag: 'Monaco IDE & Big-O Evaluation',
    icon: Code2,
    desc: 'Interactive LeetCode-style coding challenges with in-browser sandbox runner, test cases, and Big-O complexity analysis.'
  },
  {
    roundNumber: 2,
    id: 'Technical',
    title: 'Round 2: Technical Screening',
    tag: 'Core Architecture & Concepts',
    icon: Zap,
    desc: 'Deep dive into language mechanics, async event loops, security, debugging, and framework internals.'
  },
  {
    roundNumber: 3,
    id: 'System Design',
    title: 'Round 3: System Design & Architecture',
    tag: 'Scalability & Microservices',
    icon: Layers,
    desc: 'High concurrency, database sharding, caching layers (Redis), load balancing, and distributed reliability.'
  },
  {
    roundNumber: 4,
    id: 'Behavioral',
    title: 'Round 4: Behavioral & Bar Raiser',
    tag: 'STAR Framework & Leadership',
    icon: MessageSquare,
    desc: 'Executive communication, stakeholder trade-offs, conflict resolution, ownership, and culture fit.'
  }
];

const CODING_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript (Node.js)', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'python', name: 'Python 3', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' }
];

const TECH_SUGGESTIONS = [
  'React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Next.js', 
  'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'TailwindCSS', 'Redis', 'Python'
];

const PERSONALITY_OPTIONS = [
  { id: 'Professional', name: 'Professional', desc: 'Formal, structured, and realistic industry standard', icon: '👔' },
  { id: 'Friendly', name: 'Friendly', desc: 'Warm, encouraging, and supportive coaching tone', icon: '🤝' },
  { id: 'Technical Expert', name: 'Technical Expert', desc: 'Deep internal mechanics, high scale & failure modes', icon: '🔬' },
  { id: 'Strict', name: 'Strict', desc: 'Demanding, no-nonsense, challenges edge-cases', icon: '⚡' },
  { id: 'HR Interviewer', name: 'HR Interviewer', desc: 'Behavioral dynamics, leadership & STAR framework', icon: '💼' }
];

export default function InterviewSetup({ onStartInterview, loading, userCredits, initialRound = 1 }) {
  const [mode, setMode] = useState('video'); // 'video' | 'virtual' | 'text'
  const [selectedAvatarId, setSelectedAvatarId] = useState('alex');
  const [personality, setPersonality] = useState('Professional');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [role, setRole] = useState('Full Stack MERN Developer');
  const [customRole, setCustomRole] = useState('');
  const [level, setLevel] = useState('Mid-Level');
  const [selectedRound, setSelectedRound] = useState(initialRound);
  const [primaryLanguage, setPrimaryLanguage] = useState('javascript');
  const [selectedTech, setSelectedTech] = useState(['React', 'Node.js', 'MongoDB', 'Express']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [cameraTestActive, setCameraTestActive] = useState(false);

  const toggleTech = (tech) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter(t => t !== tech));
    } else {
      setSelectedTech([...selectedTech, tech]);
    }
  };

  const addCustomTech = (e) => {
    if (e.key === 'Enter' && customTechInput.trim()) {
      e.preventDefault();
      if (!selectedTech.includes(customTechInput.trim())) {
        setSelectedTech([...selectedTech, customTechInput.trim()]);
      }
      setCustomTechInput('');
    }
  };

  const handleStart = () => {
    const finalRole = customRole.trim() ? customRole.trim() : role;
    const roundConfig = INTERVIEW_ROUNDS.find(r => r.roundNumber === selectedRound) || INTERVIEW_ROUNDS[0];

    onStartInterview({
      role: finalRole,
      level,
      roundNumber: selectedRound,
      interviewType: roundConfig.id,
      primaryLanguage,
      techStack: selectedTech,
      questionCount,
      mode,
      avatarId: selectedAvatarId,
      interviewerPersonality: personality,
      durationMinutes
    });
  };

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: 960, margin: '0 auto 40px auto' }}>
        <div className="badge badge-primary" style={{ marginBottom: 16, padding: '6px 16px', fontSize: '0.8rem' }}>
          <Sparkles size={15} color="#a5b4fc" />
          <span>Full Multi-Round Tech Hiring Pipeline Simulator</span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(2.2rem, 5.5vw, 3.4rem)', 
          fontWeight: 800, 
          lineHeight: 1.15, 
          letterSpacing: '-0.03em',
          marginBottom: 16 
        }}>
          Simulate Real-World Tech Interviews <br/>
          <span style={{ 
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            From Screening to Offer Letter
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 780, margin: '0 auto' }}>
          Experience realistic 2-way AI Video Call Interviews with interactive 2D talking avatars, candidate camera stream, Monaco code studio, and real-time speech evaluation.
        </p>
      </div>

      {/* Setup Card */}
      <div className="glass-panel" style={{ 
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(13, 19, 33, 0.85)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Quick Presets */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.05rem', color: '#a5b4fc' }}>
                <Zap size={18} color="#818cf8" />
                Quick 1-Click Interview Presets
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Instant Pre-configured Tracks</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {PRESET_TEMPLATES.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setRole(preset.role);
                    setCustomRole('');
                    setLevel(preset.level);
                    setSelectedRound(preset.round);
                    setSelectedTech(preset.tech);
                  }}
                  className="secondary-btn"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    alignItems: 'flex-start',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>{preset.name}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>Round {preset.round}</span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{preset.level}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 0. Interview Experience Mode */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 14, fontSize: '1.1rem', color: '#fff' }}>
              <Sparkles size={19} color="#6366f1" />
              1. Choose Interview Experience Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              
              {/* 1. AI Video Call Mode (RECOMMENDED) */}
              <div
                onClick={() => setMode('video')}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: mode === 'video' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                  background: mode === 'video' 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(6, 182, 212, 0.18) 100%)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  boxShadow: mode === 'video' ? '0 0 30px rgba(99, 102, 241, 0.35)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: -10, right: 14 }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px', fontWeight: 800 }}>
                    🔥 RECOMMENDED
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      📹
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'block' }}>AI Video Call Interview</span>
                      <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: 600 }}>2D Avatar + Camera Live</span>
                    </div>
                  </div>
                  {mode === 'video' && <CheckCircle2 size={20} color="#818cf8" />}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Authentic video meeting room with responsive 2D animated avatar interviewer, candidate webcam streaming, closed captions, and live speech analysis.
                </p>
              </div>

              {/* 2. Virtual Voice AI Mode */}
              <div
                onClick={() => setMode('virtual')}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: mode === 'virtual' ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
                  background: mode === 'virtual' 
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(99, 102, 241, 0.12) 100%)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  boxShadow: mode === 'virtual' ? '0 0 25px rgba(6, 182, 212, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      🎙️
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'block' }}>Virtual Voice Interview</span>
                      <span style={{ fontSize: '0.72rem', color: '#67e8f9', fontWeight: 600 }}>Speech & Audio Only</span>
                    </div>
                  </div>
                  {mode === 'virtual' && <CheckCircle2 size={20} color="#22d3ee" />}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Voice recognition transcription, speech question narration, conversational follow-ups, and speaking clarity telemetry.
                </p>
              </div>

              {/* 3. Text Mode */}
              <div
                onClick={() => setMode('text')}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: mode === 'text' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                  background: mode === 'text' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  boxShadow: mode === 'text' ? '0 0 25px rgba(16, 185, 129, 0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      💻
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'block' }}>Standard Text Interview</span>
                      <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 600 }}>Markdown & Code Blocks</span>
                    </div>
                  </div>
                  {mode === 'text' && <CheckCircle2 size={20} color="#10b981" />}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Classic coding and architecture assessment with Markdown text input, code snippets, STAR format guidelines, and instant AI grading.
                </p>
              </div>

            </div>
          </div>

          {/* 2D AVATAR SELECTION & PREVIEW (When Video Mode Selected) */}
          {mode === 'video' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.06) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6, fontSize: '1rem', color: '#c7d2fe' }}>
                  <Users size={18} color="#818cf8" />
                  Select Your 2D AI Interviewer Character
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Each 2D interviewer features unique visual animations, facial expressions, and interview evaluation perspectives.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
              }}>
                {Object.values(AVATAR_CHARACTERS).map((char) => {
                  const isSelected = selectedAvatarId === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedAvatarId(char.id)}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(0, 0, 0, 0.3)',
                        border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 10,
                        boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Avatar2D
                        characterId={char.id}
                        state={isSelected ? 'speaking' : 'idle'}
                        size={120}
                        showStatusBadge={false}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                          {char.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 600 }}>
                          {char.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {char.tag}
                        </div>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        {char.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conditional Personality & Timer Configuration (For Video & Virtual Modes) */}
          {(mode === 'video' || mode === 'virtual') && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', 
              border: '1px solid rgba(99, 102, 241, 0.3)', 
              borderRadius: '18px', 
              padding: '20px' 
            }}>
              {/* Personality Picker */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 12, fontSize: '0.95rem', color: '#c7d2fe' }}>
                  <span>🎭</span> Select Interviewer Demeanor & Persona Tone
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {PERSONALITY_OPTIONS.map((p) => {
                    const isSelected = personality === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPersonality(p.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.08)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 0, 0, 0.25)',
                          boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.35)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '1.1rem' }}>{p.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                            {p.name}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timer Duration */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 10, fontSize: '0.95rem', color: '#c7d2fe' }}>
                  <Clock size={16} color="#818cf8" /> Countdown Timer Duration
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: durationMinutes === mins ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                        background: durationMinutes === mins ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(0, 0, 0, 0.35)',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⏱️ {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 1. Interview Stage / Round Selector */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 14, fontSize: '1.1rem', color: '#fff' }}>
              <Compass size={19} color="#6366f1" />
              2. Select Hiring Stage / Round
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {INTERVIEW_ROUNDS.map((rnd) => {
                const IconComponent = rnd.icon;
                const isSelected = selectedRound === rnd.roundNumber;
                return (
                  <div
                    key={rnd.roundNumber}
                    onClick={() => setSelectedRound(rnd.roundNumber)}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                      boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: isSelected ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                        padding: '5px 12px',
                        borderRadius: '8px'
                      }}>
                        <IconComponent size={16} color={isSelected ? '#c7d2fe' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#fff' : '#cbd5e1' }}>
                          STAGE {rnd.roundNumber}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 size={20} color="#818cf8" />}
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                      {rnd.title.split(': ')[1]}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {rnd.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Programming Language Selector */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem', color: '#c7d2fe' }}>
                <Code2 size={18} color="#818cf8" />
                Primary Coding Language (Monaco IDE)
              </label>
              <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
                ✓ In-Browser Sandbox Execution & Test Cases
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {CODING_LANGUAGES.map((lang) => {
                const isSelected = primaryLanguage === lang.id;
                return (
                  <div
                    key={lang.id}
                    onClick={() => setPrimaryLanguage(lang.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                      boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{lang.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                      {lang.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Target Role */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 14, fontSize: '1.1rem', color: '#fff' }}>
              <Briefcase size={19} color="#06b6d4" />
              3. Target Role & Experience Level
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {POPULAR_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setCustomRole(''); }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: role === r && !customRole ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
                    background: role === r && !customRole ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    color: role === r && !customRole ? '#22d3ee' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom role (e.g., Senior Distributed Systems Engineer, Staff SRE...)"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.35)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                marginBottom: 20
              }}
            />

            {/* Experience Level */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = level === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setLevel(lvl.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                        {lvl.label}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="#c084fc" />}
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{lvl.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Tech Stack Tags */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 14, fontSize: '1.1rem', color: '#fff' }}>
              <Code2 size={19} color="#a855f7" />
              4. Tech Stack & Evaluation Domains
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {TECH_SUGGESTIONS.map((tech) => {
                const isSelected = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? '#a855f7' : 'rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#e9d5ff' : 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '} {tech}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Add custom tech tag (press Enter)..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={addCustomTech}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 5. Question Count & Cost */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '18px 22px',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={20} color="var(--text-muted)" />
              <div>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.95rem' }}>
                  Round Length
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Questions in Round {selectedRound}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {[3, 5, 8].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: questionCount === cnt ? '#6366f1' : 'var(--border-subtle)',
                    background: questionCount === cnt ? '#6366f1' : 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={handleStart}
              disabled={loading}
              className="glow-btn"
              style={{
                width: '100%',
                padding: '16px 28px',
                fontSize: '1.15rem',
                borderRadius: '14px'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="wave-bar" style={{ height: 16 }} />
                  <div className="wave-bar" style={{ height: 22 }} />
                  <div className="wave-bar" style={{ height: 14 }} />
                  <span>Synthesizing Round {selectedRound} with AI...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Start Round {selectedRound}: {INTERVIEW_ROUNDS.find(r => r.roundNumber === selectedRound)?.title.split(': ')[1]}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Costs 10 Credits • Instant Generation • Audio Voice Narration & Speech-to-Text Ready
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
