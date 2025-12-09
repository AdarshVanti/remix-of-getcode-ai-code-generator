"use client";
import LiveTerminal from '@/components/LiveTerminal';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, Zap, Sparkles } from 'lucide-react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('Python');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Simple Mode Switch State
  const [simpleMode, setSimpleMode] = useState(true);

  const generateCode = async () => {
    setError('');
    setGeneratedCode('');

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          language,
          simpleMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate code');
        return;
      }

      setGeneratedCode(data.code);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      generateCode();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
            GetCode
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Automatic Code Generator
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 p-8 sm:p-10 mb-8 animate-fade-in-up">
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-3">
              Enter your prompt
            </label>
            <Input
              id="prompt"
              type="text"
              placeholder="e.g., Create a function to calculate factorial"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="w-full h-12 text-base rounded-xl shadow-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Language
              </label>
              <div className="flex gap-3 flex-wrap">
                {['C', 'Java', 'Python'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    disabled={isLoading}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      language === lang
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200 scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Mode Toggle */}
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <label className="flex items-center cursor-pointer gap-3">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={simpleMode}
                            onChange={() => setSimpleMode(!simpleMode)}
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ${simpleMode ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${simpleMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                        {simpleMode ? (
                            <span className="flex items-center text-green-700"><Zap className="w-4 h-4 mr-1"/> Simple Mode</span>
                        ) : (
                            <span className="flex items-center text-gray-600"><Sparkles className="w-4 h-4 mr-1"/> Complex Mode</span>
                        )}
                    </div>
                </label>
            </div>
          </div>

          <Button
            onClick={generateCode}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Code'
            )}
          </Button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {generatedCode && (
          <>
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 p-8 animate-fade-in-up mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Code
                </h3>
                <Button
                  onClick={copyCode}
                  variant="outline"
                  size="sm"
                  className="rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            </div>

            {/* This is the line that fixes the sync issue! */}
            <LiveTerminal generatedCode={generatedCode} languageProp={language} />
          </>
        )}

        <footer className="text-center mt-12 text-gray-600 text-sm animate-fade-in">
          © Adarsh, Danappa & Mazin Ali
        </footer>
      </div>
    </div>
  );
}
