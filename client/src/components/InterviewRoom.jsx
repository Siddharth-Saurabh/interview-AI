import React, { useState, useEffect, useRef } from 'react';
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
  Code2,
  FileText,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
import CodeEditor from './CodeEditor.jsx';

export default function InterviewRoom({ 
  interviewData, 
  onAnswerSubmit, 
  submitting, 
  currentQuestionIndex, 
  totalQuestions,
  onCancel
}) {
  const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || {};
  const isCodingQuestion = currentQuestion.type === 'coding';

  const [workspaceMode, setWorkspaceMode] = useState(isCodingQuestion ? 'code' : 'text'); // 'text' | 'code'
  const [userAnswer, setUserAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(currentQuestion.language || 'javascript');
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const recognitionRef = useRef(null);

  // Reset state when moving to new question
  useEffect(() => {
    const isCoding = currentQuestion.type === 'coding';
    setWorkspaceMode(isCoding ? 'code' : 'text');
    setUserAnswer('');
    setCodeAnswer(currentQuestion.starterCode || '');
    setSelectedLanguage(currentQuestion.language || 'javascript');
    setShowHint(false);
    setSecondsElapsed(0);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestionIndex, currentQuestion]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Audio Narration via Web Speech Synthesis
  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utteranceText = currentQuestion.description || currentQuestion.question || '';
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Voice Input Recording
  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Voice start error:', e);
      }
    }
  };

  // Insert STAR Framework Template
  const insertStarTemplate = () => {
    const template = `**Situation:** [Describe the context and background]\n**Task:** [What was your specific responsibility?]\n**Action:** [Detailed technical/engineering actions you took]\n**Result:** [Quantifiable outcomes, metrics, and key learnings]`;
    setUserAnswer((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  // Insert Code Snippet Template
  const insertCodeTemplate = () => {
    const template = `\`\`\`javascript\n// Solution Walkthrough\nfunction solution() {\n  // 1. Edge case handling\n  // 2. Core implementation\n  // Time Complexity: O(N) | Space Complexity: O(1)\n}\n\`\`\``;
    setUserAnswer((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const submission = workspaceMode === 'code' ? codeAnswer : userAnswer;
    if (!submission || !submission.trim()) return;

    onAnswerSubmit(submission, {
      answerMode: workspaceMode === 'code' ? 'code' : (isListening ? 'voice' : 'text'),
      language: selectedLanguage,
      codeSolution: workspaceMode === 'code' ? codeAnswer : '',
      responseTime: secondsElapsed
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Top Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="badge badge-primary">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          {currentQuestion.type === 'coding' && (
            <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              ⚡ Live Coding Challenge
            </div>
          )}
          {currentQuestion.category && (
            <div className="badge badge-cyan">
              {currentQuestion.category}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem' 
          }}>
            <Clock size={16} color="#6366f1" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <button 
            onClick={onCancel}
            className="secondary-btn"
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            End Session
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
          background: 'linear-gradient(to right, #6366f1, #06b6d4, #10b981)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Mode Switcher Tabs (Code Editor vs. Text Response) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: 4
        }}>
          <button
            type="button"
            onClick={() => setWorkspaceMode('code')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: workspaceMode === 'code' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: workspaceMode === 'code' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Code2 size={16} />
            <span>Monaco Code IDE</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('text')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: workspaceMode === 'text' ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'transparent',
              color: workspaceMode === 'text' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText size={16} />
            <span>Written Architecture / STAR</span>
          </button>
        </div>

        {/* Read Aloud Button */}
        <button 
          type="button"
          onClick={speakQuestion}
          className="secondary-btn"
          style={{ padding: '8px 14px', borderRadius: '10px' }}
          title={isSpeaking ? "Stop Speaking" : "Listen to question"}
        >
          {isSpeaking ? <VolumeX size={18} color="#f43f5e" /> : <Volume2 size={18} color="#818cf8" />}
          <span style={{ fontSize: '0.85rem' }}>{isSpeaking ? 'Stop Audio' : 'Hear Problem Statement'}</span>
        </button>
      </div>

      {/* Main Interview Grid (Split Pane for Coding Mode or Single Column) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: workspaceMode === 'code' ? 'minmax(320px, 1fr) minmax(450px, 1.4fr)' : '1fr',
        gap: 24,
        alignItems: 'start'
      }}>
        
        {/* Left Pane: Question Description, Examples, Constraints & Hints */}
        <div className="glass-panel" style={{ padding: '28px 30px' }}>
          
          {/* AI Interviewer Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Bot size={22} color="#fff" />
              {isSpeaking && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: -6, 
                  display: 'flex', 
                  gap: 2, 
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 4px',
                  borderRadius: 4
                }}>
                  <div className="wave-bar" style={{ height: 8 }} />
                  <div className="wave-bar" style={{ height: 12 }} />
                  <div className="wave-bar" style={{ height: 6 }} />
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                {currentQuestion.title || 'Technical Challenge'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: isSpeaking ? '#22d3ee' : 'var(--text-muted)' }}>
                {isSpeaking ? 'Narrating problem aloud...' : 'AI Lead Evaluator'}
              </span>
            </div>
          </div>

          {/* Problem Statement */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            borderLeft: '4px solid #6366f1',
            borderRadius: '0 12px 12px 0',
            padding: '16px 20px',
            marginBottom: 20
          }}>
            <h2 style={{ 
              fontSize: '1.15rem', 
              fontWeight: 600, 
              lineHeight: 1.55,
              color: '#f8fafc',
              whiteSpace: 'pre-wrap'
            }}>
              {currentQuestion.description || currentQuestion.question || 'Preparing challenge...'}
            </h2>
          </div>

          {/* Input / Output Examples (If present) */}
          {currentQuestion.examples && currentQuestion.examples.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Examples:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentQuestion.examples.map((ex, i) => (
                  <div key={i} style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '0.84rem'
                  }}>
                    <div style={{ color: '#8b949e', marginBottom: 3 }}>
                      <strong>Input:</strong> <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>{ex.input}</code>
                    </div>
                    <div style={{ color: '#8b949e', marginBottom: 3 }}>
                      <strong>Output:</strong> <code style={{ color: '#34d399', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>{ex.output}</code>
                    </div>
                    {ex.explanation && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                        <em>Explanation:</em> {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints (If present) */}
          {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Constraints & Big-O Targets:
              </h4>
              <ul style={{ paddingLeft: 18, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {currentQuestion.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hint Accordion */}
          {currentQuestion.hint && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Lightbulb size={16} />
                {showHint ? 'Hide Guidance Hint' : "Need a hint? (Won't affect score)"}
              </button>
              {showHint && (
                <div style={{ 
                  marginTop: 10,
                  padding: '12px 16px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#fde68a'
                }}>
                  💡 <strong>Hint:</strong> {currentQuestion.hint}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Pane: Code Editor OR Written Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {workspaceMode === 'code' ? (
            <div>
              <CodeEditor
                code={codeAnswer}
                onChange={setCodeAnswer}
                language={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                starterCode={currentQuestion.starterCode || ''}
                testCases={currentQuestion.testCases || []}
                height="480px"
              />

              {/* Submit Code Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !codeAnswer.trim()}
                  className="glow-btn"
                  style={{ padding: '14px 32px', fontSize: '1.02rem', borderRadius: '12px' }}
                >
                  {submitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={18} className="pulse-glow" />
                      <span>Evaluating Code & Big-O Complexity with AI...</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Solution for AI Evaluation</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '24px 28px' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    Your Solution Architecture & Written Explanation:
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={insertStarTemplate}
                      className="secondary-btn"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                      title="Insert Situation, Task, Action, Result framework"
                    >
                      <ListOrdered size={13} />
                      <span>+ STAR Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={insertCodeTemplate}
                      className="secondary-btn"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                      title="Insert code snippet template"
                    >
                      <FileCode size={13} />
                      <span>+ Code Block</span>
                    </button>

                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isListening ? '#f43f5e' : 'var(--border-subtle)',
                          background: isListening ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: isListening ? '#fb7185' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isListening ? (
                          <>
                            <MicOff size={15} />
                            <span>Recording Voice...</span>
                          </>
                        ) : (
                          <>
                            <Mic size={15} />
                            <span>Answer with Voice</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={12}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your structured explanation here. Describe algorithm trade-offs, state management, or edge cases..."
                    style={{
                      width: '100%',
                      background: 'rgba(5, 8, 16, 0.8)',
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
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 12, 
                    right: 16, 
                    fontSize: '0.75rem', 
                    color: 'var(--text-dim)' 
                  }}>
                    {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {/* Action Row */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginTop: 20,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <button
                    type="button"
                    onClick={() => setUserAnswer('')}
                    className="secondary-btn"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    disabled={!userAnswer}
                  >
                    <RotateCcw size={15} />
                    Clear Input
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !userAnswer.trim()}
                    className="glow-btn"
                    style={{ padding: '12px 28px', fontSize: '1rem' }}
                  >
                    {submitting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={18} className="pulse-glow" />
                        <span>Evaluating with AI...</span>
                      </div>
                    ) : (
                      <>
                        <span>Submit Response for AI Review</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
