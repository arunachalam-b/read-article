'use client';

import { useState, useRef, useEffect } from 'react';

interface ArticleData {
  title: string;
  content: string;
  excerpt: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Speech-related state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  
  // Refs
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const articleContentRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setArticle(null);
    stopSpeech(); // Stop any ongoing speech

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract article');
      }

      setArticle(data);
      // Split content into words for highlighting
      const wordArray = data.content.split(/(\s+)/).filter((word: string) => word.trim().length > 0);
      setWords(wordArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startSpeech = () => {
    if (!article || !words.length) return;

    // Stop any existing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(article.content);
    speechRef.current = utterance;

    // Configure speech settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    let wordIndex = 0;
    const wordsToSpeak = article.content.split(/\s+/);

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentWordIndex(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    // Use a different approach for word tracking since boundary events are unreliable
    const speakWithHighlight = () => {
      if (wordIndex < wordsToSpeak.length && isPlaying) {
        setCurrentWordIndex(wordIndex);
        scrollToCurrentWord(wordIndex);
        wordIndex++;
        
        // Estimate timing based on word length and speech rate
        const wordDuration = (wordsToSpeak[wordIndex - 1]?.length || 3) * 100 + 200;
        setTimeout(speakWithHighlight, wordDuration);
      }
    };

    speechSynthesis.speak(utterance);
    setTimeout(speakWithHighlight, 500); // Start highlighting after a brief delay
  };

  const pauseSpeech = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  };

  const scrollToCurrentWord = (wordIndex: number) => {
    const wordElement = wordRefs.current[wordIndex];
    if (wordElement && articleContentRef.current) {
      const container = articleContentRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = wordElement.getBoundingClientRect();
      
      // Check if word is near the bottom of the visible area
      if (wordRect.bottom > containerRect.bottom - 100) {
        wordElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  };

  const renderArticleContent = () => {
    if (!article || !words.length) return article?.content;

    const contentWords = article.content.split(/\s+/);
    
    return contentWords.map((word, index) => (
      <span
        key={index}
        ref={(el) => { wordRefs.current[index] = el; }}
        className={`${
          index === currentWordIndex 
            ? 'bg-yellow-200 transition-colors duration-200' 
            : ''
        }`}
      >
        {word}{index < contentWords.length - 1 ? ' ' : ''}
      </span>
    ));
  };

  // Check if speech synthesis is supported
  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Article Reader
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Article URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Extracting...' : 'Extract Article'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {article && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {article.title}
            </h2>
            
            {article.excerpt && (
              <p className="text-gray-600 italic mb-6 pb-4 border-b border-gray-200">
                {article.excerpt}
              </p>
            )}
            
            {/* Speech Controls */}
            {isSpeechSupported && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  {!isPlaying ? (
                    <button
                      onClick={startSpeech}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      title="Start reading aloud"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Play
                    </button>
                  ) : (
                    <>
                      {!isPaused ? (
                        <button
                          onClick={pauseSpeech}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                          title="Pause reading"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={resumeSpeech}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                          title="Resume reading"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Resume
                        </button>
                      )}
                      
                      <button
                        onClick={stopSpeech}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Stop reading"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        Stop
                      </button>
                    </>
                  )}
                </div>
                
                {isPlaying && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Reading aloud...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="prose prose-gray max-w-none" ref={articleContentRef}>
              <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
                {renderArticleContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
