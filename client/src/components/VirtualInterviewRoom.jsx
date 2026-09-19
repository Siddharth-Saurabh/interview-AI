import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Lightbulb, 
  Send, 
  Clock, 
  Bot, 
  RotateCcw, 
  Sparkles, 
  FileCode, 
  ListOrdered, 
  AlertCircle, 
  HelpCircle, 
  MessageSquare, 
  Zap, 
  Activity, 
  UserCheck, 
  Flame, 
  CheckCircle2, 
  Sliders, 
  Keyboard,
  Video,
  VideoOff,
  Camera,
  Code2
} from 'lucide-react';
import CodeEditor from './CodeEditor.jsx';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useTextToSpeech } from '../hooks/useTextToSpeech.js';
import { soundFX } from '../utils/soundEffects.js';

// Common verbal filler words for speaking clarity analytics
const COMMON_FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of', 'literally'];

const countFillerWords = (text) => {
  if (!text) return 0;
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(w => COMMON_FILLER_WORDS.includes(w.replace(/[^a-z]/g, ''))).length;
};

// Authoritative Interview States
const INTERVIEW_STATES = {
  INITIALIZING: 'INITIALIZING',
  AI_SPEAKING: 'AI_SPEAKING',
  READY: 'READY',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  EVALUATING: 'EVALUATING',
  SHOWING_FOLLOWUP: 'SHOWING_FOLLOWUP',
  COMPLETED: 'COMPLETED'
};

export default function VirtualInterviewRoom({
  interviewData,
  currentQuestionIndex,
  totalQuestions,
  onAnswerSubmit,
  submitting,
  onCancel,
  personality = 'Professional',
  durationMinutes = 15,
  onTimeExpired
}) {
  const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || {};
  const isCodingQuestion = currentQuestion.type === 'coding';
  const [interviewState, setInterviewState] = useState(INTERVIEW_STATES.INITIALIZING);
  const [inputMode, setInputMode] = useState(isCodingQuestion ? 'code' : 'voice'); // 'voice' | 'text' | 'code'
  const [codeAnswer, setCodeAnswer] = useState(currentQuestion.starterCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState(currentQuestion.language || 'javascript');
  const [showHint, setShowHint] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  // Time management (countdown)
  const initialSeconds = (durationMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [speakingDuration, setSpeakingDuration] = useState(0);
  const isTimeExpiredRef = useRef(false);

  // STT Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    supported: speechSupported,
    permissionDenied,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  } = useSpeechRecognition();

  // TTS Hook
  const {
    isSpeaking,
    supported: ttsSupported,
    speak,
    stop: stopSpeaking,
    replay
  } = useTextToSpeech();

  // Track active speaking timer
  useEffect(() => {
    let interval = null;
    if (isListening) {
      interval = setInterval(() => {
        setSpeakingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Camera Mirror Preview State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera preview not accessible:', err);
      }
    }
  };

  // Ensure camera streams stop on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element when camera becomes active
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Overall Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isTimeExpiredRef.current) {
            isTimeExpiredRef.current = true;
            handleTimerComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Idempotent Timer Completion Handler
  const handleTimerComplete = useCallback(() => {
    stopSpeaking();
    stopListening();
    setInterviewState(INTERVIEW_STATES.COMPLETED);
    if (onTimeExpired) {
      onTimeExpired(transcript.trim());
    } else if (transcript.trim()) {
      handleSubmitAnswer(transcript.trim());
    }
  }, [stopSpeaking, stopListening, transcript, onTimeExpired]);

  // Handle Question Changes & AI Greeting on Mount
  useEffect(() => {
    resetTranscript();
    setSpeakingDuration(0);
    setQuestionStartTime(Date.now());
    setShowHint(false);

    // Initial Greeting or Question Narration
    const greetingText = interviewData?.interviewerGreeting || "Hello! Let's begin your technical interview session.";
    const questionText = currentQuestion?.question || '';

    if (!hasGreeted && currentQuestionIndex === 0) {
      setHasGreeted(true);
      setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
      speak(`${greetingText} First question: ${questionText}`, {
        personality,
        onEnd: () => setInterviewState(INTERVIEW_STATES.READY)
      });
    } else if (questionText) {
      setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
      speak(questionText, {
        personality,
        onEnd: () => setInterviewState(INTERVIEW_STATES.READY)
      });
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [currentQuestionIndex]);

  // Sync state with STT & TTS
  useEffect(() => {
    if (isSpeaking) {
      setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
    } else if (isListening) {
      setInterviewState(INTERVIEW_STATES.LISTENING);
    } else if (submitting) {
      setInterviewState(INTERVIEW_STATES.EVALUATING);
    } else if (interviewState === INTERVIEW_STATES.AI_SPEAKING && !isSpeaking) {
      setInterviewState(INTERVIEW_STATES.READY);
    }
  }, [isSpeaking, isListening, submitting]);

  // Voice Toggle Trigger
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      soundFX.playMicStop();
      stopListening();
      setInterviewState(INTERVIEW_STATES.READY);
    } else {
      soundFX.playMicStart();
      startListening();
      setInterviewState(INTERVIEW_STATES.LISTENING);
    }
  };

  // Replay Question
  const handleReplayQuestion = () => {
    if (isListening) {
      stopListening();
    }
    const qText = currentQuestion?.question || '';
    if (qText) {
      setInterviewState(INTERVIEW_STATES.AI_SPEAKING);
      speak(qText, {
        personality,
        onEnd: () => setInterviewState(INTERVIEW_STATES.READY)
      });
    }
  };

  // Insert STAR Framework
  const insertStarTemplate = () => {
    const template = `**Situation:** [Describe the context]\n**Task:** [What was required?]\n**Action:** [Engineering steps taken]\n**Result:** [Impact, metrics & trade-offs]`;
    setTranscript(prev => (prev ? `${prev}\n\n${template}` : template));
  };

  // Insert Code Snippet
  const insertCodeTemplate = () => {
    const template = `\`\`\`javascript\n// Solution Architecture\nfunction solve() {\n  // Implementation\n}\n\`\`\``;
    setTranscript(prev => (prev ? `${prev}\n\n${template}` : template));
  };

  // Keyboard Shortcuts (Ctrl+Enter to submit, Alt+R to replay, Alt+H for hint)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleReplayQuestion();
      } else if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowHint(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transcript, submitting, currentQuestion]);

  // Handle Submission
  const handleSubmitAnswer = (answerToSubmit) => {
    const finalAnswer = (answerToSubmit || (inputMode === 'code' ? codeAnswer : transcript)).trim();
    if (!finalAnswer) return;

    soundFX.playSuccessChime();
    stopSpeaking();
    stopListening();
    setInterviewState(INTERVIEW_STATES.EVALUATING);

    const elapsedTotalSeconds = Math.round((Date.now() - questionStartTime) / 1000);
    const fillerCount = inputMode === 'code' ? 0 : countFillerWords(finalAnswer);
    const wordCnt = finalAnswer.split(/\s+/).filter(Boolean).length;

    onAnswerSubmit(finalAnswer, {
      answerMode: inputMode === 'code' ? 'code' : (inputMode === 'voice' && isListening ? 'voice' : 'text'),
      language: selectedLanguage,
      codeSolution: inputMode === 'code' ? codeAnswer : '',
      responseTime: elapsedTotalSeconds,
      answerDuration: speakingDuration || elapsedTotalSeconds,
      fillerWordCount: fillerCount,
      wordCount: wordCnt
    });
  };

  // Format Timer mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const isTimeLow = secondsRemaining < 180; // less than 3 mins
  const currentFillerWords = countFillerWords(transcript);
  const currentWordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Top Header Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 20, 
        flexWrap: 'wrap', 
        gap: 12 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span className="badge badge-cyan">
            {currentQuestion.category || 'Core Technical'}
          </span>
          <span className="badge badge-amber">
            {currentQuestion.difficulty || 'Medium'}
          </span>
        </div>

        {/* Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: isTimeLow ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${isTimeLow ? '#f43f5e' : 'var(--border-subtle)'}`,
            padding: '6px 14px',
            borderRadius: '10px',
            color: isTimeLow ? '#fb7185' : '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <Clock size={15} color={isTimeLow ? "#f43f5e" : "#6366f1"} />
            <span>{formatTimer(secondsRemaining)} remaining</span>
          </div>

          <button 
            onClick={onCancel}
            className="secondary-btn"
            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        height: 6, 
        background: 'rgba(255, 255, 255, 0.08)', 
        borderRadius: 3, 
        marginBottom: 24,
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${progressPercentage}%`, 
          height: '100%', 
          background: 'linear-gradient(to right, #6366f1, #06b6d4)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* AI INTERVIEWER CARD WITH AVATAR & SPEECH BUBBLE */}
      <div className="glass-panel" style={{ 
        padding: '32px 38px', 
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        border: isSpeaking ? '1px solid rgba(6, 182, 212, 0.6)' : isListening ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isSpeaking 
          ? '0 0 30px rgba(6, 182, 212, 0.2)' 
          : isListening 
          ? '0 0 30px rgba(244, 63, 94, 0.15)' 
          : 'var(--shadow-card)',
        background: 'rgba(12, 17, 30, 0.85)'
      }}>
        
        {/* Avatar & Persona Status Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 22, 
          flexWrap: 'wrap', 
          gap: 14 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            
            {/* Interactive Animated AI Avatar */}
            <div style={{ 
              position: 'relative',
              width: 62, 
              height: 62, 
              borderRadius: '18px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isSpeaking 
                ? '0 0 28px rgba(6, 182, 212, 0.7)' 
                : '0 0 18px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.3s ease'
            }}>
              <Bot size={32} color="#fff" />

              {/* Pulsing Voice Waveform Overlay when Speaking */}
              {isSpeaking && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: -10, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 3, 
                  background: 'rgba(7, 9, 14, 0.95)',
                  border: '1px solid #06b6d4',
                  padding: '3px 8px',
                  borderRadius: 8,
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)'
                }}>
                  <div className="wave-bar" style={{ height: 12 }} />
                  <div className="wave-bar" style={{ height: 20 }} />
                  <div className="wave-bar" style={{ height: 14 }} />
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  AI Lead Interviewer
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>
                  🎭 {personality}
                </span>
              </div>

              {/* State Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                {isSpeaking ? (
                  <span style={{ fontSize: '0.84rem', color: '#22d3ee', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Activity size={15} className="pulse-glow" /> 🔊 Speaking question aloud...
                  </span>
                ) : isListening ? (
                  <span style={{ fontSize: '0.84rem', color: '#fb7185', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mic size={15} className="pulse-glow" /> 🎤 Listening to your answer...
                  </span>
                ) : submitting ? (
                  <span style={{ fontSize: '0.84rem', color: '#c084fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={15} className="spin-icon" /> 🧠 AI evaluating response...
                  </span>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Ready for candidate response
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Audio & Video Controls */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={toggleCamera}
              className="secondary-btn"
              style={{ 
                padding: '9px 14px', 
                borderRadius: '12px',
                border: cameraActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: cameraActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: cameraActive ? '#6ee7b7' : 'var(--text-muted)'
              }}
              title={cameraActive ? "Turn Off Camera Mirror" : "Turn On Camera Mirror"}
            >
              {cameraActive ? <Video size={17} color="#34d399" /> : <VideoOff size={17} />}
              <span style={{ fontSize: '0.85rem' }}>{cameraActive ? 'Camera On' : 'Camera'}</span>
            </button>

            <button 
              type="button"
              onClick={isSpeaking ? stopSpeaking : handleReplayQuestion}
              className="secondary-btn"
              style={{ 
                padding: '9px 14px', 
                borderRadius: '12px',
                border: isSpeaking ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
              title={isSpeaking ? "Stop Audio" : "Replay Question Aloud"}
            >
              {isSpeaking ? <VolumeX size={17} color="#f43f5e" /> : <Volume2 size={17} color="#818cf8" />}
              <span style={{ fontSize: '0.85rem' }}>{isSpeaking ? 'Stop Speech' : 'Replay'}</span>
            </button>
          </div>
        </div>

        {/* Live Camera Mirror PIP Box (If Camera Active) */}
        {cameraActive && (
          <div style={{ 
            marginBottom: 20, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 14,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '14px',
            padding: '12px 16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: 140,
              height: 95,
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#000',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              position: 'relative',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <span style={{
                position: 'absolute',
                bottom: 4,
                left: 6,
                fontSize: '0.62rem',
                background: 'rgba(0, 0, 0, 0.75)',
                color: '#6ee7b7',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                YOU (MIRROR)
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                Candidate Video Feed Active
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Self-preview for posture and eye contact practice. Video stays 100% local on your browser and is never recorded or uploaded.
              </p>
            </div>
          </div>
        )}

        {/* Question Text Box */}
        <div style={{ 
          background: 'rgba(5, 8, 16, 0.85)', 
          borderLeft: '4px solid #6366f1',
          borderRadius: '0 14px 14px 0',
          padding: '24px 28px',
          marginBottom: 20
        }}>
          <h2 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 600, 
            lineHeight: 1.6,
            color: '#f8fafc' 
          }}>
            {currentQuestion.question || 'Synthesizing technical question...'}
          </h2>
        </div>

        {/* Hint Accordion */}
        {currentQuestion.hint && (
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fbbf24',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Lightbulb size={16} />
              {showHint ? 'Hide Guidance Hint' : 'Need a hint? (Does not affect evaluation)'}
            </button>
            {showHint && (
              <div style={{ 
                marginTop: 12,
                padding: '14px 18px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                fontSize: '0.88rem',
                color: '#fde68a',
                lineHeight: 1.5
              }}>
                💡 <strong>Hint:</strong> {currentQuestion.hint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CANDIDATE WORKSPACE & VOICE TRANSCRIPTION */}
      <div className="glass-panel" style={{ 
        padding: '30px 36px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(12, 17, 30, 0.85)'
      }}>
        
        {/* Input Mode Selector & Action Tools */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: inputMode === 'voice' ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                background: inputMode === 'voice' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: inputMode === 'voice' ? '#a5b4fc' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Mic size={16} />
              <span>Voice Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('code')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: inputMode === 'code' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                background: inputMode === 'code' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: inputMode === 'code' ? '#6ee7b7' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Code2 size={16} />
              <span>Monaco Code IDE</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('text')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: inputMode === 'text' ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
                background: inputMode === 'text' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                color: inputMode === 'text' ? '#67e8f9' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Keyboard size={16} />
              <span>Text Fallback</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={insertStarTemplate}
              className="secondary-btn"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              <ListOrdered size={14} />
              <span>+ STAR Template</span>
            </button>

            <button
              type="button"
              onClick={insertCodeTemplate}
              className="secondary-btn"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
            >
              <FileCode size={14} />
              <span>+ Code Block</span>
            </button>
          </div>
        </div>

        {/* Code Editor Workspace (If Code Mode) */}
        {inputMode === 'code' && (
          <div style={{ marginBottom: 20 }}>
            <CodeEditor
              code={codeAnswer}
              onChange={setCodeAnswer}
              language={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              starterCode={currentQuestion.starterCode || ''}
              testCases={currentQuestion.testCases || []}
              height="440px"
            />
          </div>
        )}

        {/* Big Microphone Recording Section (If Voice Mode) */}
        {inputMode === 'voice' && (
          <div style={{
            background: isListening 
              ? 'radial-gradient(circle, rgba(244, 63, 94, 0.18) 0%, rgba(10, 13, 20, 0.7) 100%)' 
              : 'rgba(5, 8, 16, 0.6)',
            border: `1px solid ${isListening ? '#f43f5e' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '18px',
            padding: '28px 24px',
            textAlign: 'center',
            marginBottom: 20,
            transition: 'all 0.3s ease'
          }}>
            <button
              type="button"
              onClick={handleToggleVoice}
              style={{
                width: 82,
                height: 82,
                borderRadius: '50%',
                border: 'none',
                background: isListening 
                  ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' 
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening 
                  ? '0 0 35px rgba(244, 63, 94, 0.75)' 
                  : '0 4px 22px rgba(99, 102, 241, 0.45)',
                transform: isListening ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.25s ease'
              }}
            >
              {isListening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: isListening ? '#fb7185' : '#fff' }}>
                {isListening ? '🎙️ Microphone Active — Speak your answer now' : 'Click Microphone to Answer with Voice'}
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {isListening 
                  ? `Recording in progress (${speakingDuration}s)... Click again when finished speaking.` 
                  : 'Speech is converted to text in real-time. You can edit the text transcript anytime before submitting.'}
              </p>
            </div>

            {/* Permission or Error notice */}
            {permissionDenied && (
              <div style={{ marginTop: 12, color: '#fb7185', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertCircle size={15} />
                <span>Microphone access was denied. Please switch to Text Fallback mode above.</span>
              </div>
            )}
          </div>
        )}

        {/* Live Transcript / Text Editor Workspace (If voice or text mode) */}
        {inputMode !== 'code' && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              {inputMode === 'voice' ? 'Live Transcribed Answer (Editable):' : 'Candidate Written Solution:'}
            </label>
            <textarea
              rows={7}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={inputMode === 'voice' 
                ? "Your spoken response will appear here in real-time as you speak into the microphone..."
                : "Type your structured response, system trade-offs, or architectural decisions here..."}
              style={{
                width: '100%',
                background: 'rgba(5, 8, 16, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px 20px',
                color: '#fff',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-main)',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            {interimTranscript && (
              <div style={{ 
                padding: '6px 14px', 
                fontSize: '0.85rem', 
                color: '#22d3ee', 
                fontStyle: 'italic',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '6px',
                marginTop: 4
              }}>
                🎙️ <em>Transcribing: {interimTranscript}</em>
              </div>
            )}
          </div>
        )}

        {/* Real-time Voice & Clarity Metrics Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '10px 18px',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>📝 <strong>{inputMode === 'code' ? codeAnswer.split(/\s+/).filter(Boolean).length : currentWordCount}</strong> words</span>
            <span>⏱️ <strong>{speakingDuration}s</strong> voice speaking</span>
            <span>⚡ <strong>{currentFillerWords}</strong> verbal fillers detected</span>
          </div>

          <button
            type="button"
            onClick={resetTranscript}
            className="secondary-btn"
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
            disabled={!transcript}
          >
            <RotateCcw size={13} />
            <span>Clear Answer</span>
          </button>
        </div>

        {/* Submit Action Button & Shortcuts Helper */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Shortcuts:</span>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Ctrl + Enter: Submit</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Alt + R: Replay</span>
            <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Alt + H: Hint</span>
          </div>

          <button
            type="button"
            onClick={() => handleSubmitAnswer()}
            disabled={submitting || !transcript.trim()}
            className="glow-btn"
            style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} className="pulse-glow" />
                <span>AI Evaluating Answer & Generating Follow-up...</span>
              </div>
            ) : (
              <>
                <span>Submit Answer for AI Review</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
