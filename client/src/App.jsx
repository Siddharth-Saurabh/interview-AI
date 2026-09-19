import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import AuthPage from './components/AuthPage.jsx';
import InterviewSetup from './components/InterviewSetup.jsx';
import InterviewRoom from './components/InterviewRoom.jsx';
import VirtualInterviewRoom from './components/VirtualInterviewRoom.jsx';
import VideoInterviewRoom from './components/VideoInterviewRoom.jsx';
import AnswerFeedback from './components/AnswerFeedback.jsx';
import FinalReport from './components/FinalReport.jsx';
import HistoryAnalytics from './components/HistoryAnalytics.jsx';
import PricingModal from './components/PricingModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  // Global State
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' | 'history'
  const [sessionStage, setSessionStage] = useState('setup'); // 'setup' | 'in-progress' | 'feedback' | 'report'

  // Modals
  const [pricingOpen, setPricingOpen] = useState(false);

  // Interview Session Data
  const [currentInterviewId, setCurrentInterviewId] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [evaluations, setEvaluations] = useState([]);
  const [sessionAnalytics, setSessionAnalytics] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Loading flags
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Check stored authentication token on mount
  useEffect(() => {
    const verifyStoredAuth = async () => {
      const token = localStorage.getItem('interviewai_token');
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('interviewai_token');
            setUser(null);
          }
        } catch (e) {
          console.warn('Profile fetch check error:', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthChecking(false);
    };

    verifyStoredAuth();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    showToast(`Welcome, ${authenticatedUser.name || authenticatedUser.email}!`);
  };

  // Logout handler returns user to Login Screen
  const handleLogout = () => {
    localStorage.removeItem('interviewai_token');
    setUser(null);
    setSessionStage('setup');
    showToast('Logged out successfully.');
  };

  // 1. Start Interview Session
  const handleStartInterview = async (config) => {
    if (user && user.credits < 10) {
      setPricingOpen(true);
      showToast('You need at least 10 credits to start a new interview session.');
      return;
    }

    setLoading(true);
    setCurrentRound(config.roundNumber || 1);
    setCurrentConfig(config);

    try {
      const token = localStorage.getItem('interviewai_token');

      const res = await fetch(`${API_URL}/api/interview/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (data.success) {
        setInterviewData({
          ...data.data,
          interviewerGreeting: data.interviewerGreeting,
          mode: data.mode || config.mode,
          interviewerPersonality: data.interviewerPersonality || config.interviewerPersonality,
          durationMinutes: data.durationMinutes || config.durationMinutes
        });
        setCurrentInterviewId(data.interviewId);
        setCurrentQuestionIndex(0);
        setEvaluations([]);
        setSessionAnalytics(null);
        setCurrentFeedback(null);
        setSessionStage('in-progress');

        if (typeof data.remainingCredits === 'number') {
          setUser(prev => prev ? { ...prev, credits: data.remainingCredits } : null);
        }
        showToast(`Round ${config.roundNumber || 1} generated successfully with AI!`);
      } else {
        showToast(data.message || 'Failed to generate interview questions.');
      }
    } catch (e) {
      console.error('Error starting interview:', e);
      showToast('Network error generating interview session.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Advance to Next Round (Round 2 or Round 3)
  const handleAdvanceNextRound = (nextRoundNum) => {
    const roundTypes = {
      1: 'Technical',
      2: 'System Design',
      3: 'Behavioral'
    };

    const nextConfig = {
      ...(currentConfig || {
        role: 'Full Stack MERN Developer',
        level: 'Mid-Level',
        techStack: ['React', 'Node.js', 'MongoDB'],
        questionCount: 5,
        mode: 'virtual',
        interviewerPersonality: 'Professional',
        durationMinutes: 15
      }),
      roundNumber: nextRoundNum,
      interviewType: roundTypes[nextRoundNum] || 'Technical'
    };

    handleStartInterview(nextConfig);
  };

  // 3. Submit Question Answer
  const handleAnswerSubmit = async (answer, options = {}) => {
    setSubmitting(true);
    setCurrentAnswer(answer);
    try {
      const token = localStorage.getItem('interviewai_token');
      const currentQ = interviewData?.questions?.[currentQuestionIndex];

      const res = await fetch(`${API_URL}/api/interview/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          interviewId: currentInterviewId,
          questionIndex: currentQuestionIndex,
          question: currentQ?.question,
          userAnswer: answer,
          role: interviewData?.title,
          level: currentConfig?.level || 'Mid-Level',
          mode: currentConfig?.mode || 'text',
          interviewerPersonality: currentConfig?.interviewerPersonality || 'Professional',
          answerMode: options.answerMode || 'text',
          responseTime: options.responseTime || 0,
          answerDuration: options.answerDuration || 0,
          fillerWordCount: options.fillerWordCount || 0,
          wordCount: options.wordCount || answer.split(/\s+/).filter(Boolean).length
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentFeedback(data.feedback);
        setEvaluations(prev => [...prev, data.feedback]);
        if (data.analytics) {
          setSessionAnalytics(data.analytics);
        }
        setSessionStage('feedback');
      } else {
        showToast(data.message || 'Failed to evaluate answer.');
      }
    } catch (e) {
      console.error('Error evaluating answer:', e);
      showToast('Error getting answer feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Move to next question or show final scorecard
  const handleNextQuestion = () => {
    const totalQuestions = interviewData?.questions?.length || 0;
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentFeedback(null);
      setCurrentAnswer('');
      setSessionStage('in-progress');
    } else {
      setSessionStage('report');
    }
  };

  // 5. Retake / Reset session
  const handleResetInterview = () => {
    setSessionStage('setup');
    setInterviewData(null);
    setCurrentInterviewId(null);
    setCurrentQuestionIndex(0);
    setEvaluations([]);
    setSessionAnalytics(null);
    setCurrentFeedback(null);
  };

  // 6. Credit Top-up success
  const handleCreditSuccess = (creditsAdded) => {
    setUser(prev => prev ? { ...prev, credits: (prev.credits || 0) + creditsAdded } : null);
    showToast(`Successfully added ${creditsAdded} AI credits to your account!`);
  };

  // Initial loading splash
  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="wave-bar" style={{ display: 'inline-block', height: 24, margin: '0 4px' }} />
          <div className="wave-bar" style={{ display: 'inline-block', height: 34, margin: '0 4px' }} />
          <div className="wave-bar" style={{ display: 'inline-block', height: 20, margin: '0 4px' }} />
          <p style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading InterviewAI...</p>
        </div>
      </div>
    );
  }

  // IF NOT AUTHENTICATED: Display Full Login / Sign-Up Screen
  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        apiUrl={API_URL}
      />
    );
  }

  // IF AUTHENTICATED: Display Full Interview Dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#1e293b',
          border: '1px solid #6366f1',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          zIndex: 2000,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'interview' && sessionStage === 'report') {
            setSessionStage('setup');
          }
        }}
        onOpenPricing={() => setPricingOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'history' ? (
          <HistoryAnalytics user={user} apiUrl={API_URL} />
        ) : (
          <>
            {sessionStage === 'setup' && (
              <InterviewSetup
                onStartInterview={handleStartInterview}
                loading={loading}
                userCredits={user?.credits || 100}
                initialRound={currentRound}
              />
            )}

            {sessionStage === 'in-progress' && (
              currentConfig?.mode === 'video' ? (
                <VideoInterviewRoom
                  interviewData={interviewData}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={interviewData?.questions?.length || 5}
                  onAnswerSubmit={handleAnswerSubmit}
                  submitting={submitting}
                  onCancel={handleResetInterview}
                  personality={currentConfig?.interviewerPersonality || 'Professional'}
                  durationMinutes={currentConfig?.durationMinutes || 15}
                  onTimeExpired={() => setSessionStage('report')}
                  initialAvatarId={currentConfig?.avatarId || 'alex'}
                />
              ) : currentConfig?.mode === 'virtual' ? (
                <VirtualInterviewRoom
                  interviewData={interviewData}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={interviewData?.questions?.length || 5}
                  onAnswerSubmit={handleAnswerSubmit}
                  submitting={submitting}
                  onCancel={handleResetInterview}
                  personality={currentConfig?.interviewerPersonality || 'Professional'}
                  durationMinutes={currentConfig?.durationMinutes || 15}
                  onTimeExpired={() => setSessionStage('report')}
                />
              ) : (
                <InterviewRoom
                  interviewData={interviewData}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={interviewData?.questions?.length || 5}
                  onAnswerSubmit={handleAnswerSubmit}
                  submitting={submitting}
                  onCancel={handleResetInterview}
                />
              )
            )}

            {sessionStage === 'feedback' && (
              <AnswerFeedback
                feedback={currentFeedback}
                question={interviewData?.questions?.[currentQuestionIndex]?.question}
                userAnswer={currentAnswer}
                onNextQuestion={handleNextQuestion}
                isLastQuestion={currentQuestionIndex + 1 >= (interviewData?.questions?.length || 0)}
              />
            )}

            {sessionStage === 'report' && (
              <FinalReport
                interviewData={interviewData}
                evaluations={evaluations}
                sessionAnalytics={sessionAnalytics}
                currentConfig={currentConfig}
                currentRound={currentRound}
                onRetake={handleResetInterview}
                onAdvanceNextRound={handleAdvanceNextRound}
                onGoHome={() => {
                  setSessionStage('setup');
                  setActiveTab('interview');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Pricing / Recharge Credits Modal */}
      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onCreditSuccess={handleCreditSuccess}
        apiUrl={API_URL}
        user={user}
      />

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        marginTop: 'auto'
      }}>
        <p>InterviewAI • Production MERN Stack AI Mock Interview Platform • Powered by OpenRouter & Firebase</p>
      </footer>

    </div>
  );
}
