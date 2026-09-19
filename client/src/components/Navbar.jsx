import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Coins, 
  History, 
  PlayCircle, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function Navbar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onOpenPricing, 
  onOpenAuth, 
  onLogout 
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    // Close menu on Escape key press
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const handlePricingClick = () => {
    onOpenPricing();
    setMenuOpen(false);
  };

  const handleAuthClick = () => {
    onOpenAuth();
    setMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setMenuOpen(false);
  };

  return (
    <header className="app-navbar" ref={navRef}>
      <div className="navbar-main-row">
        
        {/* Logo & Branding */}
        <div 
          onClick={() => handleNavClick('interview')}
          className="navbar-brand"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('interview')}
          title="InterviewAI Home"
        >
          <div className="navbar-logo-icon">
            <Sparkles size={20} color="#fff" />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-title">
              Interview<span className="navbar-title-gradient">AI</span>
            </span>
            <span className="navbar-subtitle">
              Pro Prep Engine
            </span>
          </div>
        </div>

        {/* Desktop & Tablet Navigation Controls */}
        <div className="navbar-desktop-controls">
          
          {/* Token Pill Badge */}
          <button 
            onClick={onOpenPricing}
            title="Available Tokens • Click to recharge"
            className="token-badge-pill"
            type="button"
          >
            <Coins size={17} color="#fbbf24" />
            <span className="token-amount">
              {user ? user.credits : 100}
            </span>
            <span className="token-label">Tokens</span>
          </button>

          {/* User Sign in / Profile */}
          {user ? (
            <div className="user-profile-wrapper">
              <div className="user-profile-chip" title={user.name || user.email}>
                <div className="user-avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
                <span className="user-profile-name">
                  {user.name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="secondary-btn navbar-logout-btn"
                type="button"
                aria-label="Log Out"
              >
                <LogOut size={16} color="var(--text-muted)" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="glow-btn navbar-signin-btn"
              type="button"
            >
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}

          {/* Desktop/Tablet Burger Menu Button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className={`secondary-btn navbar-menu-btn ${menuOpen ? 'active' : ''}`}
            title={menuOpen ? 'Close Menu' : 'Open Navigation Menu'}
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} color="#818cf8" /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile-Only Burger Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`secondary-btn navbar-mobile-toggle ${menuOpen ? 'active' : ''}`}
          title={menuOpen ? 'Close Menu' : 'Open Menu'}
          type="button"
          aria-label="Toggle mobile menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} color="#818cf8" /> : <Menu size={22} />}
        </button>

      </div>

      {/* Slide-Down Navigation & Profile Drawer */}
      {menuOpen && (
        <div className="navbar-drawer" role="menu">
          
          {/* Mobile Profile & Token Section (Visible only on mobile inside drawer) */}
          <div className="mobile-drawer-header">
            {user ? (
              <div className="mobile-user-card">
                <div className="mobile-user-info">
                  <div className="user-avatar-circle large">
                    {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{user.name || 'Candidate'}</span>
                    <span className="mobile-user-email">{user.email}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePricingClick}
                  className="token-badge-pill mobile-token-pill"
                  type="button"
                  title="Click to recharge tokens"
                >
                  <Coins size={16} color="#fbbf24" />
                  <span className="token-amount">{user.credits}</span>
                  <span className="token-label">Tokens</span>
                  <span className="recharge-tag">+ Top Up</span>
                </button>
              </div>
            ) : (
              <div className="mobile-guest-card">
                <button 
                  onClick={handlePricingClick}
                  className="token-badge-pill"
                  type="button"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Coins size={16} color="#fbbf24" />
                  <span className="token-amount">100</span>
                  <span className="token-label">Free Demo Tokens</span>
                </button>
                <button 
                  onClick={handleAuthClick}
                  className="glow-btn"
                  style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}
                  type="button"
                >
                  <UserIcon size={16} />
                  <span>Sign In / Register</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Navigation Links */}
          <div className="mobile-drawer-links">
            <button 
              onClick={() => handleNavClick('interview')}
              className={`drawer-nav-item ${activeTab === 'interview' ? 'active' : ''}`}
              type="button"
            >
              <div className="drawer-item-left">
                <div className="drawer-icon-box primary">
                  <PlayCircle size={18} color="#818cf8" />
                </div>
                <span>Mock Interview Studio</span>
              </div>
              <ChevronRight size={16} className="drawer-arrow" />
            </button>

            <button 
              onClick={() => handleNavClick('history')}
              className={`drawer-nav-item ${activeTab === 'history' ? 'active' : ''}`}
              type="button"
            >
              <div className="drawer-item-left">
                <div className="drawer-icon-box cyan">
                  <History size={18} color="#06b6d4" />
                </div>
                <span>Past Sessions & Analytics</span>
              </div>
              <ChevronRight size={16} className="drawer-arrow" />
            </button>

            <button 
              onClick={handlePricingClick}
              className="drawer-nav-item"
              type="button"
            >
              <div className="drawer-item-left">
                <div className="drawer-icon-box amber">
                  <CreditCard size={18} color="#fbbf24" />
                </div>
                <span>Pricing Plans & Buy Tokens</span>
              </div>
              <ChevronRight size={16} className="drawer-arrow" />
            </button>
          </div>

          {/* Mobile Logout (only when logged in) */}
          {user && (
            <div className="mobile-drawer-footer">
              <button 
                onClick={handleLogoutClick}
                className="mobile-logout-btn"
                type="button"
              >
                <LogOut size={16} color="#f43f5e" />
                <span>Log Out of InterviewAI</span>
              </button>
            </div>
          )}

        </div>
      )}
    </header>
  );
}


