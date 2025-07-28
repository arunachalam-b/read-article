'use client';

import { useState, useRef, useEffect, ReactElement } from 'react';

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
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  
  // Refs
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const articleContentRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const currentSentenceRef = useRef<number>(-1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
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
      // Split content into sentences for highlighting using consistent logic
      const sentenceArray = data.content
        .split(/([.!?]+)/)
        .reduce((acc: string[], part: string, index: number) => {
          if (index % 2 === 0) {
            // This is the sentence content
            if (part.trim()) {
              acc.push(part.trim());
            }
          } else {
            // This is the punctuation, add it to the last sentence
            if (acc.length > 0) {
              acc[acc.length - 1] += part;
            }
          }
          return acc;
        }, [])
        .filter((sentence: string) => sentence.trim().length > 0);
      setSentences(sentenceArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const speakSentence = (sentenceIndex: number) => {
    if (sentenceIndex >= sentences.length) {
      // Finished reading all sentences
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      currentSentenceRef.current = -1;
      return;
    }

    const sentence = sentences[sentenceIndex];
    const utterance = new SpeechSynthesisUtterance(sentence);
    speechRef.current = utterance;

    // Configure speech settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Highlight current sentence
    setCurrentSentenceIndex(sentenceIndex);
    currentSentenceRef.current = sentenceIndex;
    scrollToCurrentSentence(sentenceIndex);

    utterance.onend = () => {
      // Move to next sentence
      speakSentence(sentenceIndex + 1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      currentSentenceRef.current = -1;
    };

    speechSynthesis.speak(utterance);
  };

  const startSpeech = () => {
    if (!article || !sentences.length) return;

    // Stop any existing speech
    speechSynthesis.cancel();

    setIsPlaying(true);
    setIsPaused(false);
    
    // Start reading from the first sentence
    speakSentence(0);
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
    setCurrentSentenceIndex(-1);
    currentSentenceRef.current = -1;
  };

  const scrollToCurrentSentence = (sentenceIndex: number) => {
    const sentenceElement = sentenceRefs.current[sentenceIndex];
    if (sentenceElement) {
      // Get the viewport height
      const viewportHeight = window.innerHeight;
      const sentenceRect = sentenceElement.getBoundingClientRect();
      
      // Check if sentence is outside the viewport or near the bottom/top edges
      const isAboveViewport = sentenceRect.top < 100;
      const isBelowViewport = sentenceRect.bottom > viewportHeight - 150;
      const isOutsideViewport = isAboveViewport || isBelowViewport;
      
      if (isOutsideViewport) {
        sentenceElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  };

  const renderArticleContent = () => {
    if (!article || !sentences.length) return null;

    // Simple approach: render all sentences in order with paragraph breaks
    const originalText = article.content;
    const paragraphBreaks = new Set<number>();
    
    // Find where paragraph breaks should be by tracking sentence positions in original text
    let searchPos = 0;
    sentences.forEach((sentence, index) => {
      const sentenceStart = originalText.indexOf(sentence.replace(/[.!?]+$/, ''), searchPos);
      if (sentenceStart !== -1) {
        // Check if there are double line breaks before this sentence
        const textBefore = originalText.substring(0, sentenceStart);
        const lastDoubleBreak = textBefore.lastIndexOf('\n\n');
        const lastSentenceEnd = searchPos > 0 ? searchPos : 0;
        
        if (lastDoubleBreak > lastSentenceEnd) {
          paragraphBreaks.add(index);
        }
        
        searchPos = sentenceStart + sentence.length;
      }
    });

    const elements: ReactElement[] = [];
    let currentParagraph: ReactElement[] = [];

    sentences.forEach((sentence, index) => {
      // Add paragraph break if needed
      if (paragraphBreaks.has(index) && currentParagraph.length > 0) {
        elements.push(
          <p key={`para-${elements.length}`} className="mb-6 leading-relaxed text-gray-800">
            {currentParagraph}
          </p>
        );
        currentParagraph = [];
      }

      currentParagraph.push(
        <span
          key={index}
          ref={(el) => { sentenceRefs.current[index] = el; }}
          className={`${
            index === currentSentenceIndex 
              ? 'bg-blue-200 text-blue-900 px-2 py-1 rounded-lg transition-all duration-300 shadow-sm' 
              : ''
          }`}
        >
          {sentence}
          {index < sentences.length - 1 ? ' ' : ''}
        </span>
      );
    });

    // Add the last paragraph
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`para-${elements.length}`} className="mb-6 leading-relaxed text-gray-800">
          {currentParagraph}
        </p>
      );
    }

    return <>{elements}</>;
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
                        <span className="text-sm font-medium text-gray-700">
                          Reading sentence {currentSentenceIndex + 1} of {sentences.length}
                        </span>
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
