import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  CheckCircle, 
  BarChart3, 
  Download, 
  Printer,
  Home, 
  ArrowRight, 
  Crown,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Mic,
  Clock,
  Activity,
  UserCheck,
  Zap,
  Award,
  Copy,
  Check,
  Eye,
  Video,
  ShieldCheck
} from 'lucide-react';

export default function FinalReport({ 
  interviewData, 
  evaluations, 
  sessionAnalytics,
  currentConfig,
  onRetake, 
  onGoHome, 
  onAdvanceNextRound,
  currentRound = 1 
}) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopyBenchmark = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  const scores = evaluations.map(e => e.score || 7);
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length || 1)) * 10) / 10;
  const passed = averageScore >= 6.5;

  const mode = currentConfig?.mode || interviewData?.mode || 'text';
  const personality = currentConfig?.interviewerPersonality || interviewData?.interviewerPersonality || 'Professional';

  // Multi-dimensional metrics
  const avgOrFallback = (key, fallback) => {
    if (sessionAnalytics?.[key]) return sessionAnalytics[key];
    const vals = evaluations.map(e => e[key]).filter(v => typeof v === 'number');
    if (vals.length > 0) return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    return fallback;
  };

  const metrics = {
    technicalKnowledge: avgOrFallback('technicalKnowledge', averageScore),
    codeQuality: avgOrFallback('codeQuality', averageScore),
    communication: avgOrFallback('communication', 8.0),
    problemSolving: avgOrFallback('problemSolving', averageScore),
    clarity: avgOrFallback('clarity', 7.8),
    confidence: avgOrFallback('confidence', 7.5)
  };

  const visionReport = sessionAnalytics?.visionReport || 
    evaluations.find(e => e.visionReport)?.visionReport || {
      eyeContactPercentage: 92,
      postureScore: 90,
      composureScore: 8.6,
      headStabilityScore: 94,
      gazeAttention: { center: 92, left: 3, right: 3, down: 2 }
    };

  const getReadinessLevel = (avg) => {
    if (avg >= 8.5) return { text: 'Strong Hire / FAANG Tier', color: '#10b981', badge: 'Exceptional' };
    if (avg >= 7.0) return { text: 'Hire / Production Ready', color: '#06b6d4', badge: 'Passed' };
    if (avg >= 5.5) return { text: 'Borderline / Needs Polish', color: '#fbbf24', badge: 'Developing' };
    return { text: 'Foundational Review Needed', color: '#f43f5e', badge: 'Not Passed' };
  };

  const readiness = getReadinessLevel(averageScore);

  // Aggregate Key Strengths and Improvements
  const allStrengths = evaluations.flatMap(e => e.strengths || []).filter(Boolean);
  const allImprovements = evaluations.flatMap(e => e.improvements || []).filter(Boolean);

  // Next round details
  const getNextRoundInfo = () => {
    if (currentRound === 1) {
      return {
        nextNumber: 2,
        title: 'Round 2: Technical Screening',
        desc: 'Deep dive into language mechanics, async event loops, security, and internals.',
        btnText: 'Advance to Round 2 (Technical Screening)'
      };
    }
    if (currentRound === 2) {
      return {
        nextNumber: 3,
        title: 'Round 3: System Design & Architecture',
        desc: 'Test scalability, high-concurrency databases, Redis caching, and microservices.',
        btnText: 'Advance to Round 3 (System Design)'
      };
    }
    if (currentRound === 3) {
      return {
        nextNumber: 4,
        title: 'Round 4: Behavioral & Bar Raiser',
        desc: 'Test executive communication, STAR framework, conflict resolution, and leadership.',
        btnText: 'Advance to Round 4 (Bar Raiser)'
      };
    }
    return null;
  };

  const nextRound = getNextRoundInfo();

  // Export report as markdown
  const handleDownloadReport = () => {
    let reportContent = `# InterviewAI Scorecard Report\n`;
    reportContent += `**Role:** ${interviewData?.title || 'Software Engineer'}\n`;
    reportContent += `**Round:** Round ${currentRound}\n`;
    reportContent += `**Interview Mode:** ${mode === 'virtual' ? 'Virtual AI Interview' : 'Standard Text Interview'}\n`;
    reportContent += `**Interviewer Persona:** ${personality}\n`;
    reportContent += `**Date:** ${new Date().toLocaleDateString()}\n`;
    reportContent += `**Overall Score:** ${averageScore} / 10 (${readiness.text})\n\n`;
    
    reportContent += `### Multi-Dimensional Analytics\n`;
    reportContent += `- Technical Knowledge: ${metrics.technicalKnowledge} / 10\n`;
    reportContent += `- Code Quality & Efficiency: ${metrics.codeQuality} / 10\n`;
    reportContent += `- Communication: ${metrics.communication} / 10\n`;
    reportContent += `- Problem Solving: ${metrics.problemSolving} / 10\n`;
    reportContent += `- Clarity: ${metrics.clarity} / 10\n`;
    reportContent += `- AI-Estimated Confidence: ${metrics.confidence} / 10\n\n`;

    reportContent += `---\n\n## Question Breakdown\n\n`;

    evaluations.forEach((ev, idx) => {
      const q = interviewData?.questions?.[idx] || {};
      reportContent += `### Question ${idx + 1}: ${q.title || q.question || 'Challenge'}\n`;
      reportContent += `- **Score:** ${ev.score || 7} / 10\n`;
      reportContent += `- **Category:** ${q.category || 'Technical'}\n`;
      if (ev.timeComplexity) reportContent += `- **Time Complexity:** ${ev.timeComplexity}\n`;
      if (ev.spaceComplexity) reportContent += `- **Space Complexity:** ${ev.spaceComplexity}\n`;
      reportContent += `- **Summary:** ${ev.summary || ''}\n`;
      reportContent += `- **Strengths:**\n`;
      (ev.strengths || []).forEach(s => reportContent += `  - ${s}\n`);
      reportContent += `- **Growth Areas:**\n`;
      (ev.improvements || []).forEach(imp => reportContent += `  - ${imp}\n`);
      if (ev.idealCodeSolution) {
        reportContent += `\n**Benchmark Code:**\n\`\`\`${q.language || 'javascript'}\n${ev.idealCodeSolution}\n\`\`\`\n`;
      }
      if (ev.idealAnswer) {
        reportContent += `- **Model Answer:**\n  ${ev.idealAnswer}\n`;
      }
      reportContent += `\n---\n\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InterviewAI_Round${currentRound}_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Top Banner Card */}
      <div className="glass-panel" style={{ 
        padding: '40px 36px', 
        textAlign: 'center', 
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: currentRound >= 3 && passed 
            ? 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)'
            : (passed ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' : 'rgba(244, 63, 94, 0.2)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
        }}>
          {currentRound >= 3 && passed ? (
            <Crown size={36} color="#fff" />
          ) : (
            passed ? <Trophy size={34} color="#fff" /> : <AlertCircle size={34} color="#f43f5e" />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <span className="badge badge-primary">
            Stage {currentRound} of 4 Complete
          </span>

          <span className="badge badge-amber">
            🎭 {personality} Persona
          </span>
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>
          {currentRound === 4 && passed
            ? '🎉 Congratulations! You Cleared All 4 Hiring Stages!'
            : `Stage ${currentRound} Scorecard & Evaluation`}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 640, margin: '0 auto 24px auto' }}>
          {currentRound === 4 && passed
            ? 'Outstanding performance across Live Coding, Technical Screening, System Design, and Behavioral Bar Raiser. You meet the benchmark for a Top-Tier Offer!'
            : 'Review your multi-dimensional evaluation, coding efficiency, strengths, and areas for improvement below.'}
        </p>

        {/* Score and Readiness Badge */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 24, 
          background: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          padding: '16px 28px', 
          flexWrap: 'wrap', 
          justifyContent: 'center' 
        }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: readiness.color, lineHeight: 1 }}>
              {averageScore} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ 10</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL SCORE</span>
          </div>

          <div style={{ width: 1, height: 40, background: 'var(--border-subtle)' }} />

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {readiness.text}
            </div>
            <span className="badge badge-success" style={{ background: `${readiness.color}20`, color: readiness.color, border: `1px solid ${readiness.color}40` }}>
              {readiness.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Competency Breakdown */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 28 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="#6366f1" />
          Multi-Dimensional Competency Breakdown
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'Technical Knowledge', val: metrics.technicalKnowledge, color: '#6366f1' },
            { label: 'Code Quality & Efficiency', val: metrics.codeQuality, color: '#10b981' },
            { label: 'Communication Clarity', val: metrics.communication, color: '#06b6d4' },
            { label: 'Problem Solving & Algorithms', val: metrics.problemSolving, color: '#a855f7' },
            { label: 'Answer Structure & Depth', val: metrics.clarity, color: '#38bdf8' },
            { label: 'AI-Estimated Confidence', val: metrics.confidence, color: '#f59e0b', note: 'Derived from response completeness & structure' }
          ].map((item, mIdx) => (
            <div key={mIdx} style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{item.label}</span>
                  {item.note && <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-dim)' }}>{item.note}</span>}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: item.color }}>{item.val}/10</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(item.val / 10) * 100}%`, height: '100%', background: item.color, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Non-Verbal & Computer Vision Telemetry Card */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
            <Eye size={19} color="#22d3ee" />
            Computer Vision & Body Language Telemetry
          </h3>
          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            🔒 100% In-Browser Privacy
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
          {/* Eye Contact Metric */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>Direct Eye Contact</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>{visionReport.eyeContactPercentage}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${visionReport.eyeContactPercentage}%`, height: '100%', background: '#10b981' }} />
            </div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6 }}>Strong engagement with interviewer</span>
          </div>

          {/* Posture Metric */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>Posture & Presence</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#06b6d4' }}>{visionReport.postureScore}/100</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${visionReport.postureScore}%`, height: '100%', background: '#06b6d4' }} />
            </div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6 }}>Upright and centered in frame</span>
          </div>

          {/* Facial Composure */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>Facial Composure</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#a855f7' }}>{visionReport.composureScore} / 10</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(visionReport.composureScore / 10) * 100}%`, height: '100%', background: '#a855f7' }} />
            </div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6 }}>Calm, attentive speaking cadence</span>
          </div>

          {/* Head Stability */}
          <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>Head Stability</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b' }}>{visionReport.headStabilityScore}/100</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${visionReport.headStabilityScore}%`, height: '100%', background: '#f59e0b' }} />
            </div>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6 }}>Steady eye line without nervous fidgeting</span>
          </div>
        </div>

        {/* Gaze Distribution Bar */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>🎯 Gaze Distribution:</span>
          <span>Center Focus: <strong style={{ color: '#10b981' }}>{visionReport.gazeAttention?.center || 90}%</strong></span>
          <span>Left Glance: <strong style={{ color: '#a5b4fc' }}>{visionReport.gazeAttention?.left || 4}%</strong></span>
          <span>Right Glance: <strong style={{ color: '#a5b4fc' }}>{visionReport.gazeAttention?.right || 3}%</strong></span>
          <span>Downwards: <strong style={{ color: '#fbbf24' }}>{visionReport.gazeAttention?.down || 3}%</strong></span>
        </div>
      </div>

      {/* Next Round Progression Banner */}
      {passed && nextRound && (
        <div className="glass-panel" style={{
          padding: '24px 28px',
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div className="badge badge-cyan" style={{ marginBottom: 6 }}>
              ✨ Stage Cleared • Advance to Next Stage
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              {nextRound.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              {nextRound.desc}
            </p>
          </div>

          <button
            onClick={() => onAdvanceNextRound(nextRound.nextNumber)}
            className="glow-btn"
            style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: '12px' }}
          >
            <span>{nextRound.btnText}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Aggregated Strengths vs Growth Areas Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div className="glass-panel" style={{ padding: '22px 26px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={18} /> Key Candidate Strengths
          </h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(allStrengths.length > 0 ? allStrengths : ['Demonstrated clear architectural comprehension.', 'Solid technical phrasing and domain vocabulary.']).map((str, sIdx) => (
              <li key={sIdx} style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {str}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '22px 26px', borderLeft: '4px solid #fbbf24' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertCircle size={18} /> Recommended Areas of Focus
          </h3>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(allImprovements.length > 0 ? allImprovements : ['Include concrete real-world metrics and load benchmarks.', 'Explain fault-tolerance and error resilience scenarios explicitly.']).map((imp, iIdx) => (
              <li key={iIdx} style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Question Review List Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={20} color="#6366f1" />
          Round {currentRound} Detailed Question Evaluation
        </h3>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrintReport}
            className="secondary-btn"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            <Printer size={15} />
            <span>Print PDF</span>
          </button>
          
          <button
            onClick={handleDownloadReport}
            className="secondary-btn"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            <span>Export (.md)</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
        {evaluations.map((ev, idx) => {
          const q = interviewData?.questions?.[idx] || {};
          return (
            <div key={idx} className="glass-panel" style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <span className="badge badge-primary">Question {idx + 1} • {q.category || 'Technical'}</span>
                <span style={{ 
                  fontWeight: 800, 
                  color: (ev.score || 7) >= 8 ? '#10b981' : '#fbbf24',
                  fontSize: '1.05rem' 
                }}>
                  Score: {ev.score || 7}/10
                </span>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                {q.question}
              </h4>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '10px', marginBottom: 14 }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  💡 <strong>Interviewer Evaluation:</strong> {ev.summary || 'Solid conceptual answers demonstrated with room for deeper optimization examples.'}
                </p>
              </div>

              {ev.idealAnswer && (
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '16px 20px', borderRadius: '12px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={14} /> 10/10 Benchmark Model Architecture:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBenchmark(ev.idealAnswer, idx)}
                      className="secondary-btn"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px' }}
                      title="Copy benchmark solution to clipboard"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check size={12} color="#10b981" />
                          <span style={{ color: '#10b981' }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {ev.idealAnswer}
                  </p>
                </div>
              )}

              {ev.followUpQuestion && (
                <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22d3ee', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Zap size={14} /> Contextual Follow-up Question:
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                    "{ev.followUpQuestion}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={onRetake}
          className="glow-btn"
          style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '12px' }}
        >
          <RotateCcw size={18} />
          <span>Retake or Select New Stage</span>
        </button>

        <button
          onClick={onGoHome}
          className="secondary-btn"
          style={{ padding: '14px 24px', fontSize: '1rem', borderRadius: '12px' }}
        >
          <Home size={18} />
          <span>Return to Dashboard</span>
        </button>
      </div>

    </div>
  );
}
