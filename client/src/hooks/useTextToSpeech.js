import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom React hook for Text-to-Speech (TTS) using Web SpeechSynthesis API
 * Supports persona-based voice pacing, auto-cancellation, replay, and speech state tracking.
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const utteranceRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
    } else {
      setSupported(false);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return;

    const {
      personality = 'Professional',
      onStart,
      onEnd,
      onError
    } = options;

    window.speechSynthesis.cancel();
    setLastSpokenText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure pitch & rate based on personality
    switch (personality) {
      case 'Friendly':
        utterance.rate = 1.02;
        utterance.pitch = 1.1;
        break;
      case 'Technical Expert':
        utterance.rate = 0.98;
        utterance.pitch = 0.95;
        break;
      case 'Strict':
        utterance.rate = 1.05;
        utterance.pitch = 0.9;
        break;
      case 'HR Interviewer':
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        break;
      case 'Professional':
      default:
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        break;
    }

    // Try selecting an English natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferredVoice = voices.find(v => 
        (v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const replay = useCallback((options = {}) => {
    if (lastSpokenText) {
      speak(lastSpokenText, options);
    }
  }, [lastSpokenText, speak]);

  return {
    isSpeaking,
    supported,
    speak,
    stop,
    replay,
    lastSpokenText
  };
}
