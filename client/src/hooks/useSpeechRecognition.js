import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom React hook for Browser Speech Recognition (STT)
 * Implements robust lifecycle management, error handling, permission detection, and cleanup.
 */
export function useSpeechRecognition({ onResult, lang = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setPermissionDenied(false);
        };

        recognition.onresult = (event) => {
          let currentFinal = '';
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';
            if (result.isFinal) {
              currentFinal += text + ' ';
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => {
              const updated = (prev + ' ' + currentFinal).trim();
              if (onResult) onResult(updated);
              return updated;
            });
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim);
          }
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setPermissionDenied(true);
            setError('Microphone permission denied. Please allow microphone access or type your answer.');
          } else if (event.error === 'no-speech') {
            // Ignore non-fatal silence timeouts
          } else {
            setError(`Speech recognition notice: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          // Auto-restart if user did not manually stop and listening was expected
          if (!isManuallyStoppedRef.current && isListening) {
            try {
              recognition.start();
            } catch (e) {
              // Ignore restart collision
            }
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
        setSupported(false);
      }
    } else {
      setSupported(false);
    }

    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    isManuallyStoppedRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      // If already started, ignore DOMException
      if (err.name !== 'InvalidStateError') {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('SpeechRecognition stop error:', err);
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    supported,
    permissionDenied,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  };
}
