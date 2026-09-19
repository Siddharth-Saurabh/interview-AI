import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Award,
  HelpCircle,
  Code2,
  Cpu,
  Zap,
  Copy,
  Check,
  Layers
} from 'lucide-react';

export default function AnswerFeedback({ 
  feedback, 
  question, 
  userAnswer, 
  onNextQuestion, 
  isLastQuestion 
}) {
  const score = feedback?.score || 7;
  const [copiedCandidateCode, setCopiedCandidateCode] = useState(false);
  const [copiedIdealCode, setCopiedIdealCode] = useState(false);

  // Dynamic score color
  const getScoreColor = (sc) => {
    if (sc >= 8) return '#10b981';
    if (sc >= 6) return '#fbbf24';
    return '#f43f5e';
  };

  const handleCopyCandidate = () => {
    if (userAnswer) {
      navigator.clipboard.writeText(userAnswer);
      setCopiedCandidateCode(true);
      setTimeout(() => setCopiedCandidateCode(false), 2000);
    }
  };

  const handleCopyIdeal = () => {
    if (feedback?.idealCodeSolution) {
      navigator.clipboard.writeText(feedback.idealCodeSolution);
      setCopiedIdealCode(true);
      setTimeout(() => setCopiedIdealCode(false), 2000);
    }
  };

  const hasCodeMetrics = feedback?.timeComplexity || feedback?.spaceComplexity || feedback?.idealCodeSolution;

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Score Header Card */}
      <div className="glass-panel" style={{ 
        padding: '30px 36px', 
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.9) 0%, rgba(30, 41, 67, 0.6) 100%)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: 8 }}>
              <Award size={14} color="#818cf8" />
              AI Evaluator Scorecard
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Detailed Evaluation Feedback
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 4, maxWidth: 680 }}>
              {feedback?.summary || 'Objective evaluation calculated across technical depth, correctness, and structure.'}
            </p>

            {/* Complexity & Code Badges */}
            {(feedback?.timeComplexity || feedback?.spaceComplexity || feedback?.codeQuality) && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                {feedback.timeComplexity && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.18)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: '#c7d2fe',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    <Cpu size={14} color="#818cf8" />
                    <span>Time Complexity: <strong>{feedback.timeComplexity}</strong></span>
                  </div>
                )}

                {feedback.spaceComplexity && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.18)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    color: '#a5f3fc',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    <Layers size={14} color="#22d3ee" />
                    <span>Space Complexity: <strong>{feedback.spaceComplexity}</strong></span>
                  </div>
                )}

                {typeof feedback.codeQuality === 'number' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#6ee7b7',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    <Code2 size={14} color="#34d399" />
                    <span>Code Quality: <strong>{feedback.codeQuality}/10</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Circular Score Badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.4)',
            border: `3px solid ${getScoreColor(score)}`,
            boxShadow: `0 0 20px ${getScoreColor(score)}40`
          }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: getScoreColor(score), lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              OUT OF 10
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Grid (Strengths & Growth Areas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Strengths */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
              Demonstrated Strengths
            </h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(feedback?.strengths || ['Good foundational clarity and accurate technical terminology.']).map((str, i) => (
              <li key={i} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 10,
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                lineHeight: 1.5
              }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={20} color="#fbbf24" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
              Actionable Growth Areas & Edge Cases
            </h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(feedback?.improvements || ['Include concrete production scaling examples and edge-case handling.']).map((imp, i) => (
              <li key={i} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 10,
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                lineHeight: 1.5
              }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Candidate Answer vs. Ideal Benchmark Code Comparison */}
      {userAnswer && (
        <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
                Your Submitted Solution
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCandidate}
              className="secondary-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              {copiedCandidateCode ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedCandidateCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre style={{
            background: 'rgba(5, 8, 16, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px 20px',
            color: '#f8fafc',
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            fontSize: '0.88rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {userAnswer}
          </pre>
        </div>
      )}

      {/* Ideal 10/10 Benchmark Code Solution */}
      {feedback?.idealCodeSolution && (
        <div className="glass-panel" style={{ 
          padding: '24px 28px', 
          marginBottom: 24, 
          borderLeft: '4px solid #10b981',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(13, 19, 33, 0.85) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="#34d399" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                Optimal 10/10 Benchmark Code Implementation
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyIdeal}
              className="secondary-btn"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              {copiedIdealCode ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedIdealCode ? 'Copied Solution' : 'Copy Solution'}</span>
            </button>
          </div>
          <pre style={{
            background: '#090d13',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '16px 20px',
            color: '#6ee7b7',
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            fontSize: '0.88rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {feedback.idealCodeSolution}
          </pre>
        </div>
      )}

      {/* Ideal Model Explanation Answer Section */}
      {feedback?.idealAnswer && (
        <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24, borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <BookOpen size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22d3ee' }}>
              Architectural & Algorithmic Rationale
            </h3>
          </div>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#e2e8f0', 
            lineHeight: 1.7, 
            whiteSpace: 'pre-wrap',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '16px 20px',
            borderRadius: '10px'
          }}>
            {feedback.idealAnswer}
          </p>
        </div>
      )}

      {/* Follow Up Question */}
      {feedback?.followUpQuestion && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 28, background: 'rgba(99, 102, 241, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <HelpCircle size={18} color="#818cf8" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8' }}>
              Interviewer Follow-Up Probe:
            </h4>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic' }}>
            "{feedback.followUpQuestion}"
          </p>
        </div>
      )}

      {/* Next Step Action Button */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onNextQuestion}
          className="glow-btn"
          style={{ padding: '14px 32px', fontSize: '1.05rem', borderRadius: '12px' }}
        >
          <span>{isLastQuestion ? 'View Final Session Scorecard' : 'Proceed to Next Question'}</span>
          <ArrowRight size={18} />
        </button>
      </div>

    </div>
  );
}
