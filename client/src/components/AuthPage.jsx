import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Bot
} from 'lucide-react';
import { auth, googleProvider } from '../config/firebase.js';
import { signInWithPopup } from 'firebase/auth';

export default function AuthPage({ onAuthSuccess, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1-Click Demo Login
  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@interviewai.dev',
          password: 'Password123!'
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('interviewai_token', data.token);
        onAuthSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Demo login failed');
      }
    } catch (e) {
      setErrorMsg('Could not connect to backend server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Google Firebase Sign In
  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const res = await fetch(`${apiUrl}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email.split('@')[0]
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('interviewai_token', data.token);
        onAuthSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Failed to sync Google user');
      }
    } catch (err) {
      console.warn('Firebase Google Auth notice:', err);
      setErrorMsg('Google Sign-In was closed or interrupted. You can log in using email & password below.');
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');
    const endpoint = isRegister ? `${apiUrl}/api/auth/register` : `${apiUrl}/api/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: isRegister ? name : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('interviewai_token', data.token);
        onAuthSuccess(data.user);
      } else {
        setErrorMsg(data.message || 'Authentication failed');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please verify backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        maxWidth: 480,
        width: '100%',
        padding: '36px 32px',
        borderRadius: '20px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)'
          }}>
            <Bot size={28} color="#fff" />
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {isRegister ? 'Create Your Account' : 'Sign in to InterviewAI'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isRegister 
              ? 'Join to practice AI mock interviews and track progress' 
              : 'Sign in to access your interview simulator & scorecards'}
          </p>
        </div>

        {/* 1-Click Demo Account Quick Card */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <KeyRound size={15} /> Quick Demo Account
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              demo@interviewai.dev • Password123!
            </div>
          </div>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="glow-btn"
            style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            Auto Sign In
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '11px 14px',
            fontSize: '0.85rem',
            color: '#fb7185',
            marginBottom: 18
          }}>
            {errorMsg}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleFirebaseGoogleLogin}
          disabled={loading}
          className="secondary-btn"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '0.9rem', 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>OR WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleFormSubmit}>
          {isRegister && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siddharth Saurabh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '11px 14px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '11px 14px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '11px 40px 11px 14px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-btn"
            style={{ width: '100%', padding: '13px', borderRadius: '10px', fontSize: '1rem' }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} className="pulse-glow" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>{isRegister ? 'Create Free Account' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isRegister 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up Free"}
          </button>
        </div>

      </div>
    </div>
  );
}
