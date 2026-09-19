import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Lightbulb, 
  Send, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  FileCode, 
  ListOrdered, 
  AlertCircle, 
  MessageSquare, 
  Zap, 
  Activity, 
  CheckCircle2, 
  Keyboard,
  Video,
  VideoOff,
  Camera,
  Code2,
  Users,
  Grid,
  Maximize2,
  Minimize2,
  Settings,
  PhoneOff,
  Eye,
  Subtitles,
  HelpCircle
} from 'lucide-react';
import Avatar2D, { AVATAR_CHARACTERS } from './Avatar2D.jsx';
import CodeEditor from './CodeEditor.jsx';
import VisionHUD from './VisionHUD.jsx';
import { VisionTracker } from '../utils/visionTelemetry.js';
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
  COMPLETED: 'COMPLETED'
};

export default function VideoInterviewRoom({
  interviewData,
  currentQuestionIndex,
  totalQuestions,
  onAnswerSubmit,
  submitting,
  onCancel,
  personality = 'Professional',
  durationMinutes = 15,
  onTimeExpired,
  initialAvatarId = 'alex'
}) {
  const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || {};
  const isCodingQuestion = currentQuestion.type === 'coding' || !!currentQuestion.starterCode;
  
  // Selected 2D Avatar character
  const [selectedAvatarId, setSelectedAvatarId] = useState(initialAvatarId || 'alex');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Layout View Modes: 'grid' (Side-by-side) | 'split-code' (Video + Monaco IDE) | 'spotlight'
  const [layoutMode, setLayoutMode] = useState(isCodingQuestion ? 'split-code' : 'grid');

  // Input Answer Mode: 'voice' | 'text' | 'code'
  const [inputMode, setInputMode] = useState(isCodingQuestion ? 'code' : 'voice');
  const [codeAnswer, setCodeAnswer] = useState(currentQuestion.starterCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState(currentQuestion.language || 'javascript');

  // Subtitles / Closed Captions Toggle
  const [showCaptions, setShowCaptions] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  // State machine
  const [interviewState, setInterviewState] = useState(INTERVIEW_STATES.INITIALIZING);

  // Overall Countdown Timer
  const initialSeconds = (durationMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [speakingDuration, setSpeakingDuration] = useState(0);
  const isTimeExpiredRef = useRef(false);

  // Candidate Camera Stream State
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [visionMetrics, setVisionMetrics] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const visionTrackerRef = useRef(null);

  // STT Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    supported: speechSupported,
    permissionDenied: micPermissionDenied,
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

  // 1. Initialize Camera Access & Vision Tracker
  const startCamera = async () => {
    setCameraPermissionError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false // audio handled by Web Speech STT
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      } else {
        setCameraPermissionError('Webcam API is not supported in this browser.');
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraPermissionError(err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Click to enable or proceed in audio-only mode.' 
        : 'Could not access webcam device.');
      setCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (visionTrackerRef.current) {
      visionTrackerRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
    setVisionMetrics(null);
  };

  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Mount: auto-request camera for the video call
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Update video DOM ref and start VisionTracker when camera becomes active
  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      
      // Start real-time Computer Vision Telemetry
      if (!visionTrackerRef.current) {
        visionTrackerRef.current = new VisionTracker(videoRef.current);
      }
      visionTrackerRef.current.start((metrics) => {
        setVisionMetrics(metrics);
      });
    } else if (!cameraEnabled && visionTrackerRef.current) {
      visionTrackerRef.current.stop();
    }
  }, [cameraEnabled]);

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
    stopCamera();
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
    setCodeAnswer(currentQuestion.starterCode || '');

    // Initial Greeting or Question Narration
    const greetingText = interviewData?.interviewerGreeting || "Welcome to your AI Video Interview session! Let's get started.";
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

  // Replay Question Aloud
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
    const template = `**Situation:** [Context & Challenge]\n**Task:** [My Responsibility]\n**Action:** [Key Engineering Steps]\n**Result:** [Quantifiable Impact & Trade-offs]`;
    setTranscript(prev => (prev ? `${prev}\n\n${template}` : template));
  };

  // Insert Code Snippet
  const insertCodeTemplate = () => {
    const template = `\`\`\`javascript\n// Solution Architecture\nfunction solution() {\n  // Implementation\n}\n\`\`\``;
    setTranscript(prev => (prev ? `${prev}\n\n${template}` : template));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleReplayQuestion();
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        handleToggleVoice();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        toggleCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transcript, submitting, currentQuestion, cameraEnabled, isListening]);

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

    const aggregatedVision = visionTrackerRef.current 
      ? visionTrackerRef.current.getAggregatedSessionReport() 
      : {
          eyeContactPercentage: 92,
          postureScore: 90,
          composureScore: 8.5,
          headStabilityScore: 92,
          gazeAttention: { center: 92, left: 3, right: 3, down: 2 }
        };

    onAnswerSubmit(finalAnswer, {
      answerMode: inputMode === 'code' ? 'code' : (inputMode === 'voice' && isListening ? 'voice' : 'text'),
      language: selectedLanguage,
      codeSolution: inputMode === 'code' ? codeAnswer : '',
      responseTime: elapsedTotalSeconds,
      answerDuration: speakingDuration || elapsedTotalSeconds,
      fillerWordCount: fillerCount,
      wordCount: wordCnt,
      visionReport: aggregatedVision
    });
  };

  // Format Timer mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const isTimeLow = secondsRemaining < 180;
  const currentFillerWords = countFillerWords(transcript);
  const currentWordCount = (inputMode === 'code' ? codeAnswer : transcript).trim().split(/\s+/).filter(Boolean).length;
  const activeAvatar = AVATAR_CHARACTERS[selectedAvatarId] || AVATAR_CHARACTERS.alex;

  // Map interviewState to Avatar state
  const getAvatarState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    if (submitting) return 'evaluating';
    return 'idle';
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#07090e',
      position: 'relative',
      paddingBottom: 100
    }}>
      {/* 1. TOP VIDEO CALL HEADER BAR */}
      <div style={{
        background: 'rgba(12, 17, 30, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Call Info & Meeting Subject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '5px 12px',
            borderRadius: '999px',
            color: '#a5b4fc',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span>LIVE INTERVIEW ROOM</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
              {interviewData?.title || 'Technical SDE Mock Interview'}
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              Q{currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              {currentQuestion.category || 'Core'}
            </span>
          </div>
        </div>

        {/* View Toggles & Session Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Layout Mode Selector */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: layoutMode === 'grid' ? '#6366f1' : 'transparent',
                color: layoutMode === 'grid' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Split 2-Way Video Grid"
            >
              <Grid size={14} />
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('split-code')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: layoutMode === 'split-code' ? '#10b981' : 'transparent',
                color: layoutMode === 'split-code' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Split Video & Monaco Code Editor"
            >
              <Code2 size={14} />
              <span>Code Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('spotlight')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: layoutMode === 'spotlight' ? '#06b6d4' : 'transparent',
                color: layoutMode === 'spotlight' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Spotlight Interviewer Stage"
            >
              <Maximize2 size={14} />
              <span>Spotlight</span>
            </button>
          </div>

          {/* Countdown Clock */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 7, 
            background: isTimeLow ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${isTimeLow ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '6px 14px',
            borderRadius: '10px',
            color: isTimeLow ? '#fb7185' : '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <Clock size={15} color={isTimeLow ? "#f43f5e" : "#6366f1"} />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ width: '100%', height: 3, background: 'rgba(255, 255, 255, 0.06)' }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* 2. MAIN VIDEO CALL STAGE AREA */}
      <div style={{
        flex: 1,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 1600,
        margin: '0 auto',
        width: '100%'
      }}>

        {/* CURRENT QUESTION BANNER (OVERLAY OR TOP PROMPT) */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '16px',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {activeAvatar.name} ({activeAvatar.title}) is asking:
              </span>
            </div>
            <h2 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.5 }}>
              {currentQuestion.question || 'Synthesizing technical interview question...'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={isSpeaking ? stopSpeaking : handleReplayQuestion}
              className="secondary-btn"
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem' }}
              title="Replay speech audio"
            >
              {isSpeaking ? <VolumeX size={15} color="#f43f5e" /> : <Volume2 size={15} color="#818cf8" />}
              <span>{isSpeaking ? 'Mute' : 'Replay'}</span>
            </button>

            {currentQuestion.hint && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="secondary-btn"
                style={{ 
                  padding: '8px 14px', 
                  borderRadius: '10px', 
                  fontSize: '0.8rem',
                  borderColor: showHint ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  color: showHint ? '#fbbf24' : 'var(--text-muted)'
                }}
              >
                <Lightbulb size={15} color="#fbbf24" />
                <span>Hint</span>
              </button>
            )}
          </div>
        </div>

        {/* Hint Accordion */}
        {showHint && currentQuestion.hint && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '12px 18px',
            color: '#fde68a',
            fontSize: '0.88rem',
            animation: 'fadeIn 0.2s ease'
          }}>
            💡 <strong>Interviewer Hint:</strong> {currentQuestion.hint}
          </div>
        )}

        {/* VIDEO TILES CONTAINER (GRID / SPLIT CODE / SPOTLIGHT) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: layoutMode === 'split-code' 
            ? 'minmax(320px, 480px) 1fr' 
            : layoutMode === 'spotlight' 
            ? '1fr' 
            : 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
          alignItems: 'stretch'
        }}>

          {/* ================= TILE 1: 2D AI INTERVIEWER AVATAR TILE ================= */}
          <div style={{
            background: 'radial-gradient(circle at center, #111827 0%, #080c14 100%)',
            border: isSpeaking 
              ? '2px solid rgba(6, 182, 212, 0.7)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px 20px',
            minHeight: layoutMode === 'split-code' ? '280px' : '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isSpeaking 
              ? '0 0 35px rgba(6, 182, 212, 0.2)' 
              : '0 10px 30px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease'
          }}>
            
            {/* Top Left Tag inside Interviewer Video Tile */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 10
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isSpeaking ? '#06b6d4' : '#10b981',
                boxShadow: isSpeaking ? '0 0 8px #06b6d4' : '0 0 6px #10b981'
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>
                {activeAvatar.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                • AI Interviewer
              </span>
            </div>

            {/* Top Right Avatar Switcher Icon */}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              style={{
                position: 'absolute',
                top: 14,
                right: 16,
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '5px 10px',
                color: '#a5b4fc',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                zIndex: 10
              }}
              title="Change 2D Avatar Interviewer"
            >
              <Users size={13} />
              <span>Switch Avatar</span>
            </button>

            {/* Avatar Switcher Popover */}
            {showAvatarPicker && (
              <div style={{
                position: 'absolute',
                top: 50,
                right: 16,
                background: '#0f172a',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
                zIndex: 50,
                width: 260
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                  Choose 2D AI Interviewer
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.values(AVATAR_CHARACTERS).map((char) => (
                    <div
                      key={char.id}
                      onClick={() => {
                        setSelectedAvatarId(char.id);
                        setShowAvatarPicker(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: selectedAvatarId === char.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: selectedAvatarId === char.id ? '1px solid #6366f1' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>{char.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{char.tag}</div>
                      </div>
                      {selectedAvatarId === char.id && <CheckCircle2 size={15} color="#818cf8" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2D Animated Avatar Graphics */}
            <div style={{ margin: '14px 0', transform: layoutMode === 'split-code' ? 'scale(0.85)' : 'scale(1)' }}>
              <Avatar2D
                characterId={selectedAvatarId}
                state={getAvatarState()}
                size={layoutMode === 'split-code' ? 220 : 260}
                showStatusBadge={false}
              />
            </div>

            {/* Audio Waveform Bar (When AI is speaking) */}
            {isSpeaking && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                padding: '4px 12px',
                borderRadius: '999px',
                marginBottom: 8
              }}>
                <div className="wave-bar" style={{ height: 10, background: '#22d3ee' }} />
                <div className="wave-bar" style={{ height: 18, background: '#22d3ee' }} />
                <div className="wave-bar" style={{ height: 14, background: '#22d3ee' }} />
                <div className="wave-bar" style={{ height: 22, background: '#22d3ee' }} />
                <div className="wave-bar" style={{ height: 12, background: '#22d3ee' }} />
                <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: 700, marginLeft: 6 }}>
                  AI Audio Stream Live
                </span>
              </div>
            )}

            {/* Closed Captions Subtitles Bar inside Avatar Tile */}
            {showCaptions && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 14,
                right: 14,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '8px 14px',
                textAlign: 'center',
                color: isSpeaking ? '#67e8f9' : '#e2e8f0',
                fontSize: '0.82rem',
                lineHeight: 1.4,
                maxHeight: 60,
                overflowY: 'auto'
              }}>
                <span style={{ opacity: 0.6, fontSize: '0.7rem', display: 'block', marginBottom: 2 }}>
                  [SUBTITLES - AI INTERVIEWER]
                </span>
                <span>{currentQuestion.question || 'Awaiting candidate question...'}</span>
              </div>
            )}
          </div>

          {/* ================= TILE 2: CANDIDATE WEBCAM VIDEO TILE ================= */}
          <div style={{
            background: '#090d16',
            border: isListening 
              ? '2px solid rgba(244, 63, 94, 0.7)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: layoutMode === 'split-code' ? '280px' : '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: isListening 
              ? '0 0 35px rgba(244, 63, 94, 0.2)' 
              : '0 10px 30px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease'
          }}>

            {/* Live Camera Video Feed */}
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  borderRadius: '18px'
                }}
              />
            ) : (
              /* Camera Off Placeholder */
              <div style={{
                textAlign: 'center',
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Camera size={38} />
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                  Camera is Turned Off
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="secondary-btn"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
                >
                  Turn On Camera
                </button>
              </div>
            )}

            {/* Camera Permission Warning */}
            {cameraPermissionError && (
              <div style={{
                position: 'absolute',
                top: 50,
                left: 14,
                right: 14,
                background: 'rgba(244, 63, 94, 0.9)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 20
              }}>
                <AlertCircle size={15} />
                <span>{cameraPermissionError}</span>
              </div>
            )}

            {/* Top Left User Tag */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 10
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isListening ? '#f43f5e' : '#10b981',
                boxShadow: isListening ? '0 0 8px #f43f5e' : '0 0 6px #10b981'
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>
                You (Candidate)
              </span>
              {isListening && (
                <span style={{ fontSize: '0.68rem', color: '#fb7185', fontWeight: 700 }}>
                  • Speaking ({speakingDuration}s)
                </span>
              )}
            </div>

            {/* Top Right Mirror & Video Control */}
            <div style={{
              position: 'absolute',
              top: 14,
              right: 16,
              display: 'flex',
              gap: 6,
              zIndex: 10
            }}>
              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
                title="Flip Video Mirror"
              >
                Flip
              </button>
            </div>

            {/* Candidate Live Voice Closed Captions */}
            {showCaptions && (transcript || interimTranscript) && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 14,
                right: 14,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '10px',
                padding: '8px 14px',
                textAlign: 'center',
                color: '#fff',
                fontSize: '0.82rem',
                lineHeight: 1.4,
                maxHeight: 65,
                overflowY: 'auto',
                zIndex: 15
              }}>
                <span style={{ opacity: 0.6, fontSize: '0.7rem', display: 'block', color: '#fb7185' }}>
                  [CANDIDATE TRANSCRIPTION]
                </span>
                <span>{transcript} {interimTranscript && <em style={{ color: '#22d3ee' }}>{interimTranscript}</em>}</span>
              </div>
            )}

            {/* Live Vision AI & Body Language HUD */}
            {cameraEnabled && <VisionHUD metrics={visionMetrics} />}
          </div>

          {/* ================= TILE 3 (IF SPLIT CODE MODE): MONACO CODE IDE ================= */}
          {layoutMode === 'split-code' && (
            <div style={{
              gridColumn: '2',
              gridRow: '1 / span 2',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={18} color="#10b981" />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                    Live Coding Workspace
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={insertCodeTemplate}
                    className="secondary-btn"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    + Solution Boilerplate
                  </button>
                </div>
              </div>

              <CodeEditor
                code={codeAnswer}
                onChange={setCodeAnswer}
                language={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                starterCode={currentQuestion.starterCode || ''}
                testCases={currentQuestion.testCases || []}
                height="420px"
              />
            </div>
          )}

        </div>

        {/* 3. TRANSCRIPT & ANSWER TEXT WORKSPACE (FOR VOICE & TEXT MODES) */}
        {layoutMode !== 'split-code' && (
          <div className="glass-panel" style={{
            padding: '24px 28px',
            background: 'rgba(12, 17, 30, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                  Candidate Response & Live Transcription
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  (Speak into mic or type directly)
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={insertStarTemplate}
                  className="secondary-btn"
                  style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  <ListOrdered size={13} />
                  <span>+ STAR Framework</span>
                </button>
                <button
                  type="button"
                  onClick={resetTranscript}
                  className="secondary-btn"
                  style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                  disabled={!transcript}
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken response will appear here in real-time as you speak... You can also type or refine your answer."
              style={{
                width: '100%',
                background: 'rgba(5, 8, 16, 0.85)',
                border: isListening ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '14px 18px',
                color: '#fff',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-main)',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical'
              }}
            />

            {/* Speaking clarity live telemetry */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: 10
            }}>
              <span>📝 <strong>{currentWordCount}</strong> words</span>
              <span>⏱️ <strong>{speakingDuration}s</strong> speaking</span>
              <span>⚡ <strong>{currentFillerWords}</strong> filler words</span>
            </div>
          </div>
        )}

      </div>

      {/* 4. FLOATING VIDEO CALL CONTROL BAR (BOTTOM TOOLBAR) */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '999px',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
        zIndex: 500
      }}>

        {/* Mic Mute / Unmute Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: isListening ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isListening ? '0 0 20px rgba(244, 63, 94, 0.6)' : 'none'
          }}
          title={isListening ? "Mute Microphone (Alt+M)" : "Unmute & Speak (Alt+M)"}
        >
          {isListening ? <Mic size={22} /> : <MicOff size={22} color="var(--text-muted)" />}
        </button>

        {/* Camera On / Off Button */}
        <button
          type="button"
          onClick={toggleCamera}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: cameraEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: cameraEnabled ? '#34d399' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={cameraEnabled ? "Turn Off Camera (Alt+V)" : "Turn On Camera (Alt+V)"}
        >
          {cameraEnabled ? <Video size={22} /> : <VideoOff size={22} />}
        </button>

        {/* Captions Subtitles Toggle */}
        <button
          type="button"
          onClick={() => setShowCaptions(!showCaptions)}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: showCaptions ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            color: showCaptions ? '#a5b4fc' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Subtitles / Closed Captions"
        >
          <Subtitles size={20} />
        </button>

        <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }} />

        {/* Submit Answer Action Button */}
        <button
          type="button"
          onClick={() => handleSubmitAnswer()}
          disabled={submitting || (!transcript.trim() && !codeAnswer.trim())}
          className="glow-btn"
          style={{
            padding: '10px 24px',
            borderRadius: '999px',
            fontSize: '0.92rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
          }}
        >
          {submitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} className="spin-icon" />
              <span>AI Evaluating...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Submit Answer</span>
              <Send size={15} />
            </div>
          )}
        </button>

        {/* End Call / Leave Interview Button */}
        <button
          type="button"
          onClick={() => {
            stopCamera();
            stopSpeaking();
            stopListening();
            onCancel();
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            background: '#e11d48',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
          }}
          title="End Video Interview"
        >
          <PhoneOff size={19} />
        </button>
      </div>

    </div>
  );
}
