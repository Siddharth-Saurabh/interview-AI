import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PLANS = [
  {
    id: 'plan_starter',
    name: 'Starter Prep',
    credits: 50,
    price: '₹49',
    priceVal: 49,
    popular: false,
    features: [
      '5 Complete AI Mock Sessions',
      'Instant Scorecards & Ratings',
      'Real-time Voice Narration',
      'Technical & Behavioral Tracks'
    ]
  },
  {
    id: 'plan_pro',
    name: 'Pro Interviewer',
    credits: 150,
    price: '₹129',
    priceVal: 129,
    popular: true,
    features: [
      '15 Complete Mock Sessions',
      'In-Depth Model Answers (10/10)',
      'STAR Method Behavioral Analysis',
      'Live Speech-to-Text Input',
      'Architectural Deep Dives'
    ]
  },
  {
    id: 'plan_unlimited',
    name: 'Career Accelerator',
    credits: 500,
    price: '₹349',
    priceVal: 349,
    popular: false,
    features: [
      '50 Complete Mock Sessions',
      'System Design Concurrency Specs',
      'Custom Role & Tech Frameworks',
      'Unlimited Session Retakes',
      'Priority AI Model Response'
    ]
  }
];

export default function PricingModal({ isOpen, onClose, onCreditSuccess, apiUrl, user }) {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('select'); // 'select' | 'gateway'

  if (!isOpen) return null;

  const handleStartCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutStep('gateway');
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('interviewai_token');
      const guestEmail = user?.email || localStorage.getItem('interviewai_guest_email') || 'guest@interviewai.dev';

      // 1. Call Create Order
      const orderRes = await fetch(`${apiUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-email': guestEmail
        },
        body: JSON.stringify({ planId: selectedPlan.id })
      });
      const orderData = await orderRes.json();

      // 2. Call Verify Payment (Auto-verifies mock or real payment)
      const verifyRes = await fetch(`${apiUrl}/api/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-email': guestEmail
        },
        body: JSON.stringify({
          orderId: orderData.order?.id || `order_mock_${Date.now()}`,
          paymentId: `pay_mock_${Date.now()}`,
          signature: 'mock_signature',
          planId: selectedPlan.id
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch (e) {}

        onCreditSuccess(selectedPlan.credits);
        setIsProcessing(false);
        setCheckoutStep('select');
        onClose();
      }
    } catch (e) {
      console.error('Payment error:', e);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="glass-panel" style={{
        maxWidth: checkoutStep === 'gateway' ? 480 : 960,
        width: '100%',
        padding: '32px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={() => { setCheckoutStep('select'); onClose(); }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {checkoutStep === 'select' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div className="badge badge-amber" style={{ marginBottom: 10 }}>
                <Zap size={14} color="#fbbf24" />
                <span>Credit Packages</span>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                Recharge Interview Credits
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Each mock interview session uses 10 credits for full AI questions and deep analysis.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid',
                    borderColor: p.popular ? '#6366f1' : 'var(--border-subtle)',
                    background: p.popular ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {p.popular && (
                    <div style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#6366f1',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 12px',
                      borderRadius: '20px',
                      letterSpacing: '0.05em'
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{p.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{p.price}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ one-time</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(245, 158, 11, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: 16
                    }}>
                      <Zap size={16} color="#fbbf24" fill="#fbbf24" />
                      <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem' }}>
                        +{p.credits} AI Credits
                      </span>
                    </div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {p.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <Check size={14} color="#10b981" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleStartCheckout(p)}
                    className={p.popular ? "glow-btn" : "secondary-btn"}
                    style={{ width: '100%', padding: '10px 16px', borderRadius: '10px', fontSize: '0.95rem' }}
                  >
                    Select {p.credits} Credits
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={15} color="#10b981" /> Razorpay Test Gateway Enabled
              </span>
              <span>•</span>
              <span>Instant Credits Activation</span>
            </div>
          </div>
        ) : (
          /* Razorpay Modal Simulation */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '12px',
              background: '#0c2340',
              border: '1px solid #144272',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CreditCard size={26} color="#3399cc" />
            </div>

            <div className="badge badge-cyan" style={{ marginBottom: 8 }}>
              Razorpay Secure Checkout (Test Mode)
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Confirm Payment of {selectedPlan.price}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Receiving +{selectedPlan.credits} Interview AI credits
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              margin: '20px 0',
              textAlign: 'left',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Package:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{selectedPlan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Credits Added:</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>+{selectedPlan.credits}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>Total Amount:</span>
                <span style={{ color: '#22d3ee', fontWeight: 800 }}>{selectedPlan.price} INR</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setCheckoutStep('select')}
                className="secondary-btn"
                style={{ flex: 1, padding: '12px' }}
                disabled={isProcessing}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleSimulatePayment}
                className="glow-btn"
                style={{ flex: 2, padding: '12px' }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} className="pulse-glow" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <>
                    <span>Pay {selectedPlan.price} (Dummy Gateway)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
