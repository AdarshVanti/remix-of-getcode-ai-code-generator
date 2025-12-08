"use client";
import React, { useState, useEffect } from 'react';

// Define the shape of the API response for strict TypeScript safety
interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
  };
  message?: string;
}

interface TerminalProps {
  generatedCode: string; // The code coming from Gemini
}

export default function LiveTerminal({ generatedCode }: TerminalProps) {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("// Click 'Run' to execute code...");
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);

  // Automatically update the terminal when Gemini generates new code
  useEffect(() => {
    if (generatedCode) {
      setCode(generatedCode);
    }
  }, [generatedCode]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Compiling and running on remote server...");

    // Map your UI languages to Piston API versions
    const runtimes: Record<string, { language: string; version: string }> = {
      python: { language: "python", version: "3.10.0" },
      javascript: { language: "javascript", version: "18.15.0" },
      java: { language: "java", version: "15.0.2" },
      c: { language: "c", version: "10.2.0" },
      cpp: { language: "c++", version: "10.2.0" },
    };

    const runtime = runtimes[language];

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: code }],
        }),
      });

      const data: PistonResponse = await response.json();

      if (data.message) {
        setOutput(`Error: ${data.message}`);
      } else if (data.run.stderr) {
        setOutput(`⚠️ Execution Error:\n${data.run.stderr}`);
      } else {
        setOutput(`> Output:\n${data.run.stdout}`);
      }
    } catch (error) {
      setOutput("Error connecting to execution server.");
      console.error(error);
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
        <h3 style={{ margin: 0, color: '#58a6ff' }}>💻 Live Execution Terminal</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: '4px', background: '#21262d', color: 'white', border: '1px solid #30363d' }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
          <button 
            onClick={runCode} 
            disabled={isRunning}
            style={{
              padding: '5px 15px',
              borderRadius: '4px',
              background: isRunning ? '#238636' : '#2ea043',
              color: 'white',
              border: 'none',
              cursor: isRunning ? 'wait' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isRunning ? 'Running...' : '▶ Run Code'}
          </button>
        </div>
      </div>

      <textarea 
        value={code} 
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          height: '150px',
          background: '#0d1117',
          color: '#e6edf3',
          border: '1px solid #30363d',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontFamily: 'Consolas, "Courier New", monospace'
        }}
      />

      <div style={{
        background: '#010409',
        padding: '15px',
        borderRadius: '4px',
        borderLeft: '4px solid #2ea043',
        minHeight: '80px',
        whiteSpace: 'pre-wrap'
      }}>
        {output}
      </div>
    </div>
  );
          }
