import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  Award, 
  Briefcase, 
  Clock, 
  ChevronRight,
  Sparkles,
  Search,
  Trash2,
  TrendingUp,
  Target,
  BarChart2,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

export default function HistoryAnalytics({ user, apiUrl }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('interviewai_token');
      const guestEmail = user?.email || localStorage.getItem('interviewai_guest_email') || 'guest@interviewai.dev';
      
      const res = await fetch(`${apiUrl}/api/interview/history`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-email': guestEmail
        }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.interviews || []);
      }
    } catch (e) {
      console.warn('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session record?')) return;

    try {
      const token = localStorage.getItem('interviewai_token');
      const res = await fetch(`${apiUrl}/api/interview/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(prev => prev.filter(item => item._id !== id));
        if (selectedSession?._id === id) setSelectedSession(null);
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  // Compute Aggregate Analytics Metrics
  const totalSessions = history.length;
  const validScores = history.map(h => h.overallScore).filter(s => typeof s === 'number' && s > 0);
  const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 'N/A';
  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 'N/A';
  const passedSessions = validScores.filter(s => s >= 6.5).length;
  const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

  // Filtered Sessions
  const filteredHistory = history.filter(item => {
    const matchesSearch = (item.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.level || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || item.interviewType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="badge badge-primary" style={{ marginBottom: 8 }}>
            <History size={14} color="#818cf8" />
            <span>Performance Record & Analytics</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Your Mock Interview Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track past performance scores, benchmark progression across hiring rounds, and inspect question feedback.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="secondary-btn"
          style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
          title="Reload session history"
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh History</span>
        </button>
      </div>


      {/* Overview Analytics Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: 16, 
        marginBottom: 28 
      }}>
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SESSIONS</span>
            <BarChart2 size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {totalSessions}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Completed mock interviews</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE SCORE</span>
            <TrendingUp size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
            {avgScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ 10</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Overall mean evaluation</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HIGHEST SCORE</span>
            <Award size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
            {highestScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/ 10</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Personal best rating</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLEARANCE RATE</span>
            <Target size={18} color="#22d3ee" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22d3ee' }}>
            {passRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sessions meeting hire benchmark</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by role or seniority level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px 10px 38px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'Technical', 'System Design', 'Behavioral'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedTypeFilter === type ? '#6366f1' : 'var(--border-subtle)',
                background: selectedTypeFilter === type ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedTypeFilter === type ? '#818cf8' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="wave-bar" style={{ display: 'inline-block', height: 24, margin: '0 4px' }} />
          <div className="wave-bar" style={{ display: 'inline-block', height: 32, margin: '0 4px' }} />
          <div className="wave-bar" style={{ display: 'inline-block', height: 20, margin: '0 4px' }} />
          <p style={{ marginTop: 14, color: 'var(--text-muted)' }}>Loading performance history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Sparkles size={36} color="#6366f1" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>No Matching Sessions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 450, margin: '0 auto' }}>
            {history.length === 0 
              ? 'Start your first AI mock interview session to automatically record your scorecards and growth analysis here!'
              : 'Try adjusting your search criteria or category filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredHistory.map((item) => (
            <div 
              key={item._id} 
              className="glass-panel" 
              style={{ padding: '22px 28px', cursor: 'pointer', transition: 'border-color 0.2s ease' }}
              onClick={() => setSelectedSession(selectedSession?._id === item._id ? null : item)}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14 
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{item.level || 'Mid-Level'}</span>
                    <span className="badge badge-cyan">{item.interviewType || 'Technical'}</span>
                    <span className="badge badge-amber">
                      {item.mode === 'virtual' ? '🎙️ Virtual AI' : '💻 Text'}
                    </span>
                    {item.interviewerPersonality && (
                      <span className="badge badge-primary" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                        🎭 {item.interviewerPersonality}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {item.role}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: (item.overallScore || 0) >= 8 ? '#10b981' : (item.overallScore || 0) >= 6 ? '#fbbf24' : '#f43f5e' 
                    }}>
                      {item.overallScore || 'N/A'} <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/10</span>
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Session Score
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, item._id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Delete record"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                  >
                    <Trash2 size={16} />
                  </button>

                  <ChevronRight 
                    size={20} 
                    color="var(--text-muted)" 
                    style={{ 
                      transform: selectedSession?._id === item._id ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </div>
              </div>

              {/* Accordion Questions Details */}
              {selectedSession?._id === item._id && (
                <div style={{ 
                  marginTop: 20, 
                  paddingTop: 18, 
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  {item.analytics && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                      gap: 8,
                      background: 'rgba(0,0,0,0.2)',
                      padding: '12px 16px',
                      borderRadius: '10px'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical</span>
                        <div style={{ fontWeight: 700, color: '#6366f1' }}>{item.analytics.technicalKnowledge || item.overallScore || 7}/10</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Communication</span>
                        <div style={{ fontWeight: 700, color: '#06b6d4' }}>{item.analytics.communication || 8}/10</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Problem Solving</span>
                        <div style={{ fontWeight: 700, color: '#a855f7' }}>{item.analytics.problemSolving || item.overallScore || 7}/10</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clarity</span>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>{item.analytics.clarity || 8}/10</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI-Estimated Confidence</span>
                        <div style={{ fontWeight: 700, color: '#f59e0b' }}>{item.analytics.confidence || 7}/10</div>
                      </div>
                    </div>
                  )}

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8', marginTop: 4 }}>
                    Questions & Detailed Feedback in this session:
                  </h4>
                  {item.questions?.map((q, qIdx) => (
                    <div key={qIdx} style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '16px 20px', 
                      borderRadius: '10px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0' }}>
                          Q{qIdx + 1}: {q.question}
                        </span>
                        {q.feedback?.score && (
                          <span style={{ fontWeight: 700, color: q.feedback.score >= 8 ? '#34d399' : '#fbbf24', fontSize: '0.85rem' }}>
                            Score: {q.feedback.score}/10
                          </span>
                        )}
                      </div>
                      {q.userAnswer && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <strong style={{ color: '#94a3b8' }}>Answer ({q.answerMode === 'voice' ? '🎙️ Voice' : '💻 Text'}):</strong>
                            {q.responseTime ? <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>⏱️ {q.responseTime}s response time</span> : null}
                            {q.fillerWordCount ? <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>⚡ {q.fillerWordCount} fillers</span> : null}
                          </div>
                          "{q.userAnswer}"
                        </div>
                      )}
                      {q.feedback?.summary && (
                        <p style={{ fontSize: '0.85rem', color: '#818cf8', marginTop: 8, fontStyle: 'italic' }}>
                          💡 {q.feedback.summary}
                        </p>
                      )}
                      {q.feedback?.followUpQuestion && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22d3ee' }}>⚡ Interviewer Follow-up: </span>
                          <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontStyle: 'italic' }}>"{q.feedback.followUpQuestion}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
