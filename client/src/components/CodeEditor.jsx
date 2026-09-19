import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Code2, 
  Settings2,
  Sparkles,
  Layers,
  Clock,
  AlertCircle
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript (Node.js/ES6)', ext: 'js' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
  { id: 'python', name: 'Python 3', ext: 'py' },
  { id: 'java', name: 'Java', ext: 'java' },
  { id: 'cpp', name: 'C++', ext: 'cpp' },
  { id: 'go', name: 'Go', ext: 'go' },
  { id: 'sql', name: 'SQL', ext: 'sql' }
];

const THEMES = [
  { id: 'vs-dark', name: 'VS Dark (Default)' },
  { id: 'light', name: 'VS Light' },
  { id: 'hc-black', name: 'High Contrast' }
];

export default function CodeEditor({
  code = '',
  onChange,
  language = 'javascript',
  onLanguageChange,
  starterCode = '',
  testCases = [],
  readOnly = false,
  height = '460px',
  title = 'Code Editor',
  subtitle = 'Write your solution below and run tests'
}) {
  const [selectedLang, setSelectedLang] = useState(language || 'javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Runner & Console Output State
  const [activeBottomTab, setActiveBottomTab] = useState('console'); // 'console' | 'tests'
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState(null);

  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (language && language !== selectedLang) {
      setSelectedLang(language);
    }
  }, [language]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleLanguageSelect = (langId) => {
    setSelectedLang(langId);
    if (onLanguageChange) {
      onLanguageChange(langId);
    }
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetCode = () => {
    if (starterCode && onChange) {
      onChange(starterCode);
      setConsoleLogs([]);
      setTestResults([]);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Safe In-Browser JavaScript Execution Runner
  const runCodeInBrowser = () => {
    setIsRunning(true);
    setConsoleLogs([]);
    setTestResults([]);
    const startTime = performance.now();

    const logs = [];
    const customConsole = {
      log: (...args) => logs.push({ type: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
      warn: (...args) => logs.push({ type: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
      error: (...args) => logs.push({ type: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }),
      info: (...args) => logs.push({ type: 'info', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') })
    };

    try {
      if (selectedLang === 'javascript' || selectedLang === 'typescript') {
        // Execute candidate code in safe Function wrapper with custom console
        const runFn = new Function('console', `
          "use strict";
          ${code}
        `);
        runFn(customConsole);

        if (logs.length === 0) {
          logs.push({ type: 'info', text: '✓ Code executed successfully with 0 runtime errors.' });
        }

        // Run against test cases if present
        if (testCases && testCases.length > 0) {
          const results = [];
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            try {
              // Attempt to evaluate function with test case input
              const evalTest = new Function(`
                "use strict";
                ${code}
                try {
                  const fnMatch = "${code}".match(/(?:function|class)\\s+([a-zA-Z0-9_$]+)/);
                  const fnName = fnMatch ? fnMatch[1] : null;
                  if (fnName && typeof eval(fnName) === 'function') {
                    const args = [${tc.input}];
                    const res = eval(fnName)(...args);
                    return { success: true, result: res };
                  }
                  return { success: false, reason: 'Main function not found' };
                } catch(err) {
                  return { success: false, error: err.message };
                }
              `)();

              if (evalTest.success) {
                const actualStr = JSON.stringify(evalTest.result);
                const expectedStr = String(tc.expectedOutput).trim();
                const passed = actualStr === expectedStr || String(evalTest.result).trim() === expectedStr;

                results.push({
                  id: i + 1,
                  description: tc.description || `Test Case #${i + 1}`,
                  input: tc.input,
                  expected: tc.expectedOutput,
                  actual: actualStr,
                  passed: passed
                });
              } else {
                results.push({
                  id: i + 1,
                  description: tc.description || `Test Case #${i + 1}`,
                  input: tc.input,
                  expected: tc.expectedOutput,
                  actual: evalTest.error || 'N/A',
                  passed: false
                });
              }
            } catch (tcErr) {
              results.push({
                id: i + 1,
                description: tc.description || `Test Case #${i + 1}`,
                input: tc.input,
                expected: tc.expectedOutput,
                actual: tcErr.message,
                passed: false
              });
            }
          }
          setTestResults(results);
          if (results.length > 0) {
            setActiveBottomTab('tests');
          }
        }
      } else {
        logs.push({ 
          type: 'info', 
          text: `[${SUPPORTED_LANGUAGES.find(l => l.id === selectedLang)?.name || selectedLang}] Client-side execution simulated. Ready for AI evaluation on submit.` 
        });
      }
    } catch (err) {
      logs.push({ type: 'error', text: `Runtime Error: ${err.message}` });
      setActiveBottomTab('console');
    } finally {
      const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
      setExecTime(elapsed);
      setConsoleLogs(logs);
      setIsRunning(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        background: '#0d1117',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        ...(isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          borderRadius: 0
        } : {})
      }}
    >
      {/* Editor Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        background: '#161b22',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Language & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            color: '#a5b4fc',
            fontSize: '0.82rem',
            fontWeight: 700
          }}>
            <Code2 size={16} color="#818cf8" />
            <span>Monaco IDE</span>
          </div>

          {/* Language Selector */}
          <select
            value={selectedLang}
            onChange={(e) => handleLanguageSelect(e.target.value)}
            disabled={readOnly}
            style={{
              background: '#0d1117',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e6edf3',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: '#0d1117',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#8b949e',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions (Run, Reset, Copy, Fullscreen) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Run Code Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={runCodeInBrowser}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="Run code in browser sandbox"
            >
              <Play size={14} fill="#fff" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          )}

          {/* Reset Code */}
          {!readOnly && starterCode && (
            <button
              type="button"
              onClick={handleResetCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#8b949e',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Reset to starter code"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: copied ? '#34d399' : '#8b949e',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#8b949e',
              cursor: 'pointer'
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Canvas */}
      <div style={{ flex: isFullscreen ? 1 : 'none', position: 'relative' }}>
        <Editor
          height={isFullscreen ? 'calc(100vh - 220px)' : height}
          language={selectedLang}
          value={code}
          theme={theme}
          onChange={(val) => onChange && onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly: readOnly,
            fontSize: fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: 'on',
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            bracketPairColorization: { enabled: true }
          }}
        />
      </div>

      {/* Console & Test Case Output Drawer */}
      <div style={{
        background: '#090d13',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        maxHeight: isFullscreen ? 200 : 160,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Output Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 14px',
          background: '#12171f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setActiveBottomTab('console')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: activeBottomTab === 'console' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeBottomTab === 'console' ? '2px solid #6366f1' : '2px solid transparent',
                color: activeBottomTab === 'console' ? '#fff' : '#8b949e',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Terminal size={13} />
              <span>Console Output ({consoleLogs.length})</span>
            </button>

            {testCases && testCases.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveBottomTab('tests')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: activeBottomTab === 'tests' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeBottomTab === 'tests' ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeBottomTab === 'tests' ? '#fff' : '#8b949e',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Layers size={13} />
                <span>Test Cases ({testResults.filter(t => t.passed).length}/{testCases.length})</span>
              </button>
            )}
          </div>

          {execTime !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e', fontSize: '0.72rem' }}>
              <Clock size={12} color="#6366f1" />
              <span>{execTime} ms</span>
            </div>
          )}
        </div>

        {/* Output Body */}
        <div style={{
          padding: '10px 16px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8rem'
        }}>
          {activeBottomTab === 'console' ? (
            consoleLogs.length === 0 ? (
              <div style={{ color: '#484f58', fontStyle: 'italic' }}>
                Click "Run Code" above to execute solution and inspect stdout / stderr output.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {consoleLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      color: log.type === 'error' ? '#f85149' : (log.type === 'warn' ? '#d29922' : '#7ee787'),
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}
                  >
                    {log.type === 'error' && '❌ '}
                    {log.type === 'warn' && '⚠️ '}
                    {log.type === 'log' && '➜ '}
                    {log.text}
                  </div>
                ))}
              </div>
            )
          ) : (
            testResults.length === 0 ? (
              <div style={{ color: '#484f58', fontStyle: 'italic' }}>
                Run your code to validate outputs against predefined test cases.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {testResults.map((tr) => (
                  <div 
                    key={tr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: tr.passed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                      border: `1px solid ${tr.passed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                      borderRadius: '6px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {tr.passed ? <CheckCircle2 size={15} color="#10b981" /> : <XCircle size={15} color="#f43f5e" />}
                      <span style={{ fontWeight: 600, color: '#fff' }}>{tr.description}</span>
                      <span style={{ color: '#8b949e' }}>Input: {tr.input}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#8b949e' }}>Expected: <strong style={{ color: '#a5b4fc' }}>{tr.expected}</strong></span>
                      <span style={{ color: tr.passed ? '#34d399' : '#fb7185' }}>Got: <strong>{tr.actual}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
