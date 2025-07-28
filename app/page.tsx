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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
      const wordArray = data.content.split(/\s+/).filter((word: string) => word.trim().length > 0);
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

    const wordsToSpeak = article.content.split(/\s+/);
    let wordIndex = 0;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentWordIndex(0);
      
      // Start the word highlighting with a more reliable interval
      const avgWordDuration = 60000 / (150 * utterance.rate); // Assuming 150 WPM average reading speed
      
      intervalRef.current = setInterval(() => {
        if (wordIndex < wordsToSpeak.length && speechSynthesis.speaking && !speechSynthesis.paused) {
          setCurrentWordIndex(wordIndex);
          scrollToCurrentWord(wordIndex);
          wordIndex++;
        } else if (wordIndex >= wordsToSpeak.length || !speechSynthesis.speaking) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, avgWordDuration);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    speechSynthesis.speak(utterance);
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const scrollToCurrentWord = (wordIndex: number) => {
    const wordElement = wordRefs.current[wordIndex];
    if (wordElement) {
      // Get the viewport height
      const viewportHeight = window.innerHeight;
      const wordRect = wordElement.getBoundingClientRect();
      
      // Check if word is outside the viewport or near the bottom/top edges
      const isAboveViewport = wordRect.top < 100;
      const isBelowViewport = wordRect.bottom > viewportHeight - 150;
      const isOutsideViewport = isAboveViewport || isBelowViewport;
      
      if (isOutsideViewport) {
        wordElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  };

  const renderArticleContent = () => {
    if (!article) return null;

    // Split content into paragraphs
    const paragraphs = article.content.split('\n\n').filter(p => p.trim().length > 0);
    let globalWordIndex = 0;

    return paragraphs.map((paragraph, paragraphIndex) => {
      const paragraphWords = paragraph.split(/\s+/).filter(word => word.trim().length > 0);
      
      const renderedParagraph = paragraphWords.map((word, wordIndex) => {
        const currentGlobalIndex = globalWordIndex + wordIndex;
        return (
          <span
            key={currentGlobalIndex}
            ref={(el) => { wordRefs.current[currentGlobalIndex] = el; }}
            className={`${
              currentGlobalIndex === currentWordIndex 
                ? 'bg-blue-200 text-blue-900 px-1 rounded transition-all duration-200 shadow-sm' 
                : ''
            }`}
          >
            {word}{wordIndex < paragraphWords.length - 1 ? ' ' : ''}
          </span>
        );
      });

      globalWordIndex += paragraphWords.length;

      return (
        <p key={paragraphIndex} className="mb-6 leading-relaxed text-gray-800">
          {renderedParagraph}
        </p>
      );
    });
  };

  // Check if speech synthesis is supported
  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              📖 Article Reader
            </h1>
            <p className="text-gray-600 text-lg">
              Extract and listen to articles with intelligent text-to-speech
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
                📰 Article URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-favorite-article"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <div className="w-6 h-6 text-gray-400">
                    🔗
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Extracting Article...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✨ Extract Article
                </span>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">❌</div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Article Content */}
        {article && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Article Header */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {article.title}
              </h2>
              
              {article.excerpt && (
                <div className="bg-white/70 rounded-xl p-4 border-l-4 border-blue-400">
                  <p className="text-gray-700 italic text-lg leading-relaxed">
                    💭 {article.excerpt}
                  </p>
                </div>
              )}
            </div>
            
            {/* Speech Controls */}
            {isSpeechSupported && (
              <div className="p-6 bg-gray-50/50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!isPlaying ? (
                      <button
                        onClick={startSpeech}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
                        title="Start reading aloud"
                      >
                        <span className="text-lg">🎵</span>
                        Play Audio
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {!isPaused ? (
                          <button
                            onClick={pauseSpeech}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-200 font-semibold shadow-lg"
                            title="Pause reading"
                          >
                            <span className="text-lg">⏸️</span>
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={resumeSpeech}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-semibold shadow-lg"
                            title="Resume reading"
                          >
                            <span className="text-lg">▶️</span>
                            Resume
                          </button>
                        )}
                        
                        <button
                          onClick={stopSpeech}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 font-semibold shadow-lg"
                          title="Stop reading"
                        >
                          <span className="text-lg">⏹️</span>
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isPlaying && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/80 rounded-full shadow-sm border">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Reading aloud...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Article Content */}
            <div className="p-8" ref={articleContentRef}>
              <div className="prose prose-lg prose-gray max-w-none">
                <div className="text-gray-800 leading-relaxed text-lg">
                  {renderArticleContent()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
