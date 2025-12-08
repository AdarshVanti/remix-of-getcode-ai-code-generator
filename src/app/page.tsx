"use client";
import LiveTerminal from '@/components/LiveTerminal';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('Python');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  /**
   * Main function to generate code
   * Calls the backend API with prompt and language
   */
  const generateCode = async () => {
    // Clear previous state
    setError('');
    setGeneratedCode('');

    // Validate input
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

  /**
   * Copy generated code to clipboard
   */
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Handle Enter key press in input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      generateCode();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
            GetCode
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Automatic Code Generator
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/50 p-8 sm:p-10 mb-8 animate-fade-in-up">
          {/* Prompt Input */}
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

          {/* Language Selection */}
          <div className="mb-8">
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

          {/* Generate Button */}
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

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Code Output Section */}
        {generatedCode && (
          <>
            {/* 1. The Code Display Block */}
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

            {/* 2. The Live Terminal Block (Only shows if code exists) */}
            <LiveTerminal generatedCode={generatedCode} />
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-600 text-sm animate-fade-in">
          © Adarsh, Danappa & Mazin Ali
        </footer>
      </div>
    </div>
  );
          }
