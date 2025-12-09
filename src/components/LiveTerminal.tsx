"use client";
import React, { useState, useEffect } from 'react';

interface TerminalProps {
  generatedCode: string;
  languageProp?: string; // This gets the language from the main page
}

export default function LiveTerminal({ generatedCode, languageProp }: TerminalProps) {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("// Output will appear here...");
  const [stdin, setStdin] = useState("");
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // 1. Sync Code: When Gemini creates code, put it in the box
  useEffect(() => {
    if (generatedCode) {
      setCode(generatedCode);
    }
  }, [generatedCode]);

  // 2. Sync Language: If you pick "Java" at the top, select "Java" here too
  useEffect(() => {
    if (languageProp) {
      setLanguage(languageProp.toLowerCase());
    }
  }, [languageProp]);

  // Helper to run code on Piston
  const executePiston = async (codeToRun: string, inputToGive: string) => {
    // Only support C, Java, Python
    const runtimes: Record<string, { language: string; version: string }> = {
      python: { language: "python", version: "3.10.0" },
      java: { language: "java", version: "15.0.2" },
      c: { language: "c", version: "10.2.0" },
    };

    // Default to python if something is wrong
    const runtime = runtimes[language] || runtimes["python"];

    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: codeToRun }],
        stdin: inputToGive
      }),
    });
    return await response.json();
  };

  // Feature: Verify Code (Check Syntax)
  const verifyCode = async () => {
    setIsVerifying(true);
    setOutput("Checking syntax...");
    
    try {
      // Run with empty input just to see if it compiles/starts
      const data = await executePiston(code, "");
      
      if (data.run && data.run.stderr) {
        setOutput(`❌ Error Found:\n${data.run.stderr}`);
      } else {
        setOutput("✅ Code looks good! No syntax errors found.\n(Now fill in the input box and click Run Code)");
      }
    } catch (err) {
      setOutput("Could not verify code.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Feature: Run Code
  const runCode = async () => {
    setIsRunning(true);
    setOutput("Compiling and running...");

    try {
      const data = await executePiston(code, stdin);

      if (data.message) {
        setOutput(`System Error: ${data.message}`);
      } else if (data.run.stderr) {
        setOutput(`⚠️ Execution Error:\n${data.run.stderr}`);
      } else {
        setOutput(`> Output:\n${data.run.stdout}`);
      }
    } catch (error) {
      setOutput("Error connecting to server.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem',
      backgroundColor: '#0d1117',
      borderRadius: '8px',
      border: '1px solid #30363d',
      fontFamily: 'monospace',
      color: '#c9d1d9'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#58a6ff' }}>💻 Terminal</h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Only C, Java, Python */}
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid #30363d' }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>

          {/* Verify Button */}
          <button 
            onClick={verifyCode}
            disabled={isVerifying || isRunning}
            style={{ padding: '5px 15px', borderRadius: '4px', background: '#1f6feb', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {isVerifying ? 'Checking...' : '✓ Check Syntax'}
          </button>

          {/* Run Button */}
          <button 
            onClick={runCode} 
            disabled={isRunning || isVerifying}
            style={{ padding: '5px 15px', borderRadius: '4px', background: '#238636', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRunning ? 'Running...' : '▶ Run Code'}
          </button>
        </div>
      </div>

      <textarea 
        value={code} 
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{ width: '100%', height: '150px', background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontFamily: 'monospace' }}
      />

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '0.8em', color: '#8b949e', marginBottom: '5px' }}>
           Program Input (Type numbers here):
        </label>
        <textarea 
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="e.g. 10&#10;20"
          style={{ width: '100%', height: '50px', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', padding: '10px', borderRadius: '4px', fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ background: '#010409', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #2ea043', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
        {output}
      </div>
    </div>
  );
}
